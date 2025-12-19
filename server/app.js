import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "ddunama2007@gmail.com";
const DEFAULT_ADMIN_PASSWORD_HASH =
  process.env.DEFAULT_ADMIN_PASSWORD_HASH ||
  "$2a$10$.UvX7qruiMxN2FvGnfU9mu/HRk0GhKgVdez8PLEYfAqxTAuw9mTfm"; // password: dunama200

async function resolveDefaultAdminPasswordHash() {
  const plain = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!plain) return DEFAULT_ADMIN_PASSWORD_HASH;
  return bcrypt.hash(String(plain), 10);
}

async function ensureDefaultAdmin() {
  try {
    const passwordHash = await resolveDefaultAdminPasswordHash();
    await pool.query(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES ($1, $2, 'admin', 'active')
       ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'active', password_hash = EXCLUDED.password_hash`,
      [DEFAULT_ADMIN_EMAIL, passwordHash]
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure default admin", err);
  }
}

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (!allowedOrigins.length) {
  allowedOrigins.push("http://localhost:5173", "http://localhost:3000");
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query("SELECT id, email, role, status FROM users WHERE id = $1", [decoded.id]);
    const user = rows[0];
    if (!user || user.status !== "active") return res.status(403).json({ error: "Inactive or missing user" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

// Auth
app.post("/api/auth/signup", async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  email = String(email).trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  try {
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, status",
      [email, hash]
    );
    const user = rows[0];
    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already exists" });
    res.status(500).json({ error: "Internal error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  email = String(email).trim().toLowerCase();
  const { rows } = await pool.query("SELECT id, email, role, status, password_hash FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (user.status !== "active") return res.status(403).json({ error: "Account not active" });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, status: user.status } });
});

// Users
app.get("/api/users", requireAuth, requireAdmin, async (_req, res) => {
  const { rows } = await pool.query("SELECT id, email, role, status, created_at FROM users ORDER BY created_at DESC");
  res.json(rows);
});

app.patch("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body || {};
  if (!role && !status) return res.status(400).json({ error: "role or status required" });

  const fields = [];
  const values = [id];
  if (role) {
    values.push(role);
    fields.push(`role = $${values.length}`);
  }
  if (status) {
    values.push(status);
    fields.push(`status = $${values.length}`);
  }

  const { rows } = await pool.query(
    `UPDATE users SET ${fields.join(", ")}
     WHERE id = $1
     RETURNING id, email, role, status, created_at`,
    values
  );

  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

// Folders
app.post("/api/folders", requireAuth, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const { rows } = await pool.query(
    "INSERT INTO folders (name, created_by) VALUES ($1, $2) RETURNING *",
    [name, req.user.id]
  );
  res.json(rows[0]);
});

app.get("/api/folders", requireAuth, async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM folders ORDER BY created_at DESC");
  res.json(rows);
});

app.delete("/api/folders/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query("DELETE FROM folders WHERE id = $1", [id]);
  if (!rowCount) return res.status(404).json({ error: "Folder not found" });
  res.json({ ok: true });
});

// Files
app.post("/api/files", requireAuth, requireAdmin, async (req, res) => {
  const { name, url, mime_type, size_bytes, folder_id } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Name and url required" });
  const { rows } = await pool.query(
    `INSERT INTO files (name, url, mime_type, size_bytes, folder_id, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, url, mime_type || null, size_bytes || null, folder_id || null, req.user.id]
  );
  res.json(rows[0]);
});

app.get("/api/files", requireAuth, async (req, res) => {
  const { folderId } = req.query;
  const params = [];
  let where = "";
  if (folderId) {
    where = "WHERE folder_id = $1";
    params.push(folderId);
  }
  const { rows } = await pool.query(`SELECT * FROM files ${where} ORDER BY created_at DESC`, params);
  res.json(rows);
});

app.delete("/api/files/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query("DELETE FROM files WHERE id = $1", [id]);
  if (!rowCount) return res.status(404).json({ error: "File not found" });
  res.json({ ok: true });
});

// Root
app.get("/", (_req, res) => res.json({ ok: true }));

// Safe in serverless too (idempotent insert/update)
ensureDefaultAdmin();

export default app;
