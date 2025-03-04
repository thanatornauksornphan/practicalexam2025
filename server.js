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
    const { b_id, m_user, borrow_date, return_date, fine } = req.body;

    if (!b_id || !borrow_date || !m_user) {
        return res.status(400).json({ error: "Missing required fields: b_id, m_user, or borrow_date" });
    }

    try {
        // Generate next record ID first
        const idResult = await pool.query(`
            SELECT COALESCE(
                MAX(CAST(SUBSTRING(record_id, 2) AS INTEGER)), 
                0
            ) + 1 AS next_id
            FROM tb_borrow_return
            WHERE record_id LIKE 'R%'`
        );
        const newRecordId = `R${idResult.rows[0].next_id.toString().padStart(5, '0')}`;

        // Then insert the borrow record (no b_name here)
        await pool.query(
            `INSERT INTO tb_borrow_return 
            (record_id, b_id, m_user, borrow_date, return_date, fine) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [newRecordId, b_id, m_user, borrow_date, return_date || null, fine || 0]
        );

        console.log("✅ Success: Added borrow record", newRecordId);
        res.status(201).json({ success: true, record_id: newRecordId });
    } catch (err) {
        console.error("❌ Database error:", err.message, "\nStack Trace:", err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/borrow-return/:b_id", async (req, res) => {
    const { b_id } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                br.b_id,
                br.m_user,
                br.borrow_date,
                br.return_date,
                br.fine,
                m.m_name,
                b.b_name
            FROM tb_borrow_return br
            LEFT JOIN tb_member m ON br.m_user = m.m_user
            LEFT JOIN tb_book b ON br.b_id = b.b_id
            WHERE br.b_id = $1
            LIMIT 1
        `, [b_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลการยืมหนังสือนี้" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching return details:", error);
        res.status(500).json({ error: "Database error while fetching return details." });
    }
});

// Get book details by ID
app.get("/api/books/:b_id", async (req, res) => {
    const { b_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT b_id, b_name FROM tb_book WHERE b_id = $1`,
            [b_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบข้อมูลหนังสือ" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching book:", error);
        res.status(500).json({ error: "เกิดข้อผิดพลาดระหว่างดึงข้อมูลหนังสือ" });
    }
});


app.delete("/api/borrow-return/:b_id", async (req, res) => {
    const { b_id } = req.params;

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

app.get("/api/members", async (req, res) => {
    try {
        const result = await pool.query("SELECT m_user, m_name FROM tb_member");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: "Database error fetching members." });
    }
});

// Fetch user ID by name (for borrow form)
app.get("/api/members/:name", async (req, res) => {
    const { name } = req.params;

    try {
        const result = await pool.query("SELECT m_user FROM tb_member WHERE m_name = $1", [name]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้นี้" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching member ID:", error);
        res.status(500).json({ error: "ไม่สามารถค้นหาผู้ใช้" });
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