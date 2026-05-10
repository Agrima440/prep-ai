import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email, otp) => {
  try {
    console.log("SENDING EMAIL WITH RESEND");

    const data = await resend.emails.send({
      from: "agrimasharma47@gmail.com",
      to: email,
      subject: "OTP Verification",
      html: `
        <div style="font-family:sans-serif">
          <h2>Your OTP Code</h2>
          <h1>${otp}</h1>
          <p>This OTP expires in 10 minutes.</p>
        </div>
      `,
    });

    console.log("EMAIL SENT:", data);

    return true;

  } catch (error) {
    console.log("RESEND ERROR:", error);
    throw error;
  }
};