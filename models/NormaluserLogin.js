import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  price: { type: String, required: true },
  description: { type: String, required: true },
  img1: { type: String, required: true },
  img2: { type: String, required: true },
  img3: { type: String, required: true }
}, { _id: true }); 

const useraSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profile: { type: String, default: "" },
  password: { type: String, required: true, minLength: 10 },
  UserCard: [cardSchema],
   resetOTP: { type: String },
  otpExpire: { type: Date },
}, { timestamps: true });

const Users = mongoose.model("NormalUser", useraSchema);
export default Users;
