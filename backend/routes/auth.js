//Arto Steffan 2025
//API routes for authentication

// const LoginStatus = {
//     NONE: "none",
//     LOGGED_OUT: "logged out",
//     USER: "user",
//     ADMIN: "admin"
//     //do not use to veryfy the user role, this is only for the front end
// };

const express = require("express");
const router = express.Router(); 
// @ts-ignore
const {currentDate} = require("../lib.js");
const jwt = require("jsonwebtoken");
const { getMulterInstance } = require("../multerConfig.js");
const { getUserRole, getUsersCount, checkUserExist, registerNewUser, getAllUsers, getUsers } = require('../db-utils.js');
// @ts-ignore
const multer = require("multer");
const verify = require("./verify.js");
const { join } = require("path");
const { writeFile } = require("fs");
const LibraryConfig = require("./libraryConfig.js");
// import { sanitizeBody } from "../lib.js";
//fetch auth
const upload = getMulterInstance(process.env.CML_DATA_PATH_RESOLVED);

// @ts-ignore
router.get("/any-user", (req, res) => {
    res.json(getUsersCount());
});

// @ts-ignore
router.post("/init-admin-pannel", (req, res) => {
    
    res.json({users: getAllUsers(), totalStorage: process.env.CML_TOTAL_STORAGE});
});

router.post("/register", upload.none() ,async (req, res) => {
    const { email, password, name } = req.body;
    try{
        const id = registerNewUser(email, password, name);
        console.log("User registered: \x1b[36m", name, "\x1b[0m");

        //Create a new default config file.
        LibraryConfig.CreateUserDefaultConfig(id);
    }catch (err) {
        if(err.code === 'SQLITE_CONSTRAINT_UNIQUE'){
             res.status(500).json({ error: "Email already in use." });
             return;
        }
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Error registering user." });
        return;
    }

    // @ts-ignore
    const token = jwt.sign(
        { email : email, username : name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN+"h" });
    
    //send the token in a http-only cookie (Prevents JavaScript access)
    res.cookie("token", token, {
        httpOnly: true, //cannot be accessed by client side scripts
        secure: process.env.NODE_ENV === "production", //only sent over HTTPS in production
        sameSite: "strict", //CSRF protection
        maxAge: parseFloat(process.env.JWT_TOKEN_EXPIRES_IN)*60*60*1000 //N*hours

    }).json({message : "Register success."});

});

// @ts-ignore
router.post("/login", upload.none(), (req, res) => {
        const userQuery  = checkUserExist(req.body.email, req.body.password);
        if (userQuery === undefined) { return res.status(401).json({ success: false, message: "Invalid credentials" });}
        // @ts-ignore
        const token = jwt.sign(
            { email : userQuery.email, username : userQuery.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN+"h" });
        
        //send the token in a http-only cookie (Prevents JavaScript access)
        res.cookie("token", token, {
            httpOnly: true, //cannot be accessed by client side scripts
            secure: process.env.NODE_ENV === "production", //only sent over HTTPS in production
            sameSite: "strict", //CSRF protection
            maxAge: parseFloat(process.env.JWT_TOKEN_EXPIRES_IN)*60*60*1000 //N*hours

        });
        console.log("Logged in \x1b[36m", userQuery.username, "\x1b[0m")
        res.json({success : true, message: "Login successful", username : userQuery.username});
    });


// @ts-ignore
router.post("/verifyToken", verify.token, (req, res) => {
    res.json({success : true, message: "Token verified", user : req.decoded});
});

router.post("/logout", (req, res) => {
    req.cookies.token = null;
    res.clearCookie("token");
    res.json({success : true, message: "Logout successful"});
});

// @ts-ignore
router.post("/is-admin", verify.isAdmin, (req, res) => {
    res.json(true);
});

router.get("/collaborators", (req, res) => {
    const token =req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
    // @ts-ignore
    res.json(getUsers().filter((user) => user.email !== decoded.email))
})


module.exports = router;