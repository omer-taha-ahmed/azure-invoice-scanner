# 🧹 Cleanup Guide — Delete All Azure Resources

After you're done with this project, follow these steps to **delete everything** and avoid any potential charges. Total time: ~5 minutes.

---

## Quick Summary

| What to Delete | Where | Method |
|----------------|-------|--------|
| All Azure resources | Azure Portal | Delete Resource Group |
| Azure DevOps project | dev.azure.com | Delete Project |
| Azure DevOps organization | dev.azure.com | Delete Organization (optional) |
| Local Git remote | Terminal | `git remote remove azure` |

---

## Step 1: Delete the Resource Group (Deletes EVERYTHING)

Deleting the resource group removes **all 5 services at once**: App Service, SQL Database, AI Document Intelligence, Key Vault, and all associated data.

1. Go to [Azure Portal](https://portal.azure.com)
2. Search **"Resource groups"** in the top search bar
3. Click **invoice-scanner-rg**
4. Click **Delete resource group** (top toolbar, red button)
5. Type the resource group name: **invoice-scanner-rg**
6. Click **Delete**
7. Wait ~2-3 minutes for deletion to complete

> ⚠️ **This is permanent.** All data (invoices, database records, secrets) will be lost. Make sure you have your code backed up to GitHub first.

### What Gets Deleted:
- ✅ Azure App Service (invoice-scanner-xxx)
- ✅ Azure SQL Server + Database (InvoiceScannerDB)
- ✅ Azure AI Document Intelligence
- ✅ Azure Key Vault (invoice-kv-xxx)
- ✅ App Service Plan

---

## Step 2: Verify Deletion

1. Go to [Azure Portal Home](https://portal.azure.com)
2. Click **Resource groups** in the left sidebar
3. Confirm **invoice-scanner-rg** is gone
4. Search **"All resources"** — should show nothing related to invoice-scanner

> 💡 If the resource group shows "Deleting", wait a few minutes and refresh.

---

## Step 3: Delete Azure DevOps Project

If you set up Azure DevOps CI/CD:

1. Go to [dev.azure.com](https://dev.azure.com)
2. Open your **organization**
3. Click on the **invoice-scanner** project
4. Click **Project settings** (bottom-left gear icon)
5. Scroll all the way down to **Overview**
6. Click **Delete** (at the bottom of the page)
7. Type the project name to confirm → Click **Delete**

---

## Step 4: Delete Azure DevOps Organization (Optional)

If you created the organization only for this project:

1. Go to [dev.azure.com](https://dev.azure.com)
2. Click **Organization settings** (bottom-left)
3. In the left sidebar, scroll down and click **Overview**
4. Click **Delete organization**
5. Type the organization name to confirm → **Delete**

---

## Step 5: Clean Up Local Git Remotes

Remove the Azure deployment remote from your local repo:

```bash
# Remove the Azure remote (Local Git deployment)
git remote remove azure

# Verify — should only show 'origin' (GitHub)
git remote -v
```

---

## Step 6: Purge Key Vault (if Soft-Delete is Enabled)

Azure Key Vault has **soft-delete** enabled by default. Even after deleting the resource group, the vault may be in a "soft-deleted" state for 90 days. To permanently purge it:

1. Azure Portal → Search **"Key vaults"**
2. Click **Manage deleted vaults** (top toolbar)
3. Select your deleted vault (invoice-kv-xxx)
4. Click **Purge** → Confirm

> 💡 If you don't purge, the vault name will be "reserved" for 90 days and you can't reuse it.

---

## Verification Checklist

After cleanup, verify everything is gone:

- [ ] Resource group **invoice-scanner-rg** deleted
- [ ] No resources under **All resources** related to invoice-scanner
- [ ] Azure DevOps project deleted
- [ ] Azure DevOps organization deleted (optional)
- [ ] `git remote -v` shows only `origin` (GitHub)
- [ ] Key Vault purged (if needed)
- [ ] Azure Portal **Cost Management** shows $0 going forward

---

## Re-Deploying Later

Want to rebuild? Follow the [Deployment Guide](DEPLOYMENT_GUIDE.md) — all code is preserved in this repo. You'll need to:

1. Create a new Resource Group
2. Re-create all 5 Azure services
3. Re-add secrets to Key Vault
4. Re-deploy via Local Git or Azure DevOps

The entire process takes ~45-60 minutes.
