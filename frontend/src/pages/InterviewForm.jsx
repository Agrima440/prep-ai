import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function InterviewForm() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!jobDescription || (!file && !selfDescription)) {
      toast.error("Provide JD + Resume or Self Description");
      return;
    }

    if (file && file.type !== "application/pdf") {
      toast.error("Only PDF allowed");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      formData.append("selfDescription", selfDescription);

      const res = await api.post("/interview", formData);

      localStorage.setItem("report", JSON.stringify(res.data.interviewReport));
      toast.success("Report generated 🚀");
      navigate("/report");

    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1f2937] text-white p-6">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold">
          Create Your Custom{" "}
          <span className="text-pink-500">Interview Plan</span>
        </h1>
        <p className="text-gray-400 mt-2">
          Let AI analyze your profile and job requirements 🚀
        </p>
      </div>

      {/* Main Card */}
      <div className="grid md:grid-cols-2 gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl">

        {/* LEFT - JD */}
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Target Job Description
          </h2>

          <textarea
            placeholder="Paste job description..."
            className="w-full h-64 p-4 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">

          {/* Upload */}
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Upload Resume
            </h2>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-xl h-40 cursor-pointer hover:border-pink-500 transition">
              <p className="text-gray-400">
                {file ? file.name : "Click to upload PDF"}
              </p>
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* OR */}
          <div className="text-center text-gray-500">OR</div>

          {/* Self Description */}
          <textarea
            placeholder="Write about your skills..."
            className="w-full h-32 p-4 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setSelfDescription(e.target.value)}
          />

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-3 rounded-lg text-sm">
            Either Resume or Self Description is required
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 hover:scale-105 transition transform shadow-lg"
        >
          {loading ? "Generating..." : "✨ Generate My Interview Strategy"}
        </button>
      </div>
    </div>
  );
}