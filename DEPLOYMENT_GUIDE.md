# 📘 Complete Click-by-Click Azure Deployment Guide

> This guide walks you through deploying the InvoiceScan AI app step-by-step. Every Azure Portal click is documented.  
> **Total cost: $0.00/month** — all services are Azure Free Tier.  
> **Time required: ~45-60 minutes.**

---

## Prerequisites

- A **Microsoft account** (Outlook, Hotmail, or any email)
- A web browser (Edge or Chrome recommended)
- **Git** installed ([download](https://git-scm.com/downloads))
- **Node.js 20+** installed ([download](https://nodejs.org/))

---

## PHASE 1: Create Your Azure Free Account

> Skip if you already have an Azure account.

1. Go to **https://azure.microsoft.com/en-us/free/**
2. Click **"Start free"**
3. Sign in with your Microsoft account
4. Fill in registration:
   - **Country/Region**: Your country
   - **Phone**: Verify via SMS
   - **Credit card**: Required for verification only — **you will NOT be charged**
5. Accept terms → Click **"Sign up"**
6. You'll be redirected to **https://portal.azure.com**

---

## PHASE 2: Create a Resource Group

> A Resource Group is a folder that holds all your Azure resources together.

1. Go to **https://portal.azure.com**
2. Top search bar → type `Resource groups` → click it
3. Click **➕ Create**

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource group | `invoice-scanner-rg` |
| Region | `(US) East US` |

4. Click **Review + create** → **Create**

> **⚠️ Troubleshooting**: If East US doesn't work for later resources, you can still use this Resource Group — resources inside it can be in different regions.

---

## PHASE 3: Create Azure SQL Database (Always Free)

### Step 3.1 — Create the Database

1. Top search bar → `SQL databases` → click it
2. Click **➕ Create**
3. Fill in the **Basics** tab:

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource group | `invoice-scanner-rg` |
| Database name | `InvoiceScannerDB` |

4. Under **Server**, click **Create new**:

| Field | Value |
|-------|-------|
| Server name | `invoice-scanner-sql-<your-initials>` (must be globally unique) |
| Location | Try `East US`, `West US 2`, `Central US`, or `West Europe` |
| Authentication | `Use SQL authentication` |
| Admin login | `sqladmin` |
| Password | Choose a strong password — **SAVE THIS!** |

5. Click **OK**
6. Set **Workload environment**: `Development`
7. Click **Configure database** (under Compute + storage):
   - Select **General Purpose** → **Serverless**
   - **CHECK "Apply free offer"** ← CRITICAL!
   - Click **Apply**

> **⚠️ Troubleshooting — Region Error**: If you get "Your subscription does not have access to create a server in the selected region", try a different region: `West US 2`, `Central US`, `West Europe`, `North Europe`, `Southeast Asia`.

8. Click **Networking** tab:

| Field | Value |
|-------|-------|
| Connectivity method | `Public endpoint` |
| Allow Azure services to access | ✅ **Yes** |
| Add current client IP | ✅ **Yes** |

9. Click **Review + create** → **Create**
10. Wait 2-3 minutes → Click **Go to resource**

### Step 3.2 — Save Connection Details

11. On the Overview page, copy the **Server name** (e.g., `invoice-scanner-sql-oa.database.windows.net`)

### Step 3.3 — Create Tables

12. Left sidebar → **Query editor (preview)**
13. Login: `sqladmin` / your password

> **⚠️ Troubleshooting — IP Not Allowed**: If you get "Client with IP address X.X.X.X is not allowed":
> 1. Go to your **SQL Server** resource (not database)
> 2. Left sidebar → **Networking**
> 3. Click **"Add your client IPv4 address"**
> 4. Make sure **"Allow Azure services"** is set to **Yes**
> 5. Click **Save** → wait 2 minutes → retry

14. Paste the contents of `db/schema.sql` → Click **▶ Run**
15. You should see "Query succeeded"

---

## PHASE 4: Create Azure AI Document Intelligence (F0 Free)

1. Top search bar → `Document Intelligence` → click it
2. Click **➕ Create**

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource group | `invoice-scanner-rg` |
| Region | `East US` (or try other regions if F0 isn't available) |
| Name | `invoice-scanner-ai-<your-initials>` |
| Pricing tier | **Free F0** ← CRITICAL! (500 pages/month) |

3. Check **Responsible AI Notice** → Click **Review + create** → **Create**
4. Wait 1-2 minutes → Click **Go to resource**
5. Left sidebar → **Keys and Endpoint**
6. Copy and save: **KEY 1** and **Endpoint URL**

---

## PHASE 5: Create Azure Key Vault

1. Top search bar → `Key vaults` → click it
2. Click **➕ Create**

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource group | `invoice-scanner-rg` |
| Key vault name | `invoice-kv-<your-initials>` (3-24 chars, globally unique) |
| Region | Same as your other resources |
| Pricing tier | **Standard** |

3. **Access configuration** tab → Permission model: **Vault access policy**

> **💡 Tip**: Use "Vault access policy" instead of RBAC — it's simpler and avoids the RBAC permission propagation delay that can cause "unauthorized" errors.

4. Click **Review + create** → **Create** → **Go to resource**

### Add Secrets

5. Left sidebar → **Secrets** → Click **➕ Generate/Import** for each:

| Name | Value |
|------|-------|
| `sql-server` | Your SQL server hostname |
| `sql-database` | `InvoiceScannerDB` |
| `sql-user` | `sqladmin` |
| `sql-password` | Your SQL password |
| `doc-intelligence-endpoint` | Your AI endpoint URL |
| `doc-intelligence-key` | Your AI KEY 1 |

> **⚠️ Troubleshooting — RBAC Unauthorized**: If you see "The operation is not allowed by RBAC":
> - Go to Key Vault → **Access configuration** → Change to **"Vault access policy"** → **Apply**
> - OR: Go to **Access control (IAM)** → Add role **"Key Vault Administrator"** to yourself → wait 5 minutes

---

## PHASE 6: Create Azure App Service (F1 Free)

### Step 6.1 — Create the Web App

1. Top search bar → `App Services` → click it
2. Click **➕ Create** → **Web App**

| Field | Value |
|-------|-------|
| Subscription | Your subscription |
| Resource group | `invoice-scanner-rg` |
| Name | `invoice-scanner-<your-initials>` (becomes your URL) |
| Publish | **Code** |
| Runtime stack | **Node 20 LTS** |
| Operating System | **Linux** |
| Region | Try different regions if quota errors occur |

3. Pricing plan → Select **Free F1** (under Dev/Test tab)

> **⚠️ Troubleshooting — Quota Error**: If you get "No hosted parallelism" or "Additional quota required":
> - Try a different region (`Central US`, `West US`, `West Europe`, `North Europe`)
> - OR use **B1 Basic** tier if you have $200 free credit (it'll be covered)

4. Click **Review + create** → **Create** → **Go to resource**

### Step 6.2 — Enable Managed Identity

5. Left sidebar → **Identity** (under Settings)
6. System assigned → Status: **On** → **Save** → **Yes**

### Step 6.3 — Grant Key Vault Access

7. Go to your **Key Vault** → **Access control (IAM)**
8. **➕ Add** → **Add role assignment**
9. Role: **Key Vault Secrets User** → Next
10. **Select members** → search your App Service name → Select → **Review + assign**

### Step 6.4 — Configure Environment Variables

11. Go to your **App Service** → Left sidebar → **Environment variables**
12. Click **➕ Add** for each:

| Name | Value |
|------|-------|
| `SQL_SERVER` | Your SQL server hostname |
| `SQL_DATABASE` | `InvoiceScannerDB` |
| `SQL_USER` | `sqladmin` |
| `SQL_PASSWORD` | Your SQL password |
| `DOC_INTELLIGENCE_ENDPOINT` | Your AI endpoint URL |
| `DOC_INTELLIGENCE_KEY` | Your AI KEY 1 |
| `NODE_ENV` | `production` |

13. Click **Apply** → **Confirm**

---

## PHASE 7: Deploy the Application

### Option A: Local Git Deploy (Recommended — works immediately)

1. App Service → Left sidebar → **Deployment Center**
2. Source: **Local Git** → **Save**
3. If you see **"SCM basic authentication is disabled"**:
   - Go to **Configuration** → **General settings**
   - Set **SCM Basic Auth Publishing Credentials** → **On**
   - **Save** → go back to Deployment Center
4. Copy the **Local Git Clone Uri** (e.g., `https://your-app.scm.azurewebsites.net/your-app.git`)
5. Click **Local Git/FTPS credentials** tab → note the username and password

```bash
# In your project folder
git remote add azure <your-local-git-clone-uri>
git push azure master
# Enter the deployment credentials when prompted
```

6. Wait ~60 seconds for build to complete
7. Open your App Service URL!

> **Note**: First load takes 20-30 seconds — the F1 free tier sleeps when idle.

### Option B: Azure DevOps CI/CD Pipeline

> **Important**: New Azure DevOps organizations need a free parallelism grant. Request it at Azure DevOps → Organization Settings → Parallel jobs → Request increase. Approval takes 1-3 business days.

1. Go to **https://dev.azure.com** → create organization + project
2. Push code to Azure Repos
3. Create a **Service Connection** (Project Settings → Service Connections → Azure Resource Manager)
4. Create pipeline using the included `azure-pipelines.yml`
5. **Note**: The `azureSubscription` value in the YAML must match your service connection name exactly (can't use variables for this)

---

## PHASE 8: Test the Application

1. Open your App Service URL in a browser
2. **Dashboard** — Shows summary cards and charts (empty until you scan)
3. **Scan Document** — Upload a receipt/invoice → click "Analyze with AI"
4. Wait 5-15 seconds for AI to process
5. See extracted data: vendor, date, total, tax, line items, confidence score
6. Assign a category → Save
7. **Documents** — View all scanned documents, search, filter
8. **Dashboard** — Charts now show your spending data

### Verify in Azure Portal

- **SQL Database** → Query editor → `SELECT * FROM documents;`
- **AI Document Intelligence** → Metrics → check "Total Calls"
- **App Service** → Log stream → watch real-time server logs

---

## PHASE 9: Push Changes (Future Deployments)

After making code changes:

```bash
# If using Local Git deploy
git add .
git commit -m "Your change description"
git push azure master

# If using Azure DevOps CI/CD (after parallelism grant approved)
git push origin main
# Pipeline auto-triggers → builds → deploys
```

---

## 💡 Tips & Common Issues

| Issue | Solution |
|-------|---------|
| App shows "Application Error" | Check App Service → Log stream. Usually a missing environment variable. |
| SQL connection fails | Verify firewall: SQL Server → Networking → Add your IP + Allow Azure services. |
| AI returns error | Check endpoint ends with `/`. Verify KEY 1 is correct. |
| App takes 30+ seconds | Normal for F1 — app sleeps when idle. |
| Key Vault "unauthorized" | Use Vault access policy mode, or add yourself as Key Vault Administrator. |
| DevOps "no parallelism" | Request free grant at org settings. Use Local Git deploy in the meantime. |
| Region not available | Try: West US 2, Central US, West Europe, North Europe, Southeast Asia. |
| Node 18 not found | Use **Node 20 LTS** — Node 18 is end-of-life. |
