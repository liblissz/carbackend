import express from "express";
import Cars from "../models/Cars.js";

const router = express.Router();

// CREATE CAR
router.post("/", async (req, res) => {
  try {
    const {
      title,
      make,
      model,
      year,
      price,
      description,
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
      img7,
      img8,
      img9,
    } = req.body;

    if (!title || !make || !model || !year || !price || !description || !img1) {
      return res.status(400).json({ message: "Title, make, model, year, price, description, and at least img1 are required." });
    }

    const newCar = new Cars({
      title,
      make,
      model,
      year,
      price,
      description,
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
      img7,
      img8,
      img9,
    });

    const savedCar = await newCar.save();
    res.status(201).json({ message: "Car added successfully", car: savedCar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET ALL CARS
router.get("/", async (req, res) => {
  try {
    const cars = await Cars.find().sort({ createdAt: -1 });
    res.status(200).json({ cars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// UPDATE CAR
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      make,
      model,
      year,
      price,
      description,
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
      img7,
      img8,
      img9,
    } = req.body;

    const updatedCar = await Cars.findByIdAndUpdate(
      id,
      { title, make, model, year, price, description, img1, img2, img3, img4, img5, img6, img7, img8, img9 },
      { new: true, runValidators: true }
    );

    if (!updatedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json({ message: "Car updated successfully", car: updatedCar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE CAR
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCar = await Cars.findByIdAndDelete(id);

    if (!deletedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.status(200).json({ message: "Car deleted successfully", car: deletedCar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET SINGLE CAR
router.get("/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const findCar = await Cars.findById(id);

    if (findCar) {
      res.status(200).json({ car: findCar });
    } else {
      res.status(404).json({ message: "Car not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
