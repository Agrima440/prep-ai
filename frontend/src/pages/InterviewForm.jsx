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
    if (!file || !jobDescription) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      formData.append("selfDescription", selfDescription);

      const res = await api.post("/interview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Report generated 🚀");

      // 👉 send data to next page
localStorage.setItem("report", JSON.stringify(res.data.interviewReport));

navigate("/report");
    } catch (err) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Interview Report</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />

      <textarea
        placeholder="Job Description"
        className="w-full border p-2 mb-3"
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <textarea
        placeholder="Self Description"
        className="w-full border p-2 mb-3"
        onChange={(e) => setSelfDescription(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate Report"}
      </button>
    </div>
  );
}