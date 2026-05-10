import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"MERN Auth" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<h2>Thanks for joining! Your verification code is ${otp}</h2>`
    });

    console.log("EMAIL SENT:", info.response);
  } catch (error) {
    console.log("EMAIL ERROR:", error);
  }
};