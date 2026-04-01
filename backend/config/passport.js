import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`},
async (_, __, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      email: profile.emails[0].value,
      googleId: profile.id,
      isVerified: true
    });
  }
  done(null, user);
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`},
async (_, __, profile, done) => {
  let user = await User.findOne({ githubId: profile.id });
  if (!user) {
    user = await User.create({
      email: profile.username + "@github.com",
      githubId: profile.id,
      isVerified: true
    });
  }
  done(null, user);
}));