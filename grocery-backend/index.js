require('dotenv').config();
// Load environment variables
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Print env vars for debugging
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'grocery_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('Failed to connect to Postgres:', err.message);
    } else {
        console.log('Connected to Postgres successfully');
        release();
    }
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Handle unhandled exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER DEFAULT 1,
                category VARCHAR(50) DEFAULT 'General'
            );
        `);
        await pool.query(`
            ALTER TABLE items ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
        `);
        await pool.query(`
            ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date DATE;
        `);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
};
initDB();

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT NOW()');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});

app.get('/groceries', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM items ORDER BY id ASC');
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching items:', err.message || err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/groceries', async (req, res) => {
    try {
        const { name, quantity, category, expiry_date } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: "Item name is required and must be a string" });
        }

        const parsedQuantity = quantity ? parseInt(quantity) : 1;
        const finalCategory = category && typeof category === 'string' ? category.trim() : 'General';

        let finalExpiryDate = null;
        if (expiry_date) {
            const parsed = new Date(expiry_date);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({ error: "expiry_date must be a valid date (YYYY-MM-DD)" });
            }
            finalExpiryDate = expiry_date;
        }

        const newItem = await pool.query(
            'INSERT INTO items (name, quantity, category, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [name.trim(), parsedQuantity, finalCategory, finalExpiryDate]
        );

        if (!newItem.rows || newItem.rows.length === 0) {
            return res.status(500).json({ error: "Failed to create item" });
        }

        res.status(201).json(newItem.rows[0]);
    } catch (err) {
        console.error('Error adding item:', err.message || err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.delete('/groceries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM items WHERE id = $1', [id]);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.patch('/groceries/:id/expiry', async (req, res) => {
    const { id } = req.params;
    const { expiry_date } = req.body;
    try {
        let finalExpiryDate = null;
        if (expiry_date !== null && expiry_date !== undefined) {
            const parsed = new Date(expiry_date);
            if (isNaN(parsed.getTime())) {
                return res.status(400).json({ error: "expiry_date must be a valid date (YYYY-MM-DD) or null" });
            }
            finalExpiryDate = expiry_date;
        }
        const result = await pool.query(
            'UPDATE items SET expiry_date = $1 WHERE id = $2 RETURNING *',
            [finalExpiryDate, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating expiry date:', err.message || err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/items/:id/toggle', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE items SET is_completed = NOT is_completed WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not update item" });
    }
});

// Keep-alive heartbeat to prevent connection timeout
setInterval(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('[Heartbeat]', new Date().toLocaleTimeString(), '- Database connected');
    } catch (err) {
        console.error('[Heartbeat Error]', new Date().toLocaleTimeString(), '-', err.message);
    }
}, 30000);

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    console.log('SIGTERM received: closing gracefully');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received: closing gracefully');
    await pool.end();
    process.exit(0);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});