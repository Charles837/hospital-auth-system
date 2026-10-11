const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;
const ALLOWED_ROLES = ["admin", "doctor", "nurse"];

const users = [];

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

  const existingUser = users.find(
    (user) => user.email === email || user.staffId === staffId
  );

  if (existingUser) {
    return res.status(409).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const secret = speakeasy.generateSecret({ name: `CityCare Hospital:${email}` });

  users.push({
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
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = users.find((currentUser) => currentUser.email === email);

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
    staffId: user.staffId,
    role: user.role
  };

  return res.json({
    message: "Password verified. Please enter your 2FA code.",
    email: user.email
  });
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "OTP and email are required." });
  }

  const user = users.find((currentUser) => currentUser.email === email);

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
});

app.get("/api/me", requireAuth, (req, res) => {
  return res.json({ user: req.session.user });
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
