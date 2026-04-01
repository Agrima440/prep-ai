import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();
useEffect(() => {
  api.get("/auth/protected")
    .catch(() => navigate("/login"));
}, []);
  const logout = async () => {
  await api.post("/auth/logout");

  toast.success("Logged out 👋");
  navigate("/login");
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col items-center justify-center gap-4"
    >
      <h1 className="text-3xl font-bold">Dashboard 🎉</h1>

      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
</motion.div>  );
}