import express from "express";
import SibApiV3Sdk from "sib-api-v3-sdk";
import Order from "../models/Orders.js";
import { protect } from "../middleware/authMiddleware.js"; 
import Users from "../models/NormaluserLogin.js";
import Adminmodel from "../models/Admin.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Set API key from environment variable
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY ;

// Use this instance for sending emails
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

router.post("/deletecard", protect, async (req, res) => {
  try {
    await Users.findByIdAndUpdate(req.user._id, { UserCard: [] });
 res.status(201).json({message: "cart deleted"})
  } catch (error) {
    console.log('====================================');
    console.log(error);
    console.log('====================================');
  }
})

router.post("/", protect, async (req, res) => {
  try {
    const { cartItems, totalPrice, paymentmethod } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    const formattedItems = cartItems.map(item => ({
      productId: item.productId,
      name: item.title,
      price: item.price,
      quantity: item.quantity,
      img1: item.img1,
      model: item.model
    }));

    const order = new Order({
      user: {
        _id: req.user._id,
        name: req.user.name,
        number: req.user.number,
        address: req.user.address,
        location: req.user.location,
        country: req.user.country,
        email: req.user.email,
        profile: req.user.profile
      },
      cartItems: formattedItems,
      totalPrice,
      paymentmethod
    });

    const createdOrder = await order.save();
    await Users.findByIdAndUpdate(req.user._id, { UserCard: [] });
    res.status(201).json(createdOrder);

    // Email generation helper
    const generateOrderEmail = ({ recipientName, recipientProfile, isAdmin }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Order Notification</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fa; font-family:Arial, Helvetica, sans-serif; color:#333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background:#0a2540; padding:30px;">
              <img src="${recipientProfile}" alt="Recipient Image" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px;" />
              <h1 style="margin:0; font-size:26px; font-weight:600; color:#ffffff;">${isAdmin ? 'New Order Alert' : 'Your Order Confirmation'}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              <p style="font-size:18px; margin:0 0 15px;">Hello <strong>${recipientName}</strong>,</p>
              <p style="font-size:16px; margin:0 0 25px;">
                ${isAdmin 
                  ? `A new order has been placed by <strong>${order.user.name}</strong>.` 
                  : `You just placed an order on Wheelstone. Below are your order details: (please check your email after 15mins for the transaction link)`}
              </p>

              ${order.user.profile ? `
              <div style="text-align:center; margin-bottom:25px;">
                <img src="${order.user.profile}" alt="Customer Image" width="100" height="100" style="border-radius:50%; object-fit:cover;" />
                <p style="margin-top:10px; font-size:14px; color:#666;">Customer</p>
              </div>` : ''}

              <h2 style="font-size:20px; margin-bottom:15px; color:#0a2540;">Order Summary</h2>
              ${order.cartItems.map(item => `
                <div style="display:flex; align-items:center; border:1px solid #e0e0e0; border-radius:8px; padding:10px 15px; margin-bottom:12px;">
                
                  <div style="flex:1;">
                    <h3 style="margin:0 0 5px; font-size:16px; color:#333;">${item.name}</h3>
                    <p style="margin:0; font-size:14px; color:#555;">Quantity: ${item.quantity}</p>
                    <p style="margin:0; font-size:14px; color:#555;">Price: $${item.price}</p>
                  </div>
                </div>
              `).join('')}

              <div style="margin-top:25px; padding:15px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;">
                <h2 style="margin:0; font-size:18px; color:#166534;">Total Price: $${order.totalPrice}</h2>
                <p style="margin:5px 0 0; font-size:15px; color:#166534;">Payment Method: ${order.paymentmethod}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#0a2540; padding:20px; color:#ffffff; font-size:13px;">
              <p style="margin:0;">Wheelstone &copy; 2025 | All rights reserved</p>
              <p style="margin:5px 0 0;">Contact: <a href="mailto:info@wheelstone.com" style="color:#4ade80; text-decoration:none;">info@wheelstone.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    // Send email to admins
    const admins = await Adminmodel.find();
    for (const admin of admins) {
      try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { email: "vildashnetwork@gmail.com", name: "ZOZAC" };
        sendSmtpEmail.to = [{ email: admin.email }];
        sendSmtpEmail.subject = `🚀 New Order from ${order.user.name}`;
        sendSmtpEmail.htmlContent = generateOrderEmail({ recipientName: admin.name, recipientProfile: admin.profile, isAdmin: true });
        const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
        console.log(`📧 Email sent to admin: ${admin.email} | MessageId: ${result.messageId}`);
      } catch (err) {
        console.error(`❌ Failed to email admin ${admin.email}:`, err.message);
      }
    }

    // Send email to normal users (optional)
    const normalUsers = await Users.find();
    for (const user of normalUsers) {
      try {
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { email: "vildashnetwork@gmail.com", name: "ZOZAC" };
        sendSmtpEmail.to = [{ email: user.email }];
        sendSmtpEmail.subject = `✅ Your Order Confirmation`;
        sendSmtpEmail.htmlContent = generateOrderEmail({ recipientName: user.name, recipientProfile: user.profile, isAdmin: false });
        const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
        console.log(`📧 Email sent to user: ${user.email} | MessageId: ${result.messageId}`);
      } catch (err) {
        console.error(`❌ Failed to email user ${user.email}:`, err.message);
      }
    }

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: error.message });
  }
});



// Get all orders for logged in user
router.get("/myorders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ "user._id": req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
   await  Order.deleteMany()
    res.status(200).json(
    {message : "orders deleted"}
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
