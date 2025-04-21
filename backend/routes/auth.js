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
    const allUsers = db.prepare("SELECT * FROM users").all();
    console.log(allUsers);
    res.json(allUsers);
});

router.post("/register", upload.none() ,async (req, res) => {
    console.log(req.body);
    const { email, password, name } = req.body;
    const isFirstUser = db.prepare("SELECT * FROM users").all().length === 0;
    const role = isFirstUser ? "admin" : "user";
    db.prepare("INSERT INTO users (email, password, username, role, created_at) VALUES (?, ?, ?, ?, ?)").run([email, password, name ,role, currentDate()]);
    res.json({ message: "User registered successfully" });

});

router.post("/login", 
    upload.none(), (req, res) => {
        const userQuery  = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get([req.body.email, req.body.password]);
        if (userQuery === undefined) { return res.status(401).json({ success: false, message: "Invalid credentials" });}
        console.log("User found: ", userQuery);
        const token = jwt.sign(
            { email : userQuery.email, name : userQuery.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN+"h" });
        
        //send the token in a http-only cookie (Prevents JavaScript access)
        res.cookie("token", token, {
            httpOnly: true, //cannot be accessed by client side scripts
            secure: process.env.NODE_ENV === "production", //only sent over HTTPS in production
            sameSite: "strict", //CSRF protection
            maxAge: parseFloat(process.env.JWT_TOKEN_EXPIRES_IN)*60*60*1000 //N*hours

        });

        res.json({success : true, message: "Login successful", user : userQuery.email});
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