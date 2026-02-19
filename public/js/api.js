// ============================================================
// API Client — Communicates with Azure Functions Backend
// ============================================================

const API = {
    // ── Documents ───────────────────────────────────────────
    async getDocuments(filters = {}) {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.startDate) params.set('startDate', filters.startDate);
        if (filters.endDate) params.set('endDate', filters.endDate);
        if (filters.search) params.set('search', filters.search);

        const url = `/api/documents${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    },

    async getDocument(id) {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) throw new Error('Failed to fetch document');
        return res.json();
    },

    async updateDocument(id, data) {
        const res = await fetch(`/api/documents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update document');
        return res.json();
    },

    async deleteDocument(id) {
        const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete document');
        return res.json();
    },

    // ── Categories ──────────────────────────────────────────
    async getCategories() {
        const res = await fetch('/api/documents/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    // ── Analyze ─────────────────────────────────────────────
    async analyzeDocument(file, type = 'invoice') {
        const formData = new FormData();
        formData.append('document', file);

        const endpoint = type === 'receipt' ? '/api/analyze/receipt' : '/api/analyze/invoice';
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analysis failed');
        return data;
    },

    // ── Dashboard ───────────────────────────────────────────
    async getDashboardSummary() {
        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) throw new Error('Failed to fetch summary');
        return res.json();
    },

    async getSpendingByCategory() {
        const res = await fetch('/api/dashboard/by-category');
        if (!res.ok) throw new Error('Failed to fetch category data');
        return res.json();
    },

    async getMonthlyTrend() {
        const res = await fetch('/api/dashboard/by-month');
        if (!res.ok) throw new Error('Failed to fetch monthly data');
        return res.json();
    },

    async getTopVendors() {
        const res = await fetch('/api/dashboard/top-vendors');
        if (!res.ok) throw new Error('Failed to fetch vendors');
        return res.json();
    },

    async getRecentActivity() {
        const res = await fetch('/api/dashboard/recent');
        if (!res.ok) throw new Error('Failed to fetch recent activity');
        return res.json();
    },

    // ── Health Check ────────────────────────────────────────
    async healthCheck() {
        try {
            const res = await fetch('/api/health');
            return res.ok;
        } catch {
            return false;
        }
    }
};
