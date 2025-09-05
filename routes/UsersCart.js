
import e from "express";
import jwt from "jsonwebtoken";
import Users from "../models/NormaluserLogin.js"; 

const router = e.Router();


const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No authorization header" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token missing" });

    const payload = jwt.verify(token, process.env.JWT_SECRET2);
    if (!payload?.emailid) return res.status(401).json({ message: "Invalid token payload" });

    const user = await Users.findOne({ email: payload.emailid });
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};


router.post("/", authenticate, async (req, res) => {
  try {
    const { title, make, model, year, price, description, img1, img2, img3 } = req.body;

    if (!title || !make || !model || !year || !price || !description || !img1) {
      return res.status(400).json({ message: "Missing required card fields (title, make, model, year, price, description, img1)" });
    }

    const newCard = {
      title,
      make,
      model,
      year,
      price,
      description,
      img1,
      img2: img2 || "",
      img3: img3 || "",
    };

    req.user.UserCard.push(newCard);
    await req.user.save();

  // Return the newly added card
    const savedCard = req.user.UserCard[req.user.UserCard.length - 1];
    return res.status(201).json({ message: "Card added", card: savedCard });
  } catch (err) {
    console.error("Add card error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/", authenticate, async (req, res) => {
  try {
    return res.status(200).json({ cards: req.user.UserCard });
  } catch (err) {
    console.error("Get cards error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get a single card by subdocument id
 * GET /normal/cards/:cardId
 */
router.get("/:cardId", authenticate, async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = req.user.UserCard.id(cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });
    return res.status(200).json({ card });
  } catch (err) {
    console.error("Get card error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * Update a single card
 * PUT /normal/cards/:cardId
 * Body can contain any of the card fields to update.
 */
router.put("/:cardId", authenticate, async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = req.user.UserCard.id(cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    // Only update allowed fields
    const updatable = ["title", "make", "model", "year", "price", "description", "img1", "img2", "img3"];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) card[field] = req.body[field];
    });

    await req.user.save();
    return res.status(200).json({ message: "Card updated", card });
  } catch (err) {
    console.error("Update card error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:cardId", authenticate, async (req, res) => {
  try {
    const { cardId } = req.params;

    // Try to find the card first
    const found = req.user.UserCard.find(
      (c) => String(c._id || c.id) === String(cardId)
    );
    if (!found) {
      return res.status(404).json({ message: "Card not found" });
    }

    // If MongooseArray with pull() method is available, use it
    if (typeof req.user.UserCard.pull === "function") {
      req.user.UserCard.pull(found._id || found.id || cardId);
    } else {
      // Fallback: filter out the card (works for plain arrays)
      req.user.UserCard = req.user.UserCard.filter(
        (c) => String(c._id || c.id) !== String(cardId)
      );
    }

    await req.user.save();
    return res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    console.error("Delete card error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/delete/actually", async(req, res)=>{
try{
await Users.deleteMany();
res.status(201).json({message: "users deleted"})
}catch(error){
  console.log('====================================');
  console.log(error);
  console.log('====================================');
}
})
export default router;
