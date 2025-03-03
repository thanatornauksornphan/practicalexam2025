import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 5000;

// PostgreSQL Database Connection
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// API to add new borrow/return record
app.post("/api/borrow-return", async (req, res) => {
    const { b_id, m_user, borrow_date, return_date, fine } = req.body;
    
    try {
        // Generate a unique record_id (you might want to use a more robust method)
        const recordIdResult = await pool.query("SELECT MAX(CAST(SUBSTRING(record_id, 2) AS INTEGER)) as max_id FROM tb_borrow_return");
        const maxId = recordIdResult.rows[0].max_id || 0;
        const newRecordId = `R${(maxId + 1).toString().padStart(5, '0')}`;
        
        // Insert the new record
        await pool.query(
            `INSERT INTO tb_borrow_return 
            (record_id, b_id, m_user, borrow_date, return_date, fine) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [newRecordId, b_id, m_user, borrow_date, return_date || null, fine || 0]
        );
        
        res.status(201).json({ success: true, record_id: newRecordId });
    } catch (err) {
        console.error("Error adding borrow record:", err);
        res.status(500).json({ error: "Database error when adding record" });
    }
});

// API to search borrowed books
app.get("/api/borrowed-books/search", async (req, res) => {
    const { query } = req.query;
    
    try {
        const result = await pool.query(`
            SELECT 
                br.b_id, 
                b.b_name, 
                m.m_name, 
                br.borrow_date, 
                br.return_date, 
                br.fine
            FROM tb_borrow_return br
            JOIN tb_book b ON br.b_id = b.b_id
            JOIN tb_member m ON br.m_user = m.m_user
            WHERE 
                LOWER(br.b_id) LIKE LOWER($1) OR
                LOWER(b.b_name) LIKE LOWER($1) OR
                LOWER(m.m_name) LIKE LOWER($1)
        `, [`%${query}%`]);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Error searching borrowed books:", err);
        res.status(500).json({ error: "Database query error" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});