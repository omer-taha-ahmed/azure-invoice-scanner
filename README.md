# 🧾 InvoiceScan AI — Smart Invoice & Receipt Scanner

> **AI-powered invoice and receipt scanner** built with Azure Free Tier.  
> Upload any document → Azure AI extracts all data → stores in SQL Database → beautiful analytics dashboard.

![Live](https://img.shields.io/badge/Status-Live-brightgreen) ![Azure](https://img.shields.io/badge/Azure-Free%20Tier-blue) ![Node](https://img.shields.io/badge/Node.js-20%20LTS-green)

## 🚀 Live Demo

**https://invoice-scanner-oa-fdd0fqerdtevfwhc.centralus-01.azurewebsites.net**

> First load takes ~20 seconds (F1 free tier cold start).

## 📋 What It Does

1. **Upload** an invoice or receipt (JPEG, PNG, PDF, TIFF)
2. **AI analyzes** the document using Azure AI Document Intelligence
3. **Extracts** vendor name, date, total, tax, line items, and more
4. **Stores** everything in Azure SQL Database
5. **Dashboard** shows spending by category, monthly trends, top vendors

## 🏗️ Architecture

```
User → Azure App Service (F1 Free)
         │ serves frontend + API
         │
    ┌────┴─────────────┐
    ▼                  ▼
AI Document         Azure SQL Database
Intelligence        (Always Free)
(Free F0)           ├── documents table
500 pages/month     ├── line_items table
                    └── categories table

Secrets stored in → Azure Key Vault
Code stored in   → GitHub + Azure DevOps
```

## 🛠️ Azure Services Used (All Free)

| Service | Tier | Free Limit |
|---------|------|-----------|
| **Azure App Service** | F1 Free | Shared CPU, 1 GB storage |
| **Azure SQL Database** | Always Free | 100K vCore-sec/month, 32 GB |
| **Azure AI Document Intelligence** | F0 Free | 500 pages/month |
| **Azure Key Vault** | Standard | ~$0 at this scale |
| **Azure DevOps** | Free | 5 users, unlimited repos |

## 📁 Project Structure

```
azure-invoice-scanner/
├── server.js               # Express entry point
├── package.json            # Dependencies
├── azure-pipelines.yml     # CI/CD pipeline
├── web.config              # IIS config (Windows hosting)
├── .env.example            # Environment template
├── .gitignore
├── db/
│   ├── connection.js       # SQL Database connection pool
│   └── schema.sql          # Table creation scripts
├── routes/
│   ├── analyze.js          # AI Document Intelligence integration
│   ├── documents.js        # CRUD for documents
│   └── dashboard.js        # Analytics & statistics
└── public/
    ├── index.html          # Frontend SPA (3 pages)
    ├── css/styles.css      # Premium dark-mode design
    └── js/
        ├── app.js          # Frontend controller + Chart.js
        └── api.js          # API client module
```

## 🔧 Local Development

```bash
# Clone the repo
git clone https://github.com/omer-taha-ahmed/azure-invoice-scanner.git
cd azure-invoice-scanner

# Copy environment template and fill in your Azure credentials
cp .env.example .env

# Install dependencies
npm install

# Start the server
npm start
# → Open http://localhost:8080
```

## 🚀 Deployment to Azure

### Quick Deployment (Local Git)

1. Create all Azure resources (App Service, SQL Database, AI Document Intelligence, Key Vault)
2. Configure App Service environment variables
3. Enable Local Git deployment in App Service Deployment Center
4. Push code:
```bash
git remote add azure <your-local-git-clone-uri>
git push azure master
```

### CI/CD Pipeline (Azure DevOps)

The project includes `azure-pipelines.yml` for automated deployments:
- **Build stage**: Install Node.js 20, npm dependencies, create zip artifact
- **Deploy stage**: Deploy to Azure App Service

> **Note**: New Azure DevOps organizations need to request free parallelism at the organization settings.

## 🔑 Environment Variables

| Variable | Description |
|----------|------------|
| `SQL_SERVER` | Azure SQL Server hostname |
| `SQL_DATABASE` | Database name |
| `SQL_USER` | SQL admin username |
| `SQL_PASSWORD` | SQL admin password |
| `DOC_INTELLIGENCE_ENDPOINT` | AI Document Intelligence endpoint URL |
| `DOC_INTELLIGENCE_KEY` | AI Document Intelligence API key |
| `NODE_ENV` | `production` for Azure, `development` for local |

## 📊 Features

- **AI-Powered Scanning** — Prebuilt invoice & receipt models extract structured data
- **Real-Time Dashboard** — Chart.js doughnut & bar charts for spending analysis
- **Document Management** — Search, filter by category/date, view details
- **Category System** — 10 built-in categories with custom icons
- **Dark Mode UI** — Premium glassmorphism design
- **Responsive** — Works on mobile and desktop

## 💰 Cost

**$0.00/month** — Everything runs within Azure Free Tier limits.

## 📄 License

MIT
