import mongoose from "mongoose";

const CarSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        make: { type: String, required: true },
        model: { type: String, required: true },
        year: { type: String, required: true },
        price: { type: String, required: true },
        description: { type: String, required: true },
        img1: { type: String, required: true },
        img2: { type: String },
        img3: { type: String },
        img4: { type: String },
        img5: { type: String },
        img6: { type: String },
        img7: { type: String },
        img8: { type: String },
        img9: { type: String },
    },
    { timestamps: true }
);

const Cars = mongoose.model("Car", CarSchema);

export default Cars;
