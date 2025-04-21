//main server file
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import db from "./db.js"; // Import the database connection
import {networkInterfaces} from "os"; // Import the os module to get network interfaces

function getLocalIP() {
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (
          iface.family === 'IPv4' &&
          !iface.internal &&
          !iface.address.startsWith('169.254') // Skip link-local addresses
        ) {
          return iface.address;
        }
      }
    }
  }


console.log(`Initializing routes`);

import authRouter from "./routes/auth.js";
import readWriteRouter from "./routes/read-write.js";

import cookieParser from "cookie-parser"; 

console.log(`✅ Routes initialized`);
const app = express();
const PORT = process.env.PORT;
const localIP = getLocalIP();
const allowedDomains = [
  "http://localhost:5173",          // ton front local
  "http://localhost:5174",          
  "http://192.168.10.134:5173",     // ton IP réseau (pour ton iPhone)
  `http://${localIP}:4173`,
  'http://10.24.134.178:4173',
  'http://169.254.160.204:4173',
  "http://192.168.10.134:4173"
  // ajoute ici d'autres IPs/URLs de frontends autorisés
];

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origin (ex: curl, apps mobiles, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedDomains.includes(origin)) {
      return callback(null, true);
    }

    const msg = `Cette origine (${origin}) n'est pas autorisée.`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"]
}));
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Server error" });
});
app.use('/covers', express.static('data/covers'));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/auth", authRouter);
console.log(`  . 🔑     Authentification`);
app.use("/read-write", readWriteRouter);
console.log(`  . 📰     Read write music`);

app.listen(PORT, () => {
    console.log(`✅ Server running at http://${localIP}:4590`);
});
