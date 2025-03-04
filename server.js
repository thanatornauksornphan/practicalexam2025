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
    console.log("Received Data : ", req.body);
    const { b_id, b_name, m_user, borrow_date, return_date, fine } = req.body;
    if (!b_id || !b_name) {
        return res.status(400).json({ error: "Missing required fields: b_id or borrow_date" });
    }
    try {
        const recordIdResult = await pool.query("SELECT COALESCE(MAX(CAST(SUBSTRING(record_id, 2) AS INTEGER)), 0) + 1 AS next_id FROM tb_borrow_return");
        const newRecordId = `R${recordIdResult.rows[0].next_id.toString().padStart(5, '0')}`;

        const bookResult = await pool.query("SELECT b_name FROM tb_book WHERE b_id = $1", [b_id]);
        if (bookResult.rows.length === 0) {
            return res.status(404).json({ error: "Book not found" });
        }
        const b_name = bookResult.rows[0].b_name;

        await pool.query(
            `INSERT INTO tb_borrow_return 
            (record_id, b_name, m_user, borrow_date, return_date, fine) 
            VALUES ($1, $2, $3, $4, $5, $6)`,

            [newRecordId, b_name, m_user, borrow_date, return_date || null, fine || 0]

        );

        console.log("Success: Added borrow record", newRecordId);
        res.status(201).json({ success: true, record_id: newRecordId });
    } catch (err) {
        console.error("❌ Database error:", err.message, "\nStack Trace:", err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/borrow-return/:b_id", async (req, res) => {
    const { b_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT b_id, m_user, borrow_date, return_date, fine 
             FROM tb_borrow_return WHERE b_id = $1`,
            [b_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Book not found or not borrowed." });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching return details:", error);
        res.status(500).json({ error: "Database error while fetching return details." });
    }
});

app.delete("/api/borrow-return/:b_id", async (req, res) => {
    const { b_id } = req.params;
    const { fine } = req.body;

    try {
        // Optional: Store fine in another table before deleting
        await pool.query(`DELETE FROM tb_borrow_return WHERE b_id = $1`, [b_id]);

        res.json({ message: "Book returned successfully." });
    } catch (error) {
        console.error("Error returning book:", error);
        res.status(500).json({ error: "Database error while returning book." });
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