import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Signup() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // ✅ INSIDE COMPONENT (TOP LEVEL)

const handleSubmit = async () => {
  if (!form.email || !form.password) {
    toast.error("Fill all fields");
    return;
  }

  try {
    setLoading(true);

    await api.post("/auth/signup", form);

    toast.success("OTP sent to your email 🎉");

    localStorage.setItem("email", form.email);
    navigate("/otp");

  } catch (err) {
    toast.error(err.response?.data || "Signup failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center backdrop-blur-md"
      >
        <h2 className="text-xl font-bold mb-4">Signup</h2>

        <input
          placeholder="Email"
          className="w-full p-2 border mb-3"
          onChange={e => setForm({...form, email: e.target.value})}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border mb-3"
          onChange={e => setForm({...form, password: e.target.value})}
        />

       <button
  onClick={handleSubmit}
  disabled={loading}
  className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
>
  {loading ? "Sending OTP..." : "Signup"}
</button>

        <p className="text-center mt-3">
          Already have account?{" "}
<Link to="/login" className="text-blue-500">Login</Link>
        </p>
            </motion.div>

    </div>
  );
}