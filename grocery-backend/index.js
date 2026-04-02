const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

    const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'grocery_db',
    password: '1234',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
    const query = `
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            quantity INTEGER DEFAULT 1,
            category VARCHAR(50) DEFAULT 'General'
        );
    `;
    try {
        await pool.query(query);
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
        const { name, quantity, category } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: "Item name is required and must be a string" });
        }
        
        const parsedQuantity = quantity ? parseInt(quantity) : 1;
        const finalCategory = category && typeof category === 'string' ? category.trim() : 'General';
        
        const newItem = await pool.query(
            'INSERT INTO items (name, quantity, category) VALUES ($1, $2, $3) RETURNING *',
            [name.trim(), parsedQuantity, finalCategory]
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