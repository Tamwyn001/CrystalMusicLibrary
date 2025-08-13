const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const isPkg = typeof process.pkg !== "undefined";
const readline = require("readline")
const { existsSync, mkdirSync, writeFile } = require("fs");
const APP_VERSION = "2.0.0";

// Public path handling (for /dist and static files)
const publicPath = isPkg
  ? path.join(path.dirname(process.execPath), 'dist')
  : path.join(__dirname, 'dist');

// .env loading (only outside pkg)
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

const dotEnvPath = path.join(basePath, ".env");
dotenv.config({ path: dotEnvPath });
console.log(`✅ Environment variables loaded`);

const rawPathData = process.env.CML_DATA_PATH || './data';
const resolvedDataPath = path.isAbsolute(rawPathData)
  ? rawPathData
  : (isPkg
      ? path.join(path.dirname(process.execPath), rawPathData)
      : path.resolve(__dirname, rawPathData));

console.log("Data path: ", resolvedDataPath);
try{
  for(const uploadDir of ["music", "covers", "covers\\artists","ffts"]){
      if (!existsSync(path.join(resolvedDataPath, uploadDir))){
          console.log(`Creating directory ${path.join(resolvedDataPath, uploadDir)}`);
          mkdirSync(path.join(resolvedDataPath, uploadDir), { recursive: true });
      }
  }
}
catch (err) {
    console.log("\x1b[1;31mCan't create or find directory DATA\x1b[0m, is the disc mounted?");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Press any key to exit... ', () => {
      rl.close();
      process.exit(1);
    });
    //@ts-ignore
    return;
}
process.env.CML_DATA_PATH_RESOLVED = resolvedDataPath;

const rawPathDatabase = process.env.CML_DATABASE_PATH || './db';

const resolvedDatabasePath =path.isAbsolute(rawPathDatabase)
? rawPathDatabase
: (isPkg
    ? path.join(path.dirname(process.execPath), rawPathDatabase)
    : path.resolve(__dirname, rawPathDatabase));

  console.log("Database path: ", resolvedDatabasePath);
try{
  if (!existsSync(resolvedDatabasePath)){
    console.log(`Creating directory ${resolvedDatabasePath}`);
    mkdirSync(resolvedDatabasePath, { recursive: true });
  }
}
catch (err) {
  console.log("\x1b[1;31mCan't create or find directory DB (DATABASE)\x1b[0m, is the disc mounted?");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Press any key to exit... ', () => {
    rl.close();
    process.exit(1);
  });
//@ts-ignore
  return;
}
// Initialize DB once
const { setupDatabase } = require('./db.js');
setupDatabase(resolvedDatabasePath, basePath);




const { networkInterfaces } = require("os");

const authRouter = require("./routes/auth.js");

console.log(`✅ Auth routes initialized`);
const { router : readWriteRouter, runServerStats } = require("./routes/read-write.js");
const cookieParser = require("cookie-parser");
const { fileURLToPath } = require("url");
const { default: checkDiskSpace } = require("check-disk-space");
// -----------------------------------
// 🛠️ Path handling for ESM & pkg
// -----------------------------------
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);





// -----------------------------------
// 📡 Get local IP
// -----------------------------------
function getLocalIPs() {
  const validIP = ['localhost'];
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === 'IPv4' &&
        !iface.internal &&
        !iface.address.startsWith('169.254')
      ) {
        validIP.push(iface.address);
      }
    }
  }
  return validIP;
}


// -----------------------------------
// 🚀 Initialize server
// -----------------------------------

const app = express();
const PORT = process.env.PORT || 4590;
const localDomains = getLocalIPs().map(ip => {return `http://${ip}:${PORT}`});

const allowedDomains = [
  "http://localhost:5173",
  "http://localhost:5174",
  'http://172.20.10.2:5174', //Vite mobile debug

];
allowedDomains.push(...localDomains);
console.log("✅ Web APP ready to be served");
app.use(express.static(publicPath));




const coversPath = path.join(resolvedDataPath, "covers");
app.use('/covers', express.static(coversPath));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) 
       {
        return callback(null, true);
       }
   

    if (allowedDomains.includes(origin)) return callback(null, true);
    console.log(" User from \x1b[1;31m",`${origin}`,"\x1b[0m is not trusted.");
    return callback(new Error(`This (${origin}) is not allowed, try to enter the ip printed when the library got ready.`), false);
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"]
}));
///relax the csp to allow serving own files for the pkg:
// if(isPkg){
//   app.use((req, res, next) => {
//     res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: http: https:; script-src 'self'; style-src 'self' 'unsafe-inline'");
//     next();
//   });
// }
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
console.log(`  . 🔑     Authentification`);
app.use("/read-write", readWriteRouter);
console.log(`  . 📰     Read write music`);
const JobsManager = require("./routes/jobs.js");
const RadioRouter = require("./routes/radio.js");
const LibraryConfig = require("./routes/libraryConfig.js");

const jobsManager = new JobsManager();

// Pass a reference of the job manager to the router.
readWriteRouter.jobManager = jobsManager;
app.use("/jobs", jobsManager.router);
console.log(`  .      Backend jobs`);
app.use("/radio", new RadioRouter().getRouter());
console.log(`  .      Radio router`);
const libraryConfig = new LibraryConfig(resolvedDataPath);
jobsManager.libraryConfig = libraryConfig;

app.use("/config", libraryConfig.router);
console.log(`  .      Config router`);
console.log(`✅ Routes initialized`);



app.get("/isResponding", (req, res) => {
  res.json({ message: "Server is responding" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});


// Fallback to React app for other routes.
//If user navs to /home with react its fine, this is pure JS.
//However when calling /home themselves, this is does not exist on the srever
//We then serve the basic index.html file
//! after all the other routes
try {
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(basePath, 'dist', 'index.html'));
  });
} catch (err) {
  console.error('Failed to create fallback route:', err);
}

// -----------------------------------
// 🟢 Start server
// -----------------------------------

runServerStats()
app.listen(PORT, () => {
  console.log(`==========================================\n
\x1b[92m. 🚀     Crystal Music Library Server online\x1b[0m v${APP_VERSION}\n
✅ The library can be accesed at \x1b[96m ${localDomains.join(" , ")}\x1b[0m\n
==========================================`);
});
const writeNewStorageEnv = async () => {
  const {free, size} = await checkDiskSpace(resolvedDataPath);
//@ts-ignore
  process.env.CML_TOTAL_STORAGE = size;
  //@ts-ignore
  process.env.CML_FREE_STORAGE = free;
  console.log(`  . 💾     Storage space: ${process.env.CML_TOTAL_STORAGE} bytes`);
}
writeNewStorageEnv();



// -----------------------------------
// 🌐 Open browser (only when NOT packaged)
// -----------------------------------
// if (!isPkg) {
//   const open = require("open");
//   open.default(`http://${localIP}:${PORT}`);
// }
