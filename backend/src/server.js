import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import savingGoalRoutes from './routes/savingGoalRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const allowVercelHosts =
  process.env.CORS_ALLOW_VERCEL === '1' || process.env.CORS_ALLOW_VERCEL === 'true';

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin)) return callback(null, true);

  if (allowVercelHosts) {
    try {
      const { hostname } = new URL(origin);
      if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch {
      // ignore invalid origin
    }
  }

  if (allowedOrigins.length === 0) return callback(null, true);

  callback(null, false);
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

function errorResponse(res, status, message, error) {
  if (isProd) return res.status(status).json({ message });
  return res.status(status).json({ message, error });
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/saving-goals', savingGoalRoutes);
app.use('/api/budgets', budgetRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SakuPintar API' });
});

async function initSchema() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.resolve(__dirname, './db/schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    // schema.sql uses CREATE TABLE IF NOT EXISTS so it's safe to run on startup
    await db.query(stmt);
  }
}

// Test DB Connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    res.json({ message: 'Database connected successfully', data: rows });
  } catch (error) {
    const message =
      error?.code === 'ECONNREFUSED'
        ? 'Tidak bisa konek ke MySQL. Pastikan MySQL service berjalan (localhost:3306).'
        : (error?.message || String(error) || 'Database connection failed');
    return errorResponse(res, 500, message, error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET is not set. Auth will fail until it is provided.');
    }
    await initSchema();
    console.log('Database schema initialized');
  } catch (e) {
    const msg =
      e?.code === 'ECONNREFUSED'
        ? 'Failed to initialize schema: cannot connect to MySQL (ECONNREFUSED).'
        : `Failed to initialize schema: ${e?.message || e}`;
    console.error(msg);
  }
  console.log(`Server is running on port ${PORT}`);
});
