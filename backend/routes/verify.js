const jwt = require("jsonwebtoken");


module.exports = {
    isAdmin: (req, res, next) =>{
        const token = req.cookies.token;
        if (!token) {
            res.status(403).json({ error: "Access denied. No token provided." });}
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
            // @ts-ignore
            if(getUserRole(decoded.email) === 'admin'){
                next();
            }
        }catch (err) {
            console.error("Error verifying token:", err);
            res.status(403).json({ error: "Invalid token." });
        }
    }
}