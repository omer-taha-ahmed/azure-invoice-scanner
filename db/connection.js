// ============================================================
// Database Connection & Initialization
// ============================================================
// Uses 'mssql' package to connect to Azure SQL Database
// In production, secrets come from App Settings (via Key Vault references)
// ============================================================

const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Build SQL config from environment variables
function getDbConfig() {
    return {
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        options: {
            encrypt: true,              // Required for Azure SQL
            trustServerCertificate: false,
            connectTimeout: 30000,
            requestTimeout: 30000
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };
}

// Global connection pool (reused across requests)
let pool = null;

// Get or create the connection pool
async function getPool() {
    if (!pool) {
        const config = getDbConfig();
        pool = await sql.connect(config);
        console.log(`✅ Connected to SQL Database: ${config.database}`);
    }
    return pool;
}

// Initialize database — create tables if they don't exist
async function initializeDatabase() {
    const db = await getPool();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema (IF NOT EXISTS ensures safe re-runs)
    await db.request().query(schema);
    console.log('✅ Database schema verified');
}

module.exports = { getPool, initializeDatabase, sql };
