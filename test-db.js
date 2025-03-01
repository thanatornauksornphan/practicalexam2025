import pool from './db.js';

pool.query("SELECT NOW()")
    .then(res => {
        console.log("Database connection successful", res.rows[0]);
        pool.end();
    })
    .catch(err => {
        console.log("Database connection failed", err);
        pool.end();
    });