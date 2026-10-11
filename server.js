const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;
const ALLOWED_ROLES = ["admin", "doctor", "nurse"];

const db = new sqlite3.Database(path.join(__dirname, "hospital_auth.db"));

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        secret TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        department TEXT NOT NULL,
        doctor TEXT NOT NULL,
        assigned_nurse TEXT,
        room TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Stable',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      INSERT OR IGNORE INTO patients (patient_id, name, age, department, doctor, assigned_nurse, room, status)
      VALUES
        ('PT-1001', 'Emma Johnson', 34, 'Cardiology', 'Dr. Lee', 'nurse@citycare.com', 'ICU-2', 'Critical'),
        ('PT-1002', 'Daniel Smith', 52, 'Orthopedics', 'Dr. Patel', 'nurse@citycare.com', 'Ward-A12', 'Stable'),
        ('PT-1003', 'Aisha Khan', 27, 'Neurology', 'Dr. Nguyen', 'nurse2@citycare.com', 'Ward-B05', 'Monitoring'),
        ('PT-1004', 'Noah Brown', 61, 'General Surgery', 'Dr. Ortiz', 'nurse@citycare.com', 'Ward-C08', 'Recovering'),
        ('PT-1005', 'Sophia Wilson', 41, 'Pediatrics', 'Dr. Reed', 'nurse2@citycare.com', 'Peds-4', 'Stable')
    `);
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, staff_id, name, email, password, role, secret FROM users WHERE email = ?",
      [email],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function getUserByStaffId(staffId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, staff_id, name, email, password, role, secret FROM users WHERE staff_id = ?",
      [staffId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function createUser({ staffId, name, email, password, role, secret }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (staff_id, name, email, password, role, secret) VALUES (?, ?, ?, ?, ?, ?)",
      [staffId, name, email, password, role, secret],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getPatientsByRole(user) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM patients`;
    const params = [];

    if (user.role === "nurse") {
      query += ` WHERE assigned_nurse = ?`;
      params.push(user.email);
    }

    query += ` ORDER BY created_at DESC`;

    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function createPatient({ patientId, name, age, department, doctor, assignedNurse, room, status }) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO patients (patient_id, name, age, department, doctor, assigned_nurse, room, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [patientId, name, age, department, doctor, assignedNurse || null, room, status || "Stable"],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

initDatabase();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "citycare-hospital-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true }
  })
);

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please log in first." });
  }
  next();
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({ message: "Access denied for this role." });
    }

    next();
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", async (req, res) => {
  const { staffId, name, email, password, role } = req.body;

  if (!staffId || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role selected." });
  }

  try {
    const existingByEmail = await getUserByEmail(email);
    const existingByStaffId = await getUserByStaffId(staffId);

    if (existingByEmail || existingByStaffId) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `CityCare Hospital:${email}` });

    await createUser({
      staffId,
      name,
      email,
      password: hashedPassword,
      role,
      secret: secret.base32
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.status(201).json({
      message: "Registration successful. Scan the QR code to complete 2FA setup.",
      qrCode
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error during registration." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    req.session.tempUser = {
      email: user.email,
      name: user.name,
      staffId: user.staff_id,
      role: user.role
    };

    return res.json({
      message: "Password verified. Please enter your 2FA code.",
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "OTP and email are required." });
  }

  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: "base32",
      token: otp
    });

    if (!verified) {
      return res.status(401).json({ message: "Invalid 2FA code." });
    }

    req.session.user = req.session.tempUser;
    delete req.session.tempUser;

    return res.json({
      message: "Login successful.",
      user: req.session.user
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Server error during OTP verification." });
  }
});

app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ user: req.session.user });
});

app.get("/api/patients", requireAuth, async (req, res) => {
  try {
    const patients = await getPatientsByRole(req.session.user);
    return res.json({ patients });
  } catch (error) {
    console.error("Fetch patients error:", error);
    return res.status(500).json({ message: "Failed to fetch patient records." });
  }
});

app.post("/api/patients", requireAuth, async (req, res) => {
  if (!["admin", "doctor"].includes(req.session.user.role)) {
    return res.status(403).json({ message: "Only admin and doctor roles can add patient records." });
  }

  const { patientId, name, age, department, doctor, assignedNurse, room, status } = req.body;

  if (!patientId || !name || !age || !department || !doctor || !room) {
    return res.status(400).json({ message: "Patient id, name, age, department, doctor, and room are required." });
  }

  try {
    const patient = await createPatient({
      patientId,
      name,
      age,
      department,
      doctor,
      assignedNurse,
      room,
      status
    });

    return res.status(201).json({ message: "Patient record added successfully.", patientId: patient });
  } catch (error) {
    console.error("Create patient error:", error);
    return res.status(500).json({ message: "Failed to add patient record." });
  }
});

app.post("/logout", requireAuth, (req, res) => {
  req.session.destroy(() => {
    return res.json({ message: "Logged out successfully." });
  });
});

app.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/doctor", requireAuth, requireRole("doctor"), (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "doctor.html"));
});

app.get("/nurse", requireAuth, requireRole("nurse"), (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "nurse.html"));
});

app.listen(PORT, () => {
  console.log(`Hospital auth system is running at http://localhost:${PORT}`);
});
