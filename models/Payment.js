import mongoose from "mongoose"

const PaySchema = new mongoose.Schema(
    {
        paymentname: {
            type: String,
            required: true
        },
          processingfee: {
            type: String,
            required: true
        },
         description: {
            type: String,
            required: true
        },
     paymentlink: {
            type: String,
            required: true
        }

    },
    {timestamp: true}
)

const Payment = mongoose.model("Payment", PaySchema)

export default Payment