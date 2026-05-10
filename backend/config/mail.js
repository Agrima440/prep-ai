import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    console.log("STARTING MAIL SERVICE");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();

    console.log("SMTP VERIFIED");

    const info = await transporter.sendMail({
      from: `"Prep AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "OTP Verification",
      html: `
        <div style="font-family:sans-serif">
          <h2>Your OTP Code</h2>
          <h1>${otp}</h1>
        </div>
      `,
    });

    console.log("EMAIL SENT:", info.response);

    return true;

  } catch (error) {
    console.log("FULL EMAIL ERROR:", error);
    throw error;
  }
};