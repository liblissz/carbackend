import jwt from "jsonwebtoken";
import Users from "../models/NormaluserLogin.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET2); // your secret used at sign
    const user = await Users.findOne({ email: decoded.emailid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Make sure all required fields exist
    if (!user.location) user.location = "Unknown";
    if (!user.name) user.name = "Guest User";
    if (!user.number) user.number = "0000000000";
    if (!user.address) user.address = "Unknown";
    if(!user.email) user.email = "unknown";
    if (!user.country) user.country = "Unknown";

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token invalid" });
  }
};
