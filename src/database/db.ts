import { Pool } from "pg";

export default new Pool({
    max: 20,
    connectionString: 'postgres://localhost:5432/postgres',
    idleTimeoutMillis: 30000,
});

/*
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number.parseInt(process.env.DB_PORT + ''),
 */