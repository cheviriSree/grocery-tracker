const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

    const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'grocery_db',
    password: 'password',
    port: 5432, 
});
const initDB = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL
        );
    `;
    try {
        await pool.query(query);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDB();
app.get('/groceries', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM items');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/groceries', async (req, res) => {
    try {
        const { name } = req.body;
        const newItem = await pool.query('INSERT INTO items (name) VALUES ($1) RETURNING *', [name]);
        res.json(newItem.rows[0]);
    } catch (err) {
        console.error('Error adding item:', err);
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
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});