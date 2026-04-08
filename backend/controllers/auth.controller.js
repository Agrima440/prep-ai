import User from "../models/User.js";
import bcrypt from "bcrypt";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../config/mail.js";
import { generateTokens, setCookies } from "../utils/token.js";
import jwt from "jsonwebtoken";

export const refreshToken = (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.status(401).json("No refresh token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
secure: true,
sameSite: "none",    });

    res.json({ message: "Token refreshed" });

  } catch {
    return res.status(403).json("Invalid refresh token");
  }
};
// SIGNUP
export const signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json("User exists");

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    const user = await User.create({
      email,
      password: hashed,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000,
      isVerified: false
    });

    await sendOtpEmail(email, otp);

    res.json({ message: "OTP sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json("Server error");
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
if (
  !user ||
  !user.otp ||
  String(user.otp) !== String(otp) ||
  user.otpExpiry < Date.now()
) {
  return res.status(400).json("Invalid or expired OTP");
}    

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({ message: "Verified" });
  
};

// LOGIN

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.isVerified)
return res.status(400).json("Email not verified. Please verify OTP.");
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json("Wrong password");

  const { accessToken, refreshToken } = generateTokens(user._id);

  setCookies(res, accessToken, refreshToken);

res.json({ message: "Login successful", user: { email: user.email } });};

// PASSWORDLESS OTP
export const loginWithOtp = async (req, res) => {
  const { email } = req.body;

  let user = await User.findOne({ email });
if (!user) {
  return res.status(400).json("User not registered");
}
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  await user.save();

  await sendOtpEmail(email, otp);
  res.json({ message: "OTP sent" });
 
};

//Logout
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
  httpOnly: true,
  secure: true,
  sameSite: "none",
});

res.clearCookie("refreshToken", {
  httpOnly: true,
  secure: true,
  sameSite: "none",
});

  res.json({ message: "Logged out" });
};

// Resend OTP
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(404).json("User not found");

  if (user.isVerified)
    return res.status(400).json("User already verified");

  // 🔥 RATE LIMIT LOGIC HERE
  if (user.otpExpiry && user.otpExpiry > Date.now() - 30000) {
    return res.status(400).json("Wait before requesting OTP again");
  }

  const otp = generateOtp();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  await sendOtpEmail(email, otp);

  res.json({ message: "OTP resent" });
};

export const getUserController = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");
    if (!user) return res.status(404).json("User not found");
    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json("Server error");
  }
};
