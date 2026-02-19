# 🧾 InvoiceScan AI — Complete Click-by-Click Deployment Guide

> **AI-Powered Invoice & Receipt Scanner** built with Azure Free Tier services.  
> Upload any receipt or invoice → AI extracts all data → stores in SQL Database → beautiful dashboard.

## 📋 Prerequisites

Before starting, you need:
1. ✅ A **Microsoft account** (Outlook, Hotmail, or any email)
2. ✅ A web browser (Edge or Chrome)
3. ✅ **Git** installed on your computer ([download](https://git-scm.com/downloads))

> **Cost: $0.00/month** — Everything runs on Azure Free Tier.

---

## 🏗️ Architecture

```
Azure DevOps (Git + CI/CD Pipeline)
        │ auto-deploy on push
        ▼
Azure App Service (F1 Free) ─── serves frontend + API
        │
   ┌────┴─────────────┐
   ▼                  ▼
AI Document       Azure SQL Database
Intelligence      (Always Free)
(Free F0)         ├── documents table
                  ├── line_items table
   All secrets    └── categories table
   stored in
   Azure Key Vault
```

---

## PHASE 1: Create Your Azure Free Account

> ⏭️ **Skip this if you already have an Azure account.**

1. Open your browser → go to **https://azure.microsoft.com/en-us/free/**
2. Click the **"Start free"** button
3. Sign in with your Microsoft account
4. Fill in the registration:
   - **Country/Region**: Select your country
   - **Phone**: Enter and verify via SMS
   - **Credit card**: Required for verification ONLY — **you will NOT be charged**
5. ✅ Accept terms → Click **"Sign up"**
6. You'll be redirected to **https://portal.azure.com**

> 💡 You get $200 credit for 30 days + always-free services. We only use always-free services.

---

## PHASE 2: Create a Resource Group

> A Resource Group is a **folder** that holds all your Azure resources together.

1. Go to **https://portal.azure.com**
2. In the **top search bar**, type **Resource groups** → click it
3. Click **➕ Create**
4. Fill in:
   - **Subscription**: Select your subscription (e.g., "Azure subscription 1")
   - **Resource group name**: `invoice-scanner-rg`
   - **Region**: `(US) East US` *(or closest to you)*
5. Click **Review + create** → Click **Create**
6. Click **Go to resource group**

✅ Done! Your project folder is ready.

---

## PHASE 3: Create Azure SQL Database (Always Free)

> This stores all your invoice data in relational tables.

1. In the **top search bar**, type **SQL databases** → click **SQL databases**
2. Click **➕ Create**
3. Fill in the **Basics** tab:
   - **Subscription**: Your subscription
   - **Resource group**: Select `invoice-scanner-rg`
   - **Database name**: `InvoiceScannerDB`
   - **Server**: Click **Create new**
     - **Server name**: `invoice-scanner-sql-<your-initials>` *(e.g., `invoice-scanner-sql-oa`)*
       - ⚠️ Must be globally unique, lowercase, letters/numbers/hyphens only
     - **Location**: `(US) East US`
     - **Authentication method**: Select **Use SQL authentication**
     - **Server admin login**: `sqladmin`
     - **Password**: Choose a strong password (save it! you'll need it later)
     - **Confirm password**: Same password
     - Click **OK**
   - **Want to use SQL elastic pool?**: **No**
   - **Workload environment**: Select **Development**
   - **Compute + storage**: Click **Configure database**
     - ⚠️ **CRITICAL**: Look for **"Free offer"** or **"Free serverless"** option
     - Select **General Purpose** → **Serverless**
     - Check **"Apply free offer"** checkbox if visible
     - If you see a slider for vCores, set to minimum (0.5 or 1)
     - ✅ Make sure "Free offer" is applied
     - Click **Apply**

> ⚠️ **CRITICAL**: You MUST see "Free offer" applied. If you don't see it, go back and look for the "Free database offer" banner. Each subscription gets up to 10 free databases.

4. Click the **Networking** tab:
   - **Connectivity method**: Select **Public endpoint**
   - **Allow Azure services and resources to access this server**: ✅ **Yes**
   - **Add current client IP address**: ✅ **Yes** *(so you can test from your computer)*
5. Skip **Security**, **Additional settings** tabs (defaults are fine)
6. Click **Review + create** → Click **Create**
7. ⏳ Wait 2-3 minutes → click **Go to resource**

### Get the Connection Details

8. On the SQL Database overview page, find **Server name** at the top — it'll look like:
   `invoice-scanner-sql-oa.database.windows.net`
9. **Copy and save** this server name

### Create the Tables

10. In the left sidebar, click **Query editor (preview)**
11. Login with:
    - **Authentication type**: SQL Server authentication
    - **Login**: `sqladmin`
    - **Password**: The password you set
12. Click **OK**
13. In the query editor, paste the contents of `db/schema.sql` from this project
14. Click **▶ Run**
15. You should see "Query succeeded" — tables are created!

✅ Done! Database is ready with `categories`, `documents`, and `line_items` tables.

---

## PHASE 4: Create Azure AI Document Intelligence (Free F0)

> This AI service reads your invoices/receipts and extracts structured data.

1. In the **top search bar**, type **Document Intelligence** → click **Azure AI Document Intelligence**
   - *(It might also appear as "Azure AI services" → look for "Document Intelligence")*
2. Click **➕ Create**
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: Select `invoice-scanner-rg`
   - **Region**: `(US) East US`
   - **Name**: `invoice-scanner-ai-<your-initials>` *(e.g., `invoice-scanner-ai-oa`)*
   - **Pricing tier**: Select **Free F0** ← CRITICAL! This gives 500 pages/month free

> ⚠️ If you don't see **Free F0**, try a different region. Some regions may not offer it.

4. Check the **Responsible AI Notice** checkbox
5. Click **Review + create** → Click **Create**
6. ⏳ Wait 1-2 minutes → Click **Go to resource**

### Get the Keys

7. In the left sidebar, click **Keys and Endpoint**
8. You'll see:
   - **KEY 1**: Copy and save this
   - **Endpoint**: Copy and save this (looks like `https://invoice-scanner-ai-oa.cognitiveservices.azure.com/`)

✅ Done! AI is ready to scan documents.

---

## PHASE 5: Create Azure Key Vault

> Stores your secrets (passwords, API keys) securely — never hardcode them.

1. In the **top search bar**, type **Key vaults** → click it
2. Click **➕ Create**
3. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: Select `invoice-scanner-rg`
   - **Key vault name**: `invoice-kv-<your-initials>` *(e.g., `invoice-kv-oa`)*
     - ⚠️ Must be globally unique, 3-24 characters
   - **Region**: `(US) East US`
   - **Pricing tier**: **Standard**
4. Click the **Access configuration** tab:
   - **Permission model**: Select **Azure role-based access control (RBAC)**
5. Click **Review + create** → Click **Create**
6. ⏳ Wait 1 minute → Click **Go to resource**

### Add Secrets to Key Vault

7. In the left sidebar, click **Secrets** (under Objects)
8. Click **➕ Generate/Import** and add these secrets one by one:

| Secret Name | Value |
|------------|-------|
| `sql-server` | `invoice-scanner-sql-oa.database.windows.net` (your SQL server name) |
| `sql-database` | `InvoiceScannerDB` |
| `sql-user` | `sqladmin` |
| `sql-password` | Your SQL admin password |
| `doc-intelligence-endpoint` | Your Document Intelligence endpoint URL |
| `doc-intelligence-key` | Your Document Intelligence KEY 1 |

For each secret:
- Click **➕ Generate/Import**
- **Upload options**: Manual
- **Name**: (from table above)
- **Value**: (from table above)
- Click **Create**

✅ Done! All secrets stored securely.

---

## PHASE 6: Create Azure App Service (F1 Free)

> This hosts your web application (both the frontend and backend API).

1. In the **top search bar**, type **App Services** → click it
2. Click **➕ Create** → Select **Web App**
3. Fill in the **Basics** tab:
   - **Subscription**: Your subscription
   - **Resource group**: Select `invoice-scanner-rg`
   - **Name**: `invoice-scanner-<your-initials>` *(e.g., `invoice-scanner-oa`)*
     - ⚠️ This becomes your URL: `https://invoice-scanner-oa.azurewebsites.net`
   - **Publish**: **Code**
   - **Runtime stack**: **Node 18 LTS**
   - **Operating System**: **Linux**
   - **Region**: `(US) East US`
   - **Pricing plan**: Click **Explore pricing plans** → Select **Free F1**
     - If F1 isn't visible, click **See additional options** or **Dev/Test** tab
     - ✅ Make sure you see **"Free"** — $0.00/month

4. Skip **Deployment**, **Networking**, and **Monitoring** tabs for now
5. Click **Review + create** → Click **Create**
6. ⏳ Wait 1-2 minutes → Click **Go to resource**

### Enable Managed Identity

> This lets App Service access Key Vault without storing credentials.

7. In the left sidebar, click **Identity** (under Settings)
8. Under **System assigned** tab:
   - Set Status to **On**
   - Click **Save**
   - Click **Yes** to confirm
   - 📋 Copy the **Object (principal) ID** that appears — you'll need this

### Grant Key Vault Access to App Service

9. Go back to your **Key Vault** resource:
   - Search bar → type your Key Vault name → click on it
10. In the left sidebar, click **Access control (IAM)**
11. Click **➕ Add** → **Add role assignment**
12. Select role: **Key Vault Secrets User** → Click **Next**
13. Click **➕ Select members**
14. Search for your App Service name (e.g., `invoice-scanner-oa`)
15. Select it → Click **Select** → Click **Review + assign** → **Review + assign** again

### Configure Application Settings

> These environment variables tell your app how to connect to everything.

16. Go back to your **App Service** resource
17. In the left sidebar, click **Environment variables** (under Settings)
   - *(Older portal versions may show this as "Configuration" → "Application settings")*
18. Click **➕ Add** and create these settings one by one:

| Name | Value |
|------|-------|
| `SQL_SERVER` | `invoice-scanner-sql-oa.database.windows.net` |
| `SQL_DATABASE` | `InvoiceScannerDB` |
| `SQL_USER` | `sqladmin` |
| `SQL_PASSWORD` | Your SQL password |
| `DOC_INTELLIGENCE_ENDPOINT` | Your Document Intelligence endpoint |
| `DOC_INTELLIGENCE_KEY` | Your Document Intelligence KEY 1 |
| `NODE_ENV` | `production` |

> 💡 **For production best practice**: Instead of plain values, you can use Key Vault references:
> `@Microsoft.KeyVault(VaultName=invoice-kv-oa;SecretName=sql-password)`
> This pulls the secret from Key Vault automatically. Both approaches work — Key Vault references are more secure.

19. Click **Apply** at the bottom → Click **Confirm**
20. The app will restart automatically

✅ Done! App Service is configured and ready.

---

## PHASE 7: Set Up Azure DevOps CI/CD Pipeline

> This creates automatic deployment: push code → auto-build → auto-deploy.

### Step 1: Create Azure DevOps Organization

1. Go to **https://dev.azure.com**
2. Click **Start free** (or sign in with your Microsoft account)
3. If prompted, create a new organization:
   - **Organization name**: Your name or a short alias (e.g., `omerahmed`)
   - Click **Continue**
4. Create a new project:
   - **Project name**: `invoice-scanner`
   - **Visibility**: **Private**
   - **Version control**: **Git**
   - Click **Create project**

### Step 2: Push Your Code to Azure Repos

5. In your Azure DevOps project, click **Repos** in the left sidebar
6. You'll see a "push an existing repository" section with a URL like:
   `https://dev.azure.com/omerahmed/invoice-scanner/_git/invoice-scanner`
7. **Copy this URL**
8. Open **Terminal/PowerShell** on your computer:

```powershell
# Navigate to the project folder
cd C:\Users\omar4\.gemini\antigravity\scratch\azure-invoice-scanner

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Invoice Scanner"

# Add Azure DevOps as remote
git remote add origin https://dev.azure.com/YOUR_ORG/invoice-scanner/_git/invoice-scanner

# Push to Azure Repos
git push -u origin main
```

> 💡 When prompted for credentials, use your Microsoft account email and a Personal Access Token (PAT). To create a PAT: Azure DevOps → User Settings (top-right gear) → Personal Access Tokens → New Token → Full access.

### Step 3: Create the CI/CD Pipeline

9. In Azure DevOps, click **Pipelines** in the left sidebar
10. Click **Create Pipeline**
11. Select **Azure Repos Git** (where your code is)
12. Select the `invoice-scanner` repository
13. Select **Existing Azure Pipelines YAML file**
14. Choose `azure-pipelines.yml` from the dropdown → Click **Continue**
15. You'll see the pipeline YAML. Before running, we need to set variables.

### Step 4: Create a Service Connection

> Azure DevOps needs permission to deploy to your App Service.

16. Click **Project Settings** (bottom-left gear icon)
17. Under **Pipelines**, click **Service connections**
18. Click **New service connection**
19. Select **Azure Resource Manager** → Click **Next**
20. Select **Service principal (automatic)** → Click **Next**
21. Fill in:
    - **Subscription**: Select your Azure subscription
    - **Resource group**: Select `invoice-scanner-rg`
    - **Service connection name**: `azure-connection`
    - ✅ Check **Grant access permission to all pipelines**
22. Click **Save**

### Step 5: Set Pipeline Variables

23. Go back to **Pipelines** → click on your pipeline → click **Edit**
24. Click **Variables** (top-right)
25. Add two variables:

| Name | Value |
|------|-------|
| `azureSubscription` | `azure-connection` (the service connection name from step 22) |
| `appServiceName` | `invoice-scanner-oa` (your App Service name from Phase 6) |

26. Click **Save**

### Step 6: Run the Pipeline

27. Click **Run** → Click **Run** again
28. Watch the pipeline execute:
    - **Build stage**: Installs dependencies, creates zip package
    - **Deploy stage**: Deploys to Azure App Service
29. ⏳ Wait 3-5 minutes for both stages to complete
30. You should see ✅ green checkmarks on both stages

✅ Done! CI/CD is working. Every future `git push` will auto-deploy!

---

## PHASE 8: Test Your Live Application

1. Open your App Service URL in a browser:
   `https://invoice-scanner-<your-initials>.azurewebsites.net`
2. You should see the **InvoiceScan AI** dashboard
3. Click **"Scan Document"** in the sidebar
4. Upload a test receipt or invoice image
5. Select **Invoice** or **Receipt** type
6. Click **"Analyze with AI"**
7. Wait for AI to process (5-15 seconds)
8. See the extracted data: vendor, date, total, line items
9. Assign a category → click **Save Category**
10. Go to **Dashboard** → see the spending chart update
11. Go to **Documents** → see your scanned document in the list

### Verify in Azure Portal

12. **SQL Database**: Go to your SQL Database → Query editor → Run:
    ```sql
    SELECT * FROM documents;
    SELECT * FROM line_items;
    ```
    You should see the data extracted from your scanned document.

13. **Document Intelligence**: Go to your AI resource → Metrics → check "Total Calls" to see usage.

14. **App Service Logs**: Go to App Service → Log stream (under Monitoring) → watch real-time logs.

---

## PHASE 9: Test the CI/CD Pipeline

> Let's verify that code changes auto-deploy.

1. Open `public/index.html` in a text editor
2. Find the text `InvoiceScan` and change the `<title>` tag to:
   ```html
   <title>InvoiceScan AI v2 — Smart Invoice & Receipt Scanner</title>
   ```
3. Save the file
4. In terminal:
   ```powershell
   git add .
   git commit -m "Update app title to v2"
   git push
   ```
5. Go to **Azure DevOps** → **Pipelines** → watch the new build trigger automatically
6. After 3-5 minutes, refresh your app URL — you'll see the updated title

✅ **CI/CD is working end-to-end!**

---

## 💰 Free Tier Limits Reminder

| Service | Free Allowance | Your Expected Usage |
|---------|---------------|-------------------|
| App Service (F1) | Shared CPU, 1 GB storage | ✅ Well within |
| SQL Database | 100K vCore-sec/month, 32 GB | ✅ Well within |
| Document Intelligence (F0) | 500 pages/month | ✅ 500 scans/month |
| Key Vault | Pay-per-use (~$0.03/10K ops) | ✅ Negligible |
| DevOps | 1800 CI/CD min/month, 5 users | ✅ Well within |

> ⚠️ **Never exceed free limits.** The SQL Database serverless will auto-pause when idle, saving your vCore-seconds. The F0 Document Intelligence hard-stops at 500 pages — you won't be charged more, requests will just fail.

---

## 🔧 Local Development

To run the app locally for testing:

1. Copy `.env.example` to `.env` and fill in your Azure credentials:
   ```powershell
   copy .env.example .env
   ```
2. Edit `.env` with your SQL server, Document Intelligence endpoint, and keys
3. Install dependencies and start:
   ```powershell
   npm install
   npm start
   ```
4. Open `http://localhost:8080` in your browser

---

## 📁 Project Structure

```
azure-invoice-scanner/
├── server.js                 # Express entry point
├── package.json              # Dependencies
├── azure-pipelines.yml       # CI/CD pipeline definition
├── web.config                # IIS config (Windows App Service)
├── .env.example              # Environment variable template
├── .gitignore
├── db/
│   ├── connection.js         # SQL Database connection pool
│   └── schema.sql            # Table creation scripts
├── routes/
│   ├── analyze.js            # AI Document Intelligence integration
│   ├── documents.js          # CRUD for documents
│   └── dashboard.js          # Analytics & statistics
└── public/
    ├── index.html            # Frontend SPA
    ├── css/styles.css         # Premium dark-mode design
    └── js/
        ├── app.js            # Frontend application logic
        └── api.js            # API client module
```
