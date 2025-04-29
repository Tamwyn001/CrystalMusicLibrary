console.log(`Initializing routes`);

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const db = require("./db.js");
const { networkInterfaces } = require("os");
const path = require("path");
console.log(`Starting authentication server`);
const authRouter = require("./routes/auth.js");
console.log(`✅ Auth routes initialized`);
const { router : readWriteRouter, runServerStats } = require("./routes/read-write.js");
const cookieParser = require("cookie-parser");
const { fileURLToPath } = require("url");
// -----------------------------------
// 🛠️ Path handling for ESM & pkg
// -----------------------------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const isPkg = typeof process.pkg !== "undefined";

// Public path handling (for /dist and static files)
const publicPath = isPkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

// .env loading (only outside pkg)
if (!isPkg) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}
console.log(`✅ Environment variables loaded`, process.env);
// -----------------------------------
// 📡 Get local IP
// -----------------------------------
function getLocalIP() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        !iface.address.startsWith('169.254')
      ) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

// -----------------------------------
// 🚀 Initialize server
// -----------------------------------
console.log(`✅ Routes initialized`);
const app = express();

const allowedDomains = [
  "http://localhost:5173",
  "http://localhost:5174",
  `http://${localIP}:4173`,
  `http://${localIP}:4590`,
  'http://10.24.134.178:4173',
  'http://169.254.160.204:4173',
  "http://192.168.10.134:4173",
  "http://192.168.10.134:5173"
];

console.log("Serving static files from", publicPath);
app.use(express.static(publicPath));
app.use('/covers', express.static(path.join(__dirname, 'data/covers')));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedDomains.includes(origin)) return callback(null, true);
    return callback(new Error(`Cette origine (${origin}) n'est pas autorisée.`), false);
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"]
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
console.log(`  . 🔑     Authentification`);
app.use("/read-write", readWriteRouter);
console.log(`  . 📰     Read write music`);

app.get("/isResponding", (req, res) => {
  res.json({ message: "Server is responding" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

// -----------------------------------
// 🟢 Start server
// -----------------------------------
const PORT = 4590;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://${localIP}:${PORT}`);
});

runServerStats()
console.log(`  . 📊     Server stats updated`);

// -----------------------------------
// 🌐 Open browser (only when NOT packaged)
// -----------------------------------
if (!isPkg) {
  const open = require("open");
  open.default(`http://${localIP}:${PORT}`);
}
