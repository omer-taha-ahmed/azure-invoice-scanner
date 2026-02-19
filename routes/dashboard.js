// ============================================================
// Dashboard Routes — Spending Analytics & Summary
// ============================================================

const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/connection');

// ── GET /api/dashboard/summary ──────────────────────────────
// Get overall spending summary
router.get('/summary', async (req, res) => {
    try {
        const db = await getPool();

        // Total documents scanned
        const countResult = await db.request().query(
            'SELECT COUNT(*) AS total_documents FROM documents'
        );

        // Total spending
        const spendingResult = await db.request().query(
            'SELECT ISNULL(SUM(total_amount), 0) AS total_spending FROM documents'
        );

        // Average per document
        const avgResult = await db.request().query(
            'SELECT ISNULL(AVG(total_amount), 0) AS avg_amount FROM documents'
        );

        // This month's spending
        const monthResult = await db.request().query(`
      SELECT ISNULL(SUM(total_amount), 0) AS month_spending
      FROM documents
      WHERE invoice_date >= DATEADD(DAY, 1-DAY(GETDATE()), CAST(GETDATE() AS DATE))
        AND invoice_date < DATEADD(MONTH, 1, DATEADD(DAY, 1-DAY(GETDATE()), CAST(GETDATE() AS DATE)))
    `);

        // Average confidence score
        const confidenceResult = await db.request().query(
            'SELECT ISNULL(AVG(confidence_score), 0) AS avg_confidence FROM documents'
        );

        res.json({
            totalDocuments: countResult.recordset[0].total_documents,
            totalSpending: parseFloat(spendingResult.recordset[0].total_spending) || 0,
            averageAmount: parseFloat(avgResult.recordset[0].avg_amount) || 0,
            monthSpending: parseFloat(monthResult.recordset[0].month_spending) || 0,
            avgConfidence: parseFloat(confidenceResult.recordset[0].avg_confidence) || 0
        });
    } catch (err) {
        console.error('Error fetching summary:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
});

// ── GET /api/dashboard/by-category ──────────────────────────
// Spending breakdown by category
router.get('/by-category', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request().query(`
      SELECT 
        ISNULL(c.name, 'Uncategorized') AS category,
        ISNULL(c.icon, '📋') AS icon,
        COUNT(d.id) AS document_count,
        ISNULL(SUM(d.total_amount), 0) AS total_amount
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      GROUP BY c.name, c.icon
      ORDER BY total_amount DESC
    `);

        res.json({ categories: result.recordset });
    } catch (err) {
        console.error('Error fetching category breakdown:', err);
        res.status(500).json({ error: 'Failed to fetch category data' });
    }
});

// ── GET /api/dashboard/by-month ─────────────────────────────
// Monthly spending trend (last 12 months)
router.get('/by-month', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request().query(`
      SELECT 
        FORMAT(invoice_date, 'yyyy-MM') AS month,
        COUNT(*) AS document_count,
        ISNULL(SUM(total_amount), 0) AS total_amount
      FROM documents
      WHERE invoice_date >= DATEADD(MONTH, -12, GETDATE())
        AND invoice_date IS NOT NULL
      GROUP BY FORMAT(invoice_date, 'yyyy-MM')
      ORDER BY month ASC
    `);

        res.json({ months: result.recordset });
    } catch (err) {
        console.error('Error fetching monthly data:', err);
        res.status(500).json({ error: 'Failed to fetch monthly data' });
    }
});

// ── GET /api/dashboard/top-vendors ──────────────────────────
// Top vendors by total spending
router.get('/top-vendors', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request().query(`
      SELECT TOP 10
        vendor_name,
        COUNT(*) AS invoice_count,
        ISNULL(SUM(total_amount), 0) AS total_spent
      FROM documents
      WHERE vendor_name IS NOT NULL AND vendor_name != 'Unknown Vendor'
      GROUP BY vendor_name
      ORDER BY total_spent DESC
    `);

        res.json({ vendors: result.recordset });
    } catch (err) {
        console.error('Error fetching vendor data:', err);
        res.status(500).json({ error: 'Failed to fetch vendor data' });
    }
});

// ── GET /api/dashboard/recent ───────────────────────────────
// Recent activity (last 10 scans)
router.get('/recent', async (req, res) => {
    try {
        const db = await getPool();
        const result = await db.request().query(`
      SELECT TOP 10
        d.id, d.file_name, d.vendor_name, d.total_amount,
        d.invoice_date, d.created_at, d.confidence_score,
        c.name AS category_name, c.icon AS category_icon
      FROM documents d
      LEFT JOIN categories c ON d.category_id = c.id
      ORDER BY d.created_at DESC
    `);

        res.json({ recent: result.recordset });
    } catch (err) {
        console.error('Error fetching recent activity:', err);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

module.exports = router;
