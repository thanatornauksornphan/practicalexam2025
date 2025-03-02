import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();
const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test Connection
pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Error connecting to PostgreSQL', err));

// API Routes
app.get('/members', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tb_member');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("An unexpected error occurred");
    }
});

app.get('/books', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tb_book');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));