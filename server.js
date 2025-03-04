import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 5000;

// Using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL Database Connection
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// API to add new borrow/return record
app.post("/api/borrow-return", async (req, res) => {
    console.log("Incoming request data:", req.body);
    const { b_id, b_name, m_user, borrow_date, return_date, fine } = req.body;
    if (!b_id || !b_name) {
        return res.status(400).json({ error: "Missing book ID or book name" });
    }
    try {
        const recordIdResult = await pool.query("SELECT COALESCE(MAX(CAST(SUBSTRING(record_id, 2) AS INTEGER)), 0) + 1 AS next_id FROM tb_borrow_return");
        const newRecordId = `R${recordIdResult.rows[0].next_id.toString().padStart(5, '0')}`;

        await pool.query(
            `INSERT INTO tb_borrow_return 
            (record_id, b_name, m_user, borrow_date, return_date, fine) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [newRecordId, b_name, m_user, borrow_date, return_date || null, fine || 0]
        );

        res.status(201).json({ success: true, record_id: newRecordId });
    } catch (err) {
        console.error("Error adding borrow record:", err);
        res.status(500).json({ error: "Database error when adding record" });
    }


});

// API to search borrowed books
app.get("/api/borrowed-books", async (req, res) => {
    const search = req.query.search || "";

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
            LEFT JOIN tb_book b ON br.b_id = b.b_id
            LEFT JOIN tb_member m ON br.m_user = m.m_user
            WHERE 
                LOWER(br.b_id) LIKE LOWER($1) OR
                LOWER(b.b_name) LIKE LOWER($1) OR
                LOWER(m.m_name) LIKE LOWER($1)
        `, [`%${search}%`]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error searching borrowed books:", err);
        res.status(500).json({ error: "Database query error" });
    }
});

// Default route to serve the HTML page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "borrow_return.html"));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});