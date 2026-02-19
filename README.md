# 🧾 InvoiceScan AI — Azure AI Invoice & Receipt Scanner

> A full-stack web application that uses **Azure AI Document Intelligence** to scan invoices/receipts, extract structured data, store it in **Azure SQL Database**, and deploy it with a **CI/CD pipeline** — all on Azure's **Free Tier ($0/month)**.

![Azure](https://img.shields.io/badge/Cloud-Microsoft%20Azure-blue) ![Node](https://img.shields.io/badge/Runtime-Node.js%2020-green) ![AI](https://img.shields.io/badge/AI-Document%20Intelligence-purple) ![CI/CD](https://img.shields.io/badge/CI%2FCD-Azure%20DevOps-orange)

---

## 🎯 What This Project Demonstrates

This project was built to showcase real-world Azure skills using **5 different Azure services** in a production-like architecture:

| Skill Area | What's Demonstrated |
|-----------|-------------------|
| **AI Services** | Azure AI Document Intelligence — prebuilt model integration, document parsing |
| **Relational Database** | Azure SQL Database — schema design, connection pooling, parameterized queries |
| **Web Hosting** | Azure App Service — full-stack deployment, environment config, Managed Identity |
| **Security** | Azure Key Vault — secrets management, RBAC access control |
| **CI/CD** | Azure DevOps — YAML pipelines, automated build & deploy, Git integration |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    User Browser                      │
│         Dark-mode SPA (Dashboard, Scan, Docs)        │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────┐
│              Azure App Service (F1 Free)             │
│         Node.js 20 / Express.js API Server           │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ /analyze │  │ /documents│  │   /dashboard     │  │
│  │ AI scan  │  │ CRUD ops  │  │   Analytics      │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
└───────┼──────────────┼─────────────────┼────────────┘
        │              │                 │
        ▼              ▼                 │
┌──────────────┐ ┌──────────────────┐    │
│ Azure AI     │ │ Azure SQL        │◄───┘
│ Document     │ │ Database         │
│ Intelligence │ │ (Always Free)    │
│ (F0 Free)    │ │                  │
│              │ │ ├── documents    │
│ 500 pages/mo │ │ ├── line_items   │
└──────────────┘ │ └── categories   │
                 └──────────────────┘

        Secrets → Azure Key Vault
        Code    → GitHub + Azure DevOps CI/CD
```

---

## ✨ Key Features

- **AI-Powered Extraction** — Upload JPEG, PNG, PDF, or TIFF → AI extracts vendor, date, total, tax, line items
- **Prebuilt Models** — Uses Azure's `prebuilt-invoice` and `prebuilt-receipt` models (no custom training needed)
- **SQL Database** — Relational schema with 3 tables, indexed queries, foreign key relationships
- **Analytics Dashboard** — Chart.js charts: spending by category, monthly trends, top vendors
- **Document Management** — Search, filter by category/date, view details, delete
- **Category System** — 10 built-in categories with icons
- **Premium Dark UI** — Glassmorphism design, smooth animations, fully responsive
- **Secure Configuration** — Environment variables + Key Vault references for secrets
- **CI/CD Pipeline** — Push to Git → auto-build → auto-deploy to Azure

---

## 📁 Project Structure

```
azure-invoice-scanner/
├── server.js                 # Express.js entry point — middleware, routes, static serving
├── package.json              # Dependencies: Azure SDKs, Express, mssql, multer
├── azure-pipelines.yml       # 2-stage CI/CD: Build (Node 20, npm, zip) → Deploy (App Service)
├── web.config                # IIS configuration for Windows App Service hosting
├── .env.example              # Environment variable template (7 required variables)
├── .gitignore
│
├── db/
│   ├── connection.js         # SQL connection pool with auto-reconnect & schema initializer
│   └── schema.sql            # CREATE TABLE scripts: categories, documents, line_items
│
├── routes/
│   ├── analyze.js            # POST /api/analyze/invoice & /receipt — AI extraction + DB save
│   ├── documents.js          # GET/PUT/DELETE /api/documents — CRUD with filtering & search
│   └── dashboard.js          # GET /api/dashboard/* — summary, trends, vendors, categories
│
└── public/
    ├── index.html            # Single-page app: 3 views (Dashboard, Scan, Documents)
    ├── css/styles.css        # 700+ lines: dark mode, glassmorphism, responsive, animations
    └── js/
        ├── app.js            # SPA controller: navigation, Chart.js, drag-drop, toasts
        └── api.js            # Fetch-based API client for all backend endpoints
```

---

## 🛠️ Azure Services & Free Tier Limits

| Service | Tier | Free Allowance | Purpose |
|---------|------|---------------|---------|
| **App Service** | F1 Free | Shared CPU, 1 GB, 60 min/day | Hosts the full-stack app |
| **SQL Database** | Always Free | 100K vCore-sec/mo, 32 GB | Stores extracted invoice data |
| **AI Document Intelligence** | F0 Free | 500 pages/month | Reads & extracts document data |
| **Key Vault** | Standard | ~$0 at low scale | Stores database & API secrets |
| **DevOps** | Free | 5 users, unlimited repos | Git repos + CI/CD pipelines |

> **Total monthly cost: $0.00** — All services operate within Azure Free Tier.

---

## 🚀 Deploy It Yourself

Want to build this project? Follow the complete **click-by-click deployment guide**:

📘 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** — 9 phases, every Azure Portal click documented, with troubleshooting tips.

🧹 **[CLEANUP.md](./CLEANUP.md)** — How to delete all Azure resources when you're done (avoid charges).

### Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/omer-taha-ahmed/azure-invoice-scanner.git
cd azure-invoice-scanner

# Configure
cp .env.example .env
# Fill in your Azure credentials in .env

# Install & run
npm install
npm start
# → Open http://localhost:8080
```

### Required Environment Variables

| Variable | Description |
|----------|------------|
| `SQL_SERVER` | Azure SQL Server hostname |
| `SQL_DATABASE` | Database name (e.g., `InvoiceScannerDB`) |
| `SQL_USER` | SQL admin username |
| `SQL_PASSWORD` | SQL admin password |
| `DOC_INTELLIGENCE_ENDPOINT` | AI Document Intelligence endpoint URL |
| `DOC_INTELLIGENCE_KEY` | AI Document Intelligence API key |
| `NODE_ENV` | `production` for Azure, `development` for local |

---

## 💡 What I Learned Building This

- **Azure AI Document Intelligence** returns structured JSON with confidence scores — far more powerful than basic OCR
- **Azure SQL Database Always Free tier** auto-pauses when idle, which saves vCore-seconds but means cold starts
- **App Service F1 tier** sleeps when idle — first request takes ~20-30 seconds (cold start)
- **Key Vault with RBAC** requires explicit role assignment (Key Vault Administrator) before you can manage secrets
- **Azure DevOps free tier** requires requesting parallelism grant for new organizations
- **Managed Identity** lets App Service access Key Vault without storing credentials — zero secrets in code
- **Local Git deployment** is the fastest way to deploy during development before CI/CD is configured

---

## 📄 License

MIT
