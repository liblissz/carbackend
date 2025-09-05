// routes/cars.js
import express from "express";
import Cars from "../models/Cars.js";

const router = express.Router();


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
    } = req.body;


    if (!title || !make || !model || !year || !price || !description || !img1 || !img2 || !img3) {
      return res.status(400).json({ message: "All fields are required." });
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
    });

    const savedCar = await newCar.save();
    res.status(201).json({ message: "Car added successfully", car: savedCar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/", async (req, res) => {
  try {
    const cars = await Cars.find().sort({ createdAt: -1 }); 
    res.status(200).json({ cars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
    } = req.body;

    // Find the car and update the fields
    const updatedCar = await Cars.findByIdAndUpdate(
      id,
      { title, make, model, year, price, description, img1, img2, img3 },
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

router.get("/cart/:id", async(req, res)=>{
    try{
        const {id}= req.params;
       const finduser = await Cars.findById({_id: id})

       if(finduser){
        res.status(200).json({finduser})
       }else if (!finduser){
        res.status(404).json({message: "user not found"})
       }
    }catch(error){
        res.status(500).json({error})
        console.log(error)
    }
})
export default router;
