import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 5000;

// PostgreSQL Database Connection
const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Convert file paths for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// API to get borrow & return data
app.get("/api/borrowed-books", async (req, res) => {
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
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching borrowed books:", err);
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