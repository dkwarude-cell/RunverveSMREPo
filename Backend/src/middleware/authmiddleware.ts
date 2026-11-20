import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase.js";

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("🔐 Token verification started");

    const authHeader = req.headers.authorization;

    console.log(
      "Authorization header:",
      authHeader ? "Received" : "Missing"
    );

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const decodedToken = await auth.verifyIdToken(token);

    console.log("✅ Token verified");
    console.log("UID:", decodedToken.uid);
    console.log("Email:", decodedToken.email);

    (req as any).user = decodedToken;

    next();
  } catch (error) {
    console.error(
      "Token verification failed:",
      error instanceof Error ? error.message : error
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default verifyToken;