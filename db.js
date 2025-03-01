import pg from 'pg';
const { Pool} = pg;

const pool = new Pool({
    user: "admin",
    host: "localhost",
    database: "db_library",
    password: "admin",
    port: 5432,
});

export default pool;