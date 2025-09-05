//liblissz
import e from "express";
import Adminmodel from "../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = e.Router();


const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET , { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    if (name.length < 6) {
      return res.status(400).json({ message: "Name must be at least 6 characters long" });
    }

    // Check existing user
    const finduser = await Adminmodel.findOne({ email });
    if (finduser) {
      return res.status(401).json({ message: "This account already exists" });
    }

    // Hash password & create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

    const user = new Adminmodel({
      name,
      email,
      password: hashedPassword,
      profile: profileImage,
    });

    const savedUser = await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        name,
        email,
        profile: profileImage,
      },
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
    const user = await Adminmodel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generating JWT token
    const token = generateToken(user._id);

    res.status(200).json({
       message: "Login successful",
        token,
       user: {
       name: user.name,
        email: user.email,
        profile: user.profile,
      },
     });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/all', async (req,res)=>{
  try{
    const getall = await Adminmodel.find();
      res.status(200).json(getall)
  }catch(err){
    console.log('====================================');
    console.log(err);
    console.log('====================================');
  }
})
export default router;
