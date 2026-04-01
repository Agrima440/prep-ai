import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpiry: Date,
  googleId: String,
  githubId: String
}, { timestamps: true });

export default mongoose.model("User", userSchema);