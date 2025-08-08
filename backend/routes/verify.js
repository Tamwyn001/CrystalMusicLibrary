const jwt = require("jsonwebtoken");
const { getUserRole } = require("../db-utils");


module.exports = {
    isAdmin: (req, res, next) =>{
        const token = req.cookies.token;
        if (!token) {
            res.status(403).json({ error: "Access denied. No token provided." });}
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore

            if(getUserRole(decoded.email) === 'admin'){
                req.decoded = decoded;
                next();
            }
        }catch (err) {
            console.error("Error verifying token:", err);
            res.status(403).json({ error: "Invalid token." });
        }
    },
    token : (req, res, next) =>{
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });}
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore
            if(!decoded.email){throw new Error("user not valid, redirect to login");}
            req.decoded = decoded;
            next();
            
            // console.log("Auto logged in \x1b[36m", decoded.username, "\x1b[0m")
    
        }catch (err) {
            console.error("Error verifying token:", err);
            res.status(401).json({ error: "Invalid token." });
        }
    }
}