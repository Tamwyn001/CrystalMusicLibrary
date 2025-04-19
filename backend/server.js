//main server file
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import "dotenv/config";
import db from "./db.js"; // Import the database connection




console.log(`Initializing routes`);

// import translationsRouter from "./routes/translations.js";
import authRouter from "./routes/auth.js";
import readWriteRouter from "./routes/read-write.js";

import cookieParser from "cookie-parser"; 
// import path from "path";
// import { fileURLToPath } from "url";
console.log(`✅ Routes initialized`);
const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: "http://localhost:5174", //latter in production, all agree bc frontend and backend are on the same server
    credentials: true,
    exposedHeaders: ["Content-Disposition"] // Expose the header to the frontend
}));
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Server error" });
});
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
// app.use("/translations", translationsRouter);
// console.log(`  . 🏳️‍🌈  Translation`);
app.use("/auth", authRouter);
console.log(`  . 🔑     Authentification`);
app.use("/read-write", readWriteRouter);
console.log(`  . 📰     Read write music`);
// app.use("/images", imageRouter);
// console.log(`  . 🖼️     Images`);


// // Convert __dirname for ES module compatibility
// const __filename = fileURLToPath(import.meta.url);
// export const __dirname = path.dirname(__filename);

// // Serve static frontend files from dist/
// app.use(express.static(path.join(__dirname, "dist")));


// // Serve frontend for all other routes (React handles routing)
// app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
