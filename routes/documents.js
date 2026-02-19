// ============================================================
// Documents Routes — CRUD for scanned invoices/receipts
// ============================================================

const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/connection');

// ── GET /api/documents ──────────────────────────────────────
// List all documents with optional filtering
router.get('/', async (req, res) => {
    try {
        const { category, startDate, endDate, search, limit = 50 } = req.query;
        const db = await getPool();

        let query = `
      SELECT TOP (@limit)
        d.id, d.file_name, d.vendor_name, d.invoice_date, 
        d.total_amount, d.subtotal, d.tax_amount, d.currency,
        d.category_id, d.confidence_score, d.created_at,
        c.name AS category_name, c.icon AS category_icon,
        (SELECT COUNT(*) FROM line_items li WHERE li.document_id = d.id) AS item_count
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE 1=1
    `;

        const request = db.request();
        request.input('limit', sql.Int, parseInt(limit));

        if (category) {
            query += ' AND d.category_id = @categoryId';
            request.input('categoryId', sql.Int, parseInt(category));
        }
        if (startDate) {
            query += ' AND d.invoice_date >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }
        if (endDate) {
            query += ' AND d.invoice_date <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }
        if (search) {
            query += ' AND (d.vendor_name LIKE @search OR d.file_name LIKE @search)';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' ORDER BY d.created_at DESC';

        const result = await request.query(query);
        res.json({ documents: result.recordset });
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// ── GET /api/documents/categories ───────────────────────────
// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request().query('SELECT id, name, icon FROM categories ORDER BY name');
        res.json({ categories: result.recordset });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ── GET /api/documents/:id ──────────────────────────────────
// Get a single document with its line items
router.get('/:id', async (req, res) => {
    try {
        const db = await getPool();
        const request = db.request();
        request.input('id', sql.Int, parseInt(req.params.id));

        // Get document
        const docResult = await request.query(`
      SELECT d.*, c.name AS category_name, c.icon AS category_icon
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = @id
    `);

        if (docResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Get line items
        const itemsResult = await db.request()
            .input('docId', sql.Int, parseInt(req.params.id))
            .query('SELECT * FROM line_items WHERE document_id = @docId ORDER BY id');

        res.json({
            document: docResult.recordset[0],
            lineItems: itemsResult.recordset
        });
    } catch (err) {
        console.error('Error fetching document:', err);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// ── PUT /api/documents/:id ──────────────────────────────────
// Update document category
router.put('/:id', async (req, res) => {
    try {
        const { category_id } = req.body;
        const db = await getPool();

        await db.request()
            .input('id', sql.Int, parseInt(req.params.id))
            .input('categoryId', sql.Int, category_id)
            .query('UPDATE documents SET category_id = @categoryId WHERE id = @id');

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// ── DELETE /api/documents/:id ───────────────────────────────
// Delete a document and its line items (cascade)
router.delete('/:id', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request()
            .input('id', sql.Int, parseInt(req.params.id))
            .query('DELETE FROM documents WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

module.exports = router;
