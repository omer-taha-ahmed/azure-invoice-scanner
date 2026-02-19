// ============================================================
// InvoiceScan AI — Main Application Controller
// ============================================================

(function () {
    'use strict';

    // ── State ───────────────────────────────────────────────
    let currentPage = 'dashboard';
    let selectedFile = null;
    let selectedDocType = 'invoice';
    let lastDocumentId = null;
    let categoryChart = null;
    let monthlyChart = null;
    let categories = [];

    // ── DOM References ──────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ── Initialize ──────────────────────────────────────────
    async function init() {
        setupNavigation();
        setupFileUpload();
        setupScanPage();
        setupDocumentsPage();
        setupModal();
        setupMobileMenu();
        await loadCategories();
        await loadDashboard();
        checkHealth();
    }

    // ── Navigation ──────────────────────────────────────────
    function setupNavigation() {
        $$('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                navigateTo(page);
            });
        });
    }

    function navigateTo(page) {
        currentPage = page;

        // Update nav active state
        $$('.nav-link').forEach(l => l.classList.remove('active'));
        $(`.nav-link[data-page="${page}"]`).classList.add('active');

        // Show target page
        $$('.page').forEach(p => p.classList.remove('active'));
        $(`#page-${page}`).classList.add('active');

        // Update title
        const titles = { dashboard: 'Dashboard', scan: 'Scan Document', documents: 'Documents' };
        $('#pageTitle').textContent = titles[page] || 'Dashboard';

        // Close mobile sidebar
        $('#sidebar').classList.remove('open');

        // Load page data
        if (page === 'dashboard') loadDashboard();
        if (page === 'documents') loadDocuments();
    }

    // ── Mobile Menu ─────────────────────────────────────────
    function setupMobileMenu() {
        $('#menuToggle').addEventListener('click', () => {
            $('#sidebar').classList.toggle('open');
        });
    }

    // ── Health Check ────────────────────────────────────────
    async function checkHealth() {
        const healthy = await API.healthCheck();
        const badge = $('#statusBadge');
        if (healthy) {
            badge.innerHTML = '<span class="status-dot"></span> Connected';
            badge.style.borderColor = 'rgba(67, 233, 123, 0.2)';
            badge.style.color = '#43e97b';
        } else {
            badge.innerHTML = '<span class="status-dot" style="background:#f5576c"></span> Offline';
            badge.style.borderColor = 'rgba(245, 87, 108, 0.2)';
            badge.style.color = '#f5576c';
        }
    }

    // ── Load Categories ─────────────────────────────────────
    async function loadCategories() {
        try {
            const data = await API.getCategories();
            categories = data.categories || [];
            populateCategoryDropdowns();
        } catch (err) {
            console.warn('Could not load categories:', err.message);
        }
    }

    function populateCategoryDropdowns() {
        const selects = ['#categorySelect', '#filterCategory'];
        selects.forEach(sel => {
            const el = $(sel);
            if (!el) return;
            // Keep first option
            const firstOpt = el.options[0];
            el.innerHTML = '';
            el.appendChild(firstOpt);
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = `${cat.icon} ${cat.name}`;
                el.appendChild(opt);
            });
        });
    }

    // ══════════════════════════════════════════════════════════
    // DASHBOARD
    // ══════════════════════════════════════════════════════════
    async function loadDashboard() {
        try {
            const [summary, catData, monthData, vendors, recent] = await Promise.all([
                API.getDashboardSummary(),
                API.getSpendingByCategory(),
                API.getMonthlyTrend(),
                API.getTopVendors(),
                API.getRecentActivity()
            ]);

            // Summary Cards
            $('#totalDocs').textContent = summary.totalDocuments;
            $('#totalSpending').textContent = formatCurrency(summary.totalSpending);
            $('#monthSpending').textContent = formatCurrency(summary.monthSpending);
            $('#avgConfidence').textContent = (summary.avgConfidence * 100).toFixed(0) + '%';

            // Charts
            renderCategoryChart(catData.categories || []);
            renderMonthlyChart(monthData.months || []);

            // Recent List
            renderRecentList(recent.recent || []);

            // Top Vendors
            renderVendorList(vendors.vendors || []);
        } catch (err) {
            console.warn('Dashboard load error:', err.message);
        }
    }

    function renderCategoryChart(data) {
        const ctx = $('#categoryChart').getContext('2d');
        if (categoryChart) categoryChart.destroy();

        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#43e97b', '#ffa726', '#00f2fe',
            '#e040fb', '#ff6e40'
        ];

        if (data.length === 0) {
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No data yet'],
                    datasets: [{ data: [1], backgroundColor: ['#2a2a45'], borderWidth: 0 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#6a6a80' } } }
                }
            });
            return;
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.category),
                datasets: [{
                    data: data.map(d => parseFloat(d.total_amount)),
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0a0b8',
                            padding: 12,
                            font: { family: 'Inter', size: 12 }
                        }
                    }
                }
            }
        });
    }

    function renderMonthlyChart(data) {
        const ctx = $('#monthlyChart').getContext('2d');
        if (monthlyChart) monthlyChart.destroy();

        if (data.length === 0) {
            monthlyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['No data'],
                    datasets: [{ data: [0], backgroundColor: '#2a2a45', borderRadius: 6 }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: '#6a6a80' }, grid: { display: false } },
                        y: { ticks: { color: '#6a6a80' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                    }
                }
            });
            return;
        }

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => {
                    const [y, m] = d.month.split('-');
                    return new Date(y, m - 1).toLocaleDateString('en', { month: 'short', year: '2-digit' });
                }),
                datasets: [{
                    label: 'Spending',
                    data: data.map(d => parseFloat(d.total_amount)),
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    borderRadius: 6,
                    hoverBackgroundColor: 'rgba(102, 126, 234, 0.85)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#a0a0b8', font: { family: 'Inter', size: 11 } },
                        grid: { display: false }
                    },
                    y: {
                        ticks: {
                            color: '#a0a0b8',
                            font: { family: 'Inter', size: 11 },
                            callback: v => '$' + v
                        },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    }
                }
            }
        });
    }

    function renderRecentList(items) {
        const el = $('#recentList');
        if (items.length === 0) {
            el.innerHTML = '<div class="empty-state-sm">No documents scanned yet</div>';
            return;
        }
        el.innerHTML = items.map(item => `
      <div class="recent-item" onclick="App.viewDocument(${item.id})">
        <div class="recent-info">
          <span class="recent-vendor">${item.category_icon || '📄'} ${escapeHtml(item.vendor_name || 'Unknown')}</span>
          <span class="recent-date">${formatDate(item.invoice_date) || formatDate(item.created_at)}</span>
        </div>
        <span class="recent-amount">${formatCurrency(item.total_amount)}</span>
      </div>
    `).join('');
    }

    function renderVendorList(vendors) {
        const el = $('#vendorList');
        if (vendors.length === 0) {
            el.innerHTML = '<div class="empty-state-sm">No vendor data yet</div>';
            return;
        }
        el.innerHTML = vendors.map(v => `
      <div class="vendor-item">
        <div class="vendor-info">
          <span class="vendor-name">${escapeHtml(v.vendor_name)}</span>
          <span class="vendor-count">${v.invoice_count} invoice${v.invoice_count > 1 ? 's' : ''}</span>
        </div>
        <span class="vendor-total">${formatCurrency(v.total_spent)}</span>
      </div>
    `).join('');
    }

    // ══════════════════════════════════════════════════════════
    // SCAN PAGE
    // ══════════════════════════════════════════════════════════
    function setupFileUpload() {
        const zone = $('#uploadZone');
        const input = $('#fileInput');

        zone.addEventListener('click', () => input.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                handleFileSelection(input.files[0]);
            }
        });
    }

    function handleFileSelection(file) {
        if (file.size > 4 * 1024 * 1024) {
            showToast('File too large. Maximum size is 4 MB.', 'error');
            return;
        }

        selectedFile = file;
        $('#uploadZone').style.display = 'none';
        $('#docTypeSelector').style.display = 'block';
        $('#filePreview').style.display = 'flex';
        $('#analyzeBtn').style.display = 'flex';
        $('#fileName').textContent = file.name;
        $('#fileSize').textContent = formatFileSize(file.size);
    }

    function setupScanPage() {
        // Doc type buttons
        $$('.doc-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.doc-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDocType = btn.dataset.type;
            });
        });

        // Remove file
        $('#removeFile').addEventListener('click', resetScanPage);

        // Analyze button
        $('#analyzeBtn').addEventListener('click', analyzeDocument);

        // Scan another
        $('#scanAnotherBtn').addEventListener('click', () => {
            resetScanPage();
            $('#resultsCard').style.display = 'none';
        });

        // Save category
        $('#saveCategoryBtn').addEventListener('click', async () => {
            const catId = $('#categorySelect').value;
            if (!catId || !lastDocumentId) return;
            try {
                await API.updateDocument(lastDocumentId, { category_id: parseInt(catId) });
                showToast('Category saved!', 'success');
            } catch (err) {
                showToast('Failed to save category', 'error');
            }
        });
    }

    function resetScanPage() {
        selectedFile = null;
        $('#uploadZone').style.display = 'block';
        $('#docTypeSelector').style.display = 'none';
        $('#filePreview').style.display = 'none';
        $('#analyzeBtn').style.display = 'none';
        $('#progressContainer').style.display = 'none';
        $('#fileInput').value = '';
    }

    async function analyzeDocument() {
        if (!selectedFile) return;

        const btn = $('#analyzeBtn');
        const progress = $('#progressContainer');
        const fill = $('#progressFill');
        const text = $('#progressText');

        btn.style.display = 'none';
        progress.style.display = 'block';
        fill.style.width = '20%';
        text.textContent = '📤 Uploading document...';

        try {
            // Simulate progress stages
            setTimeout(() => { fill.style.width = '45%'; text.textContent = '🤖 AI is analyzing your document...'; }, 800);
            setTimeout(() => { fill.style.width = '70%'; text.textContent = '📊 Extracting data...'; }, 2500);

            const result = await API.analyzeDocument(selectedFile, selectedDocType);

            fill.style.width = '100%';
            text.textContent = '✅ Analysis complete!';

            lastDocumentId = result.documentId;
            const data = result.extracted;

            // Display results
            setTimeout(() => {
                progress.style.display = 'none';
                $('#resultsCard').style.display = 'block';

                $('#resultVendor').textContent = data.vendorName || '-';
                $('#resultDate').textContent = data.invoiceDate || '-';
                $('#resultTotal').textContent = formatCurrency(data.totalAmount);
                $('#resultTax').textContent = data.taxAmount ? formatCurrency(data.taxAmount) : '-';
                $('#resultConfidence').textContent = (data.confidence * 100).toFixed(1) + '%';
                $('#resultCurrency').textContent = data.currency || 'USD';

                // Line items
                if (data.lineItems && data.lineItems.length > 0) {
                    $('#lineItemsSection').style.display = 'block';
                    const tbody = $('#lineItemsBody');
                    tbody.innerHTML = data.lineItems.map(item => `
            <tr>
              <td>${escapeHtml(item.description)}</td>
              <td>${item.quantity || '-'}</td>
              <td>${item.unitPrice ? formatCurrency(item.unitPrice) : '-'}</td>
              <td>${formatCurrency(item.amount)}</td>
            </tr>
          `).join('');
                } else {
                    $('#lineItemsSection').style.display = 'none';
                }

                showToast(result.message, 'success');
            }, 500);

        } catch (err) {
            fill.style.width = '100%';
            fill.style.background = 'var(--accent-danger)';
            text.textContent = '❌ ' + err.message;
            showToast(err.message, 'error');

            setTimeout(() => {
                progress.style.display = 'none';
                fill.style.background = '';
                btn.style.display = 'flex';
            }, 3000);
        }
    }

    // ══════════════════════════════════════════════════════════
    // DOCUMENTS PAGE
    // ══════════════════════════════════════════════════════════
    function setupDocumentsPage() {
        $('#applyFilters').addEventListener('click', loadDocuments);
        $('#searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loadDocuments();
        });
    }

    async function loadDocuments() {
        try {
            const filters = {
                search: $('#searchInput').value,
                category: $('#filterCategory').value,
                startDate: $('#filterStartDate').value,
                endDate: $('#filterEndDate').value
            };

            const data = await API.getDocuments(filters);
            renderDocumentsTable(data.documents || []);
        } catch (err) {
            console.warn('Failed to load documents:', err.message);
        }
    }

    function renderDocumentsTable(docs) {
        const tbody = $('#documentsBody');

        if (docs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No documents found. Start scanning!</td></tr>';
            return;
        }

        tbody.innerHTML = docs.map(doc => {
            const conf = doc.confidence_score || 0;
            const confColor = conf >= 0.9 ? '#43e97b' : conf >= 0.7 ? '#ffa726' : '#f5576c';

            return `
        <tr>
          <td><strong>${escapeHtml(doc.vendor_name || 'Unknown')}</strong><br><span style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(doc.file_name)}</span></td>
          <td>${formatDate(doc.invoice_date) || '-'}</td>
          <td style="font-weight:600;color:var(--accent-primary)">${formatCurrency(doc.total_amount)}</td>
          <td>${doc.category_name ? `<span class="category-tag">${doc.category_icon || ''} ${doc.category_name}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
          <td>${doc.item_count || 0}</td>
          <td>
            <span class="confidence-bar"><span class="confidence-fill" style="width:${conf * 100}%;background:${confColor}"></span></span>
            <span style="font-size:0.8rem">${(conf * 100).toFixed(0)}%</span>
          </td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="App.viewDocument(${doc.id})" title="View Details">👁</button>
            <button class="btn btn-sm btn-danger" onclick="App.deleteDocument(${doc.id})" title="Delete">🗑</button>
          </td>
        </tr>
      `;
        }).join('');
    }

    // ── View Document Detail ────────────────────────────────
    async function viewDocument(id) {
        try {
            const data = await API.getDocument(id);
            const doc = data.document;
            const items = data.lineItems || [];

            let html = `
        <div class="result-grid">
          <div class="result-item">
            <span class="result-label">Vendor</span>
            <span class="result-value">${escapeHtml(doc.vendor_name || '-')}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Date</span>
            <span class="result-value">${formatDate(doc.invoice_date) || '-'}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Total</span>
            <span class="result-value result-total">${formatCurrency(doc.total_amount)}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Tax</span>
            <span class="result-value">${doc.tax_amount ? formatCurrency(doc.tax_amount) : '-'}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Confidence</span>
            <span class="result-value">${((doc.confidence_score || 0) * 100).toFixed(1)}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Category</span>
            <span class="result-value">${doc.category_icon || ''} ${doc.category_name || 'Uncategorized'}</span>
          </div>
        </div>
      `;

            if (items.length > 0) {
                html += `
          <h4 class="section-label" style="margin-top:1rem">Line Items</h4>
          <table class="items-table">
            <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${escapeHtml(item.description || '-')}</td>
                  <td>${item.quantity || '-'}</td>
                  <td>${item.unit_price ? formatCurrency(item.unit_price) : '-'}</td>
                  <td>${formatCurrency(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
            }

            if (doc.raw_text) {
                html += `
          <h4 class="section-label" style="margin-top:1rem">Raw Extracted Text</h4>
          <div style="background:var(--bg-input);padding:1rem;border-radius:var(--radius-sm);font-size:0.8rem;color:var(--text-muted);white-space:pre-wrap;max-height:200px;overflow-y:auto">${escapeHtml(doc.raw_text)}</div>
        `;
            }

            $('#modalTitle').textContent = `${doc.vendor_name || 'Document'} — ${formatCurrency(doc.total_amount)}`;
            $('#modalBody').innerHTML = html;
            $('#modalOverlay').classList.add('active');

        } catch (err) {
            showToast('Failed to load document details', 'error');
        }
    }

    // ── Delete Document ─────────────────────────────────────
    async function deleteDocument(id) {
        if (!confirm('Are you sure you want to delete this document?')) return;
        try {
            await API.deleteDocument(id);
            showToast('Document deleted', 'success');
            loadDocuments();
            loadDashboard();
        } catch (err) {
            showToast('Failed to delete document', 'error');
        }
    }

    // ── Modal ───────────────────────────────────────────────
    function setupModal() {
        $('#closeModal').addEventListener('click', () => {
            $('#modalOverlay').classList.remove('active');
        });
        $('#modalOverlay').addEventListener('click', (e) => {
            if (e.target === $('#modalOverlay')) {
                $('#modalOverlay').classList.remove('active');
            }
        });
    }

    // ── Utilities ───────────────────────────────────────────
    function formatCurrency(amount) {
        if (amount == null || isNaN(amount)) return '$0.00';
        return '$' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Toast Notifications ─────────────────────────────────
    function showToast(message, type = 'info') {
        const container = $('#toastContainer');
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ── Public API ──────────────────────────────────────────
    window.App = {
        viewDocument,
        deleteDocument
    };

    // ── Start ───────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
