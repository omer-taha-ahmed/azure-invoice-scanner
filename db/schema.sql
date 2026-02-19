-- ============================================================
-- Azure Invoice Scanner — Database Schema
-- ============================================================
-- Azure SQL Database (Always Free Tier)
-- Safe to re-run: uses IF NOT EXISTS
-- ============================================================

-- Categories table (spending categories)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categories')
BEGIN
  CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    icon NVARCHAR(10) DEFAULT '📁',
    created_at DATETIME2 DEFAULT GETDATE()
  );

  -- Seed default categories
  INSERT INTO categories (name, icon) VALUES 
    (N'Food & Dining', N'🍔'),
    (N'Transportation', N'🚗'),
    (N'Shopping', N'🛍️'),
    (N'Utilities', N'💡'),
    (N'Entertainment', N'🎬'),
    (N'Healthcare', N'🏥'),
    (N'Office Supplies', N'📎'),
    (N'Travel', N'✈️'),
    (N'Education', N'📚'),
    (N'Other', N'📋');
END

-- Documents table (scanned invoices/receipts)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
BEGIN
  CREATE TABLE documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    file_name NVARCHAR(255) NOT NULL,
    vendor_name NVARCHAR(255),
    invoice_date DATE,
    total_amount DECIMAL(12,2),
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    currency NVARCHAR(10) DEFAULT 'USD',
    category_id INT NULL REFERENCES categories(id),
    confidence_score DECIMAL(5,4),
    raw_text NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
  );
END

-- Line items table (extracted items from invoices)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'line_items')
BEGIN
  CREATE TABLE line_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description NVARCHAR(500),
    quantity DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    amount DECIMAL(12,2),
    created_at DATETIME2 DEFAULT GETDATE()
  );
END

-- Index for fast queries by date and category
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_documents_date')
  CREATE INDEX IX_documents_date ON documents(invoice_date DESC);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_documents_category')
  CREATE INDEX IX_documents_category ON documents(category_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_line_items_document')
  CREATE INDEX IX_line_items_document ON line_items(document_id);
