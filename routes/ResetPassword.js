import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Users from "../models/NormaluserLogin.js";
import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";
const router = express.Router();
dotenv.config()
/* ------------------ Brevo Setup ------------------ */
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "vildashnetwork@gmail.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "ZOZAC";

const apiKey = process.env.BREVO_API_KEY

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = apiKey;
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();

/* ------------------ Helpers ------------------ */
function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // secure 6-digit
}

async function validateOTP(user, otp) {
  if (!user.resetOTP || !user.otpExpire) return "OTP expired or not generated";

  const now = Date.now();
  const expiresAt = user.otpExpire instanceof Date ? user.otpExpire.getTime() : Number(user.otpExpire);

  if (Number.isNaN(expiresAt) || expiresAt < now) {
    user.resetOTP = null;
    user.otpExpire = null;
    await user.save();
    return "OTP expired or not generated";
  }

  if (user.resetOTP !== otp) return "Invalid OTP";
  return null;
}

/* ------------------ Routes ------------------ */

// Step 1: Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await Users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.resetOTP = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    // ✅ Construct email step-by-step (working method)
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
    sendSmtpEmail.to = [{ email: user.email }];
    sendSmtpEmail.subject = "🔐 Your Password Reset OTP";
    sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8; margin:0; padding:0; color:#333; }
        .container { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); overflow:hidden; }
        .header { background: linear-gradient(135deg, #0d6efd, #6610f2); color:white; padding:25px; text-align:center; font-size:22px; font-weight:bold; }
        .content { padding:30px; }
        .otp-box { margin:20px 0; padding:20px; background:#f1f5f9; border-radius:8px; text-align:center; font-size:32px; letter-spacing:6px; font-weight:bold; color:#0d6efd; border:1px dashed #0d6efd; }
        .note { font-size:14px; color:#555; margin-top:10px; }
        .footer { background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#999; }
        @media (max-width:640px) { .container { margin:20px; } .otp-box { font-size:24px; letter-spacing:4px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Password Reset Request</div>
        <div class="content">
          <p>Hello <strong>${user.name || "there"}</strong>,</p>
          <p>We received a request to reset your password. Use the OTP below to continue. It’s valid for <strong>10 minutes</strong>:</p>
          <div class="otp-box">${otp}</div>
          <p class="note">⚠️ If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Vildash Network. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    await brevoClient.sendTransacEmail(sendSmtpEmail);
    return res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP Error:", err?.response?.body || err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Step 2: Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await Users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const error = await validateOTP(user, otp);
    if (error) return res.status(400).json({ message: error });

    return res.status(200).json({ message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});

// Step 3: Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });

    const user = await Users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const error = await validateOTP(user, otp);
    if (error) return res.status(400).json({ message: error });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOTP = null;
    user.otpExpire = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Password reset failed" });
  }
});

export default router;
