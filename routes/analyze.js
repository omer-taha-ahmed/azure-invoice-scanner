// ============================================================
// Analyze Routes — AI Document Intelligence Integration
// ============================================================
// Uses Azure AI Document Intelligence to extract data from
// uploaded invoices/receipts and stores results in SQL DB
// ============================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { DocumentAnalysisClient } = require('@azure/ai-form-recognizer');
const { getPool, sql } = require('../db/connection');

// Configure multer for file uploads (store in memory — we send to AI, not disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB max (free tier friendly)
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: JPEG, PNG, BMP, TIFF, PDF'));
        }
    }
});

// Get Document Intelligence client
function getDocIntelligenceClient() {
    const endpoint = process.env.DOC_INTELLIGENCE_ENDPOINT;
    const key = process.env.DOC_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
        throw new Error('Document Intelligence credentials not configured. Set DOC_INTELLIGENCE_ENDPOINT and DOC_INTELLIGENCE_KEY.');
    }

    return new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
}

// ── POST /api/analyze/invoice ───────────────────────────────
// Upload and analyze an invoice/receipt using AI
router.post('/invoice', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please attach a receipt or invoice image/PDF.' });
        }

        console.log(`📄 Analyzing: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

        // ── Step 1: Send to Azure AI Document Intelligence ─────
        const client = getDocIntelligenceClient();

        // Use the prebuilt invoice model (works for receipts too)
        const poller = await client.beginAnalyzeDocument(
            'prebuilt-invoice',
            req.file.buffer
        );
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return res.status(422).json({
                error: 'Could not extract data from this document. Please try a clearer image.'
            });
        }

        const invoice = result.documents[0];
        const fields = invoice.fields;

        // ── Step 2: Extract structured data ────────────────────
        const extractedData = {
            vendorName: fields.VendorName?.content || fields.MerchantName?.content || 'Unknown Vendor',
            invoiceDate: fields.InvoiceDate?.content || fields.TransactionDate?.content || null,
            totalAmount: fields.InvoiceTotal?.value || fields.Total?.value || 0,
            subtotal: fields.SubTotal?.value || null,
            taxAmount: fields.TotalTax?.value || fields.Tax?.value || null,
            currency: fields.InvoiceTotal?.currencyCode || fields.Total?.currencyCode || 'USD',
            confidence: invoice.confidence || 0,
            lineItems: []
        };

        // Extract line items if present
        const items = fields.Items?.values || [];
        for (const item of items) {
            const itemFields = item.properties || {};
            extractedData.lineItems.push({
                description: itemFields.Description?.content || 'Item',
                quantity: itemFields.Quantity?.value || 1,
                unitPrice: itemFields.UnitPrice?.value || null,
                amount: itemFields.Amount?.value || 0
            });
        }

        // Parse the date properly
        let parsedDate = null;
        if (extractedData.invoiceDate) {
            const d = new Date(extractedData.invoiceDate);
            if (!isNaN(d.getTime())) {
                parsedDate = d;
            }
        }

        // ── Step 3: Store in Azure SQL Database ─────────────────
        const db = await getPool();

        // Insert document record
        const docResult = await db.request()
            .input('fileName', sql.NVarChar, req.file.originalname)
            .input('vendorName', sql.NVarChar, extractedData.vendorName)
            .input('invoiceDate', sql.Date, parsedDate)
            .input('totalAmount', sql.Decimal(12, 2), extractedData.totalAmount)
            .input('subtotal', sql.Decimal(12, 2), extractedData.subtotal)
            .input('taxAmount', sql.Decimal(12, 2), extractedData.taxAmount)
            .input('currency', sql.NVarChar, extractedData.currency)
            .input('confidence', sql.Decimal(5, 4), extractedData.confidence)
            .input('rawText', sql.NVarChar, result.content || '')
            .query(`
        INSERT INTO documents 
          (file_name, vendor_name, invoice_date, total_amount, subtotal, tax_amount, currency, confidence_score, raw_text)
        OUTPUT INSERTED.id
        VALUES 
          (@fileName, @vendorName, @invoiceDate, @totalAmount, @subtotal, @taxAmount, @currency, @confidence, @rawText)
      `);

        const documentId = docResult.recordset[0].id;

        // Insert line items
        for (const item of extractedData.lineItems) {
            await db.request()
                .input('documentId', sql.Int, documentId)
                .input('description', sql.NVarChar, item.description)
                .input('quantity', sql.Decimal(10, 2), item.quantity)
                .input('unitPrice', sql.Decimal(12, 2), item.unitPrice)
                .input('amount', sql.Decimal(12, 2), item.amount)
                .query(`
          INSERT INTO line_items (document_id, description, quantity, unit_price, amount)
          VALUES (@documentId, @description, @quantity, @unitPrice, @amount)
        `);
        }

        console.log(`✅ Document #${documentId} saved: ${extractedData.vendorName} — $${extractedData.totalAmount}`);

        // ── Step 4: Return results ─────────────────────────────
        res.json({
            success: true,
            documentId,
            extracted: extractedData,
            message: `Successfully extracted data from ${req.file.originalname}`
        });

    } catch (err) {
        console.error('Error analyzing document:', err);

        if (err.message.includes('credentials')) {
            return res.status(503).json({ error: 'AI service not configured. Please check your Document Intelligence settings.' });
        }
        if (err.message.includes('Invalid file type')) {
            return res.status(400).json({ error: err.message });
        }

        res.status(500).json({ error: 'Failed to analyze document. Please try again.' });
    }
});

// ── POST /api/analyze/receipt ───────────────────────────────
// Alias for analyzing receipts (uses receipt-specific model)
router.post('/receipt', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        console.log(`🧾 Analyzing receipt: ${req.file.originalname}`);

        const client = getDocIntelligenceClient();

        // Use prebuilt-receipt model (optimized for receipts)
        const poller = await client.beginAnalyzeDocument(
            'prebuilt-receipt',
            req.file.buffer
        );
        const result = await poller.pollUntilDone();

        if (!result.documents || result.documents.length === 0) {
            return res.status(422).json({ error: 'Could not read receipt. Try a clearer photo.' });
        }

        const receipt = result.documents[0];
        const fields = receipt.fields;

        const extractedData = {
            vendorName: fields.MerchantName?.content || 'Unknown',
            invoiceDate: fields.TransactionDate?.content || null,
            totalAmount: fields.Total?.value || 0,
            subtotal: fields.Subtotal?.value || null,
            taxAmount: fields.TotalTax?.value || null,
            currency: fields.Total?.currencyCode || 'USD',
            confidence: receipt.confidence || 0,
            lineItems: []
        };

        const items = fields.Items?.values || [];
        for (const item of items) {
            const f = item.properties || {};
            extractedData.lineItems.push({
                description: f.Description?.content || 'Item',
                quantity: f.Quantity?.value || 1,
                unitPrice: f.Price?.value || null,
                amount: f.TotalPrice?.value || 0
            });
        }

        // Parse date
        let parsedDate = null;
        if (extractedData.invoiceDate) {
            const d = new Date(extractedData.invoiceDate);
            if (!isNaN(d.getTime())) parsedDate = d;
        }

        // Save to DB
        const db = await getPool();
        const docResult = await db.request()
            .input('fileName', sql.NVarChar, req.file.originalname)
            .input('vendorName', sql.NVarChar, extractedData.vendorName)
            .input('invoiceDate', sql.Date, parsedDate)
            .input('totalAmount', sql.Decimal(12, 2), extractedData.totalAmount)
            .input('subtotal', sql.Decimal(12, 2), extractedData.subtotal)
            .input('taxAmount', sql.Decimal(12, 2), extractedData.taxAmount)
            .input('currency', sql.NVarChar, extractedData.currency)
            .input('confidence', sql.Decimal(5, 4), extractedData.confidence)
            .input('rawText', sql.NVarChar, result.content || '')
            .query(`
        INSERT INTO documents 
          (file_name, vendor_name, invoice_date, total_amount, subtotal, tax_amount, currency, confidence_score, raw_text)
        OUTPUT INSERTED.id
        VALUES 
          (@fileName, @vendorName, @invoiceDate, @totalAmount, @subtotal, @taxAmount, @currency, @confidence, @rawText)
      `);

        const documentId = docResult.recordset[0].id;

        for (const item of extractedData.lineItems) {
            await db.request()
                .input('documentId', sql.Int, documentId)
                .input('description', sql.NVarChar, item.description)
                .input('quantity', sql.Decimal(10, 2), item.quantity)
                .input('unitPrice', sql.Decimal(12, 2), item.unitPrice)
                .input('amount', sql.Decimal(12, 2), item.amount)
                .query(`
          INSERT INTO line_items (document_id, description, quantity, unit_price, amount)
          VALUES (@documentId, @description, @quantity, @unitPrice, @amount)
        `);
        }

        res.json({
            success: true,
            documentId,
            extracted: extractedData,
            message: `Receipt analyzed: ${extractedData.vendorName}`
        });

    } catch (err) {
        console.error('Error analyzing receipt:', err);
        res.status(500).json({ error: 'Failed to analyze receipt.' });
    }
});

module.exports = router;
