
import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check whether token exists
    if (!authHeader) {
      console.log("JWT ERROR: Authorization header missing");

      return res.status(401).json({
        success: false,
        message: "Authorization header missing"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.log("JWT ERROR: Invalid Bearer format");

      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is empty"
      });
    }

    // Check JWT secret configuration
    if (!process.env.JWT_SECRET) {
      console.error("JWT ERROR: JWT_SECRET is missing");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error"
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("JWT verification successful");
    console.log("Authenticated user ID:", decoded.id);

    req.userId = decoded.id;

    next();

  } catch (error) {
    console.error("JWT ERROR TYPE:", error.name);
    console.error("JWT ERROR MESSAGE:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token verification failed",
      errorType: error.name
    });
  }
};

export default protect;
