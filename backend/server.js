import dotenv from "dotenv";
dotenv.config(); // MUST BE FIRST LINE

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";           
import "./config/passport.js";            
import authRoutes from "./routes/auth.routes.js";
import "./config/passport.js";
import { connectDB } from "./config/db.js";


connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/auth", authRoutes);


app.listen(5000, () => console.log("Server running"));

