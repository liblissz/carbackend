// routes/payments.js
import express from "express";
import Payment from "../models/Payment.js";

const router = express.Router();

// POST /payments - Add a new payment method
router.post("/", async (req, res) => {
  try {
    const { paymentname, processingfee, description, paymentlink } = req.body;

    // Validate required fields
    if (!paymentname || !processingfee || !description || !paymentlink) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newPayment = new Payment({
      paymentname,
      processingfee,
      description,
      paymentlink,
    });

    const savedPayment = await newPayment.save();
    res.status(201).json({ message: "Payment added successfully", payment: savedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /payments - List all payments (optional)
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.status(200).json({ payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// UPDATE /payments/:id - Update a payment record
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentname, processingfee, description, paymentlink } = req.body;

    // Validate required fields
    if (!paymentname || !processingfee || !description || !paymentlink) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find and update the payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      { paymentname, processingfee, description, paymentlink },
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ message: "Payment updated successfully", payment: updatedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPayment = await Payment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ message: "Payment deleted successfully", payment: deletedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
