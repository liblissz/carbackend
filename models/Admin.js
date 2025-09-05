import mongoose from "mongoose";


const UserSchema = new mongoose.Schema(
    {
        name: {
        type: String,
        required: true,
        minlength: 8,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        profile:{
            type: String,
            default: ""
        }


    }
);

const Adminmodel =  mongoose.model("Admin", UserSchema);

export default Adminmodel;