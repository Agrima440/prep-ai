import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
export default function OTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [time, setTime] = useState(60);
  const navigate = useNavigate();

  const email = localStorage.getItem("email");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ✅ VERIFY FUNCTION (MOVE ABOVE)
  const verify = useCallback(async () => {
    try {
      const finalOtp = otp.join("");

      await api.post("/auth/verify-otp", { email, otp: finalOtp });

      toast.success("Verified successfully 🚀");
      navigate("/login");

    } catch (err) {
      toast.error(err.response?.data);
    }
  }, [otp, email, navigate]);

  // ✅ AUTO SUBMIT OTP
  useEffect(() => {
    if (otp.every(d => d !== "")) {
      verify();
    }
  }, [otp, verify]);

  // INPUT HANDLER
  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // RESEND OTP
  const resendOtp = async () => {
    try {
      await api.post("/auth/resend-otp", { email });

      toast.success("OTP resent 📩");

      setTime(60);
      setOtp(["", "", "", "", "", ""]);

    } catch (err) {
      toast.error(err.response?.data);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center backdrop-blur-md"
      >
        <h2 className="text-2xl font-bold mb-6">Verify OTP</h2>

        <div className="flex justify-between mb-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              value={digit}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, i)}
              className="w-12 h-12 text-center text-xl border rounded-lg"
            />
          ))}
        </div>

        <p className="text-gray-500 mb-4">Time left: {time}s</p>

        <button
          onClick={verify}
          className="w-full bg-green-500 text-white py-2 rounded-lg mb-2"
        >
          Verify OTP
        </button>

        {time === 0 ? (
          <button onClick={resendOtp} className="text-blue-500">
            Resend OTP
          </button>
        ) : (
          <p className="text-gray-400">Resend in {time}s</p>
        )}
      </motion.div>
    </div>
  );
}