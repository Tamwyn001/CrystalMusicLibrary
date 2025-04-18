//Arto Steffan 2025
//API routes for authentication
import multer from 'multer';
const upload = multer();


export const LoginStatus = {
    NONE: "none",
    LOGGED_OUT: "logged out",
    USER: "user",
    ADMIN: "admin"
    //do not use to veryfy the user role, this is only for the front end
};

import express from "express";
const router = express.Router();
import db from "../db.js"; 
import {currentDate} from "../lib.js";
import jwt from "jsonwebtoken";
// import { sanitizeBody } from "../lib.js";
//fetch auth

router.get("/any-user", (req, res) => {
    console.log("Fetching all users");
    db.query("SELECT * FROM users", (err, results) => { 
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
        return results.length;
    });
});

router.post("/register", upload.none() ,async (req, res) => {
    console.log(req.body);
    const { email, password, name } = req.body;
    const checkFirstUser = new Promise((resolve, reject) => {
        db.query("SELECT * FROM users", (err, results) => {
            if (err) return reject(err);
            resolve(results.length === 0);
        });
    });
    checkFirstUser.then((isFirstUser) => {
        const role = isFirstUser ? "admin" : "user";
        db.query("INSERT INTO users (email, password, username, role, created_at) VALUES (?, ?, ?, ?, ?)",
            [email, password, name ,role, currentDate()], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "User registered successfully" });
        });
    })
});

router.post("/login", 
    upload.none(), (req, res) => {
        db.query("SELECT * from users WHERE email = ? AND password = ?",
            [req.body.email, req.body.password], (err, results) => { 
                //generate a JWT token
            if (results.length == 0) { 
                return res.status(401).json({ success: false, message: "Invalid credentials" });
            }
            const token = jwt.sign(
                { email : results[0]['email'], name : results[0]['name'] },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN+"h" });
            
            //send the token in a http-only cookie (Prevents JavaScript access)
            res.cookie("token", token, {
                httpOnly: true, //cannot be accessed by client side scripts
                secure: process.env.NODE_ENV === "production", //only sent over HTTPS in production
                sameSite: "strict", //CSRF protection
                maxAge: parseFloat(process.env.JWT_TOKEN_EXPIRES_IN)*60*60*1000 //N*hours

            });

            res.json({success : true, message: "Login successful", user : results[0]['email']});
            }
        );
    });

router.post("/verifyToken", (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        console.log("Access denied. No token provided.");
        return res.status(401).json({ error: "Access denied. No token provided." });}
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
        res.json({success : true, message: "Token verified", user : decoded});
    }catch (err) {
        console.error("Error verifying token:", err);
        res.status(401).json({ error: "Invalid token." });
    }
});

router.post("/logout", (req, res) => {
    req.cookies.token = null;
    res.clearCookie("token");
    res.json({success : true, message: "Logout successful"});
});
export default router;