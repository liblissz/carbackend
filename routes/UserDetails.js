import express from "express";
import Users from "../models/NormaluserLogin.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("", protect, async (req, res) => {
  try {
    // req.user is already set by protect middleware
    const user = await Users.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/users", async (req,res)=>{
  try{
  const users = await Users.find().select("-password");
  res.status(200).json(users);
  }catch(err){
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
})
export default router;
