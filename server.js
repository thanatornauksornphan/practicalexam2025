import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 5000;

// Convert file paths for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve the homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "borrow_return.html"));
});

// API routes
app.get("/api/borrow-return", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT br.record_id, br.borrow_date, br.return_date, br.fine, 
                   b.b_id, b.b_name, m.m_id, m.m_name
            FROM tb_borrow_return br
            JOIN tb_book b ON br.b_id = b.b_id
            JOIN tb_member m ON br.m_id = m.m_id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});