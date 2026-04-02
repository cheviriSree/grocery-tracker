const { Pool } = require('pg');

// Connect to default 'postgres' database to create grocery_db
const adminPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',  // Connect to default database
    password: '1234',
    port: 5432,
});

async function setup() {
    try {
        console.log('Creating grocery_db database...');
        await adminPool.query('CREATE DATABASE grocery_db;');
        console.log('✓ Database created successfully');
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log('✓ Database already exists');
        } else {
            console.error('Error creating database:', err.message);
        }
    } finally {
        await adminPool.end();
    }
}

setup();
