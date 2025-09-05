import express from "express";
import Order from "../models/Orders.js";
import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

// Helper to generate the luxury email
const generateLuxuryEmail = ({ name, notes, paymentLink, totalPrice, paymentMethod }) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Confirmed</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, sans-serif; background:#f4f6f8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" style="background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#0a2540; padding:30px; text-align:center; color:#fff;">
              <h1 style="margin:0; font-size:28px;">Hello ${name},</h1>
              <p style="margin:5px 0 0; font-size:16px;">Your order has been confirmed!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333;">
              ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ""}
              <p>Please complete your payment by clicking the button below:</p>
              <p style="text-align:center; margin:30px 0;">
                <a href="${paymentLink}" style="padding:15px 30px; background:#0a2540; color:#fff; text-decoration:none; border-radius:8px; font-size:16px;">Pay Now</a>
              </p>
              <p style="font-size:14px; color:#777;">Total: $${totalPrice} | Payment Method: ${paymentMethod}</p>
              <p style="margin-top:20px; font-size:14px; color:#555;">Thank you for choosing Wheelstone!</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f6f8; padding:20px; text-align:center; font-size:12px; color:#999;">
              &copy; ${new Date().getFullYear()} Wheelstone. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

router.post("/forward-payment/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentLink, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentLink = paymentLink;
    order.notes = notes || "";
    order.status = "Confirmed";
    await order.save();

    // Create email object
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: "vildashnetwork@gmail.com", name: "WHEELSTONE" };
    sendSmtpEmail.to = [{ email: order.user.email, name: order.user.name }];
    sendSmtpEmail.subject = `💎 Your Order #${order._id} is Confirmed – Payment Link Inside`;
    sendSmtpEmail.htmlContent = generateLuxuryEmail({
      name: order.user.name,
      notes,
      paymentLink,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentmethod
    });

    const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", result);

    res.status(200).json({ message: "Payment link sent and order confirmed", order });
  } catch (error) {
    // Log full error for debugging
    console.error("Forward payment error:", error.response?.body || error);
    res.status(500).json({ message: "Failed to send email. Check server logs." });
  }
});


export default router;

