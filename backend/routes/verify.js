const jwt = require("jsonwebtoken");
const { getUserRole, checkUserExist, checkUserExistsEmailName } = require("../db-utils");


module.exports = {
    isAdmin: (req, res, next) =>{
        const token = req.cookies.token;
        if (!token) {
            res.status(403).json({ error: "Access denied. No token provided." });
            return;
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore
            if(!decoded.email){
                return res.status(403).json({ error: "Access denied. No valid token provided." });
            }
            if(getUserRole(decoded.email) === 'admin'){
                req.decoded = decoded;
                next();
            }
        }catch (err) {
            console.error("Error verifying token:", err);
            return res.status(403).json({ error: "Invalid token." });
        }
    },
    token : (req, res, next) =>{
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(403).json({ error: "Access denied. No token provided." });}
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore
            if(!decoded.email){
                return res.status(403).json({ error: "Access denied. No valid token provided." });
            }
            if(!checkUserExistsEmailName(decoded.email, decoded.username)){
                return res.status(403).json({ error: "Access denied. No valid user found." });
            }
            req.decoded = decoded;
            next();
            
            // console.log("Auto logged in \x1b[36m", decoded.username, "\x1b[0m")
    
        }catch (err) {
            console.error("Error verifying token:", err);
            return res.status(403).json({ error: "Invalid token." });
        }
    }
}