import express from "express";
import passport from "passport";
import { protect } from "../middlewares/auth.middleware.js";
import {
  signup, verifyOtp, login, loginWithOtp,
  refreshToken,
  logout,
  resendOtp
} from "../controllers/auth.controller.js";
import { generateTokens, setCookies } from "../utils/token.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/login-otp", loginWithOtp);

// GOOGLE
router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const tokens = generateTokens(req.user._id);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    res.redirect("http://localhost:3000/dashboard");
  }
);

// GITHUB
router.get("/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get("/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const tokens = generateTokens(req.user._id);
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    res.redirect("http://localhost:3000/dashboard");
  }
);
router.get("/refresh", refreshToken);
router.post("/logout", logout);

router.get("/protected", protect, (req, res) => {
  res.json({ message: "Protected data" });
});
router.post("/resend-otp", resendOtp);

export default router;