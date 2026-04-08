import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function Login() {
  const [form, setForm] = useState({});
    const [loading, setLoading] = useState(false);


const navigate = useNavigate();

const handleLogin = async () => {
  if (!form.email || !form.password) {
    toast.error("Fill all fields");
    return;
  }

  try {
    setLoading(true);

    await api.post("/auth/login", form);

    toast.success("Welcome back 🎉");

    navigate("/InterviewForm");

  } catch (err) {
    toast.error(err.response?.data);
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
       <h2 className="text-xl font-bold mb-4">Login</h2>

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
  onClick={handleLogin}
  disabled={loading}
  className="w-full bg-green-600 text-white py-2 rounded mb-3"
>
  {loading ? "Logging in..." : "Login"}
</button>

        <div className="text-center text-gray-500 mb-2">OR</div>

<a href={`${process.env.REACT_APP_API_URL}/auth/google`}>
          <button className="w-full border py-2 rounded mb-2">
            Continue with Google
          </button>
        </a>

        <a href={`${process.env.REACT_APP_API_URL}/auth/github`}>
          <button className="w-full bg-black text-white py-2 rounded">
            Continue with GitHub
          </button>
        </a>
        <p className="text-center mt-3">
  Don't have account?{" "}
<Link to="/signup" className="text-blue-500">Signup</Link>
</p>
      </motion.div>
    </div>
  );
}