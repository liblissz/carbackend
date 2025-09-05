//liblissz
import e from "express";
import Users from "../models/NormaluserLogin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { protect } from "../middleware/authMiddleware.js"; 
const router = e.Router();


const generateToken = (emailid) => {
  return jwt.sign({ emailid }, process.env.JWT_SECRET2 , { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { name, number, country, address, email, password } = req.body;

    // Validation
    if (!email || !name || !password || !number || !country || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 10) {
      return res.status(400).json({ message: "Password must be at least 10 characters long" });
    }

   
    const finduser = await Users.findOne({ email });
    if (finduser) {
      return res.status(401).json({ message: "This account already exists" });
    }
     const findnumber = await Users.findOne({ number });
    if (findnumber) {
      return res.status(401).json({ message: "The number  you entered already exists" });
    }

    // Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    const user = new Users({
      name,
      email,
      number, 
      country, 
      address,
      password: hashedPassword,
      profile: profileImage,
    });

    const savedUser = await user.save();
    const token = generateToken(user.email);

    res.status(201).json({
      message: "Account created successfully",
      token,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generating JWT token
    const token = generateToken(user.email);

    res.status(200).json({
       message: "Login successful",
        token,
     });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/profile/update", protect, async (req, res) => {
  try {
    const updates = req.body; // name, email, number, country, address, profile

    // Update user document
    const updatedUser = await Users.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true } // return updated document
    ).select("-password"); // exclude password

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Could not update profile" });
  }
});

export default router;
