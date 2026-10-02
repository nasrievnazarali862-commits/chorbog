const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// Maxfiy kodni shu yerda o'zgartiring.
// Internetga joylashtirganda ALAMLI_CODE environment variable berish xavfsizroq.
const ACCESS_CODE = process.env.ALAMLI_CODE || "7777";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "alamli-status-change-this-secret";

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(path.join(__dirname, "alamli.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

function requireAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.status(401).json({ error: "Maxfiy kod kerak." });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Faqat rasm fayllari mumkin."));
  }
});

// Kirish sahifasi ochiq, saytning qolgan qismi esa himoyalangan.
app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    return res.sendFile(path.join(__dirname, "public", "login.html"));
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/login", (req, res) => {
  const code = String(req.body.code || "");

  if (code !== ACCESS_CODE) {
    return res.status(401).json({ error: "Kod noto‘g‘ri." });
  }

  req.session.authenticated = true;
  res.json({ success: true });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/me", (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});

app.get("/api/statuses", requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, text, image, created_at
    FROM statuses
    ORDER BY id DESC
  `).all();
  res.json(rows);
});

app.post("/api/statuses", requireAuth, upload.single("image"), (req, res) => {
  const text = (req.body.text || "").trim();
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  if (!text && !image) {
    return res.status(400).json({ error: "Status yoki rasm qo‘shing." });
  }

  const result = db.prepare(`
    INSERT INTO statuses (text, image) VALUES (?, ?)
  `).run(text, image);

  const status = db.prepare(`
    SELECT id, text, image, created_at
    FROM statuses WHERE id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(status);
});

app.delete("/api/statuses/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT image FROM statuses WHERE id = ?").get(id);

  if (!row) return res.status(404).json({ error: "Status topilmadi." });

  db.prepare("DELETE FROM statuses WHERE id = ?").run(id);

  if (row.image) {
    const filename = path.basename(row.image);
    const file = path.join(uploadsDir, filename);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  res.json({ success: true });
});

app.use("/uploads", requireAuth, express.static(uploadsDir));

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Xatolik yuz berdi." });
});

app.listen(PORT, () => {
  console.log(`Alamli Status: http://localhost:${PORT}`);
  console.log(`Maxfiy kod: ${ACCESS_CODE}`);
});