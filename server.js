import express from 'express'
import dotenv from "dotenv"
import mongoose from "mongoose"
import cors from "cors"
import adminroute from "./routes/AdminLogin.js"
import cars from './routes/carroute.js'
import paymentsRouter from './routes/Pay.js'
import normaluserslogin from './routes/UserLogin.js'
import addtocart from './routes/UsersCart.js'
import orderRoutes from "./routes/orderRoutes.js";
import getuser from './routes/UserDetails.js'
import change from "./routes/ResetPassword.js"
import confirm from "./routes/Confirmed.js"
dotenv.config()
const app = express();


app.use(express.json())
app.use(cors())
app.use("/api/auth", change)
app.use("/api/confirm", confirm)
app.use("/me", getuser)
app.use("/api/orders", orderRoutes);
app.use('/admin', adminroute);
app.use("/cars", cars)
app.use("/payments", paymentsRouter);
app.use("/normal", normaluserslogin)
app.use("/add", addtocart)

const connectdb = async ()=>{
    try{
  const conn = await mongoose.connect(process.env.MONGO_URI)
  if(conn){
    console.log('====================================');
    console.log("database connected successfully");
    console.log('====================================');
  }else{
    console.log('====================================');
    console.log("error connecting to database");
    console.log('====================================');
  }
    }catch(error){
    console.log(error);
    
    }
}

connectdb().then(()=>{
    app.listen(process.env.PORT , ()=>{
        console.log('====================================');
        console.log(`server running on http://localhost:${process.env.PORT}`);
        console.log('====================================');
    })
})