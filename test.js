import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
console.log('====================================');
console.log( process.env.BREVO_API_KEY );
console.log('====================================');
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

async function testEmail() {
  try {
    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { email: "vildashnetwork@gmail.com", name: "ZOZAC" }; // ✅ Correct
    email.to = [{ email: "vildashnetwork@gmail.com" }];
    email.subject = "Brevo Test";
    email.htmlContent = "<h1>Hello from Brevo!</h1><p>This is working 🎉</p>";

    const result = await apiInstance.sendTransacEmail(email);
    console.log("✅ Success:", result);
  } catch (err) {
    console.error("❌ Error:", JSON.stringify(err, null, 2));
  }
}

testEmail();
