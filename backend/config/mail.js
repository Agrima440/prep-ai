import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"Prep AI" <${process.env.EMAIL_USER}>`,
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

    console.log("EMAIL SENT");

  } catch (error) {
    console.log("FULL EMAIL ERROR:", error);
    throw error;
  }
};