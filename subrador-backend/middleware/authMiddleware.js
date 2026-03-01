const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // Get token from request header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // format: "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ message: "No token, access denied" });
  }
  
  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next(); // move on to the actual route handler
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};