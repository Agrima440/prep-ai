import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function InterviewForm() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  const navigate = useNavigate();

  // ✅ FETCH REPORTS
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/interview");
      setReports(res.data.interviewReports || []);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  // ✅ GENERATE REPORT
  const handleSubmit = async () => {
    if (!jobDescription || (!file && !selfDescription)) {
      toast.error("Provide JD + Resume or Self Description");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      if (file) formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      formData.append("selfDescription", selfDescription);

      const res = await api.post("/interview", formData);

      const report = res.data.interviewReport;

      localStorage.setItem("report", JSON.stringify(report));

      toast.success("Report generated 🚀");

      await fetchReports();

      navigate("/report", { state: report });
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPEN REPORT
  const openReport = (report) => {
    localStorage.setItem("report", JSON.stringify(report));
    navigate("/report", { state: report });
  };

  // ✅ LOGOUT
  const logout = async () => {
    await api.post("/auth/logout");
    toast.success("Logged out 👋");
    navigate("/login");
  };

  // ✅ DELETE SINGLE
  const deleteReport = async (id) => {
    if (!confirm("Delete this report?")) return;

    try {
      await api.delete(`/interview/${id}`);
      toast.success("Deleted successfully 🗑️");
      fetchReports();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ✅ DELETE ALL
  const deleteAll = async () => {
    if (!confirm("Delete ALL reports?")) return;

    try {
      await api.delete("/interview/all");
      toast.success("All reports deleted 🧹");
      fetchReports();
    } catch {
      toast.error("Delete all failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center p-6">

      {/* 🔝 LOGOUT BUTTON */}
      <div className="w-full flex justify-end mb-4">
        <button
          onClick={logout}
          className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* HEADER */}
      <div className="text-center max-w-2xl mb-10">
        <h1 className="text-4xl font-bold">
          Create Your Custom{" "}
          <span className="text-pink-500">Interview Plan</span>
        </h1>
        <p className="text-gray-400 mt-3">
          Let AI analyze your profile and generate a winning strategy.
        </p>
      </div>

      {/* FORM */}
      <div className="w-full max-w-5xl bg-[#111827] border border-gray-700 rounded-2xl p-6 grid md:grid-cols-2 gap-6 shadow-xl">

        {/* LEFT */}
        <div className="flex flex-col">
          <h2 className="font-semibold mb-2">Target Job Description</h2>

          <textarea
            placeholder="Paste job description..."
            className="flex-1 h-64 p-4 rounded-lg bg-[#0B0F19] border border-gray-700"
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">

          <label className="flex items-center justify-center h-40 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer">
            <p className="text-gray-400 text-sm">
              {file ? file.name : "Click to upload PDF"}
            </p>
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <div className="text-center text-gray-500 text-sm">OR</div>

          <textarea
            placeholder="Describe your experience..."
            className="h-32 p-4 rounded-lg bg-[#0B0F19] border border-gray-700"
            onChange={(e) => setSelfDescription(e.target.value)}
          />
        </div>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={handleSubmit}
        className="mt-8 px-8 py-3 rounded-xl bg-pink-500 hover:scale-105 transition"
      >
        {loading ? "Generating..." : "✨ Generate My Interview Strategy"}
      </button>

      {/* REPORTS */}
      <div className="w-full max-w-5xl mt-12">

        {/* HEADER + DELETE ALL */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            My Recent Interview Plans
          </h2>

          {reports.length > 0 && (
            <button
              onClick={deleteAll}
              className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Delete All
            </button>
          )}
        </div>

        {reports.length === 0 ? (
          <p className="text-gray-400">No reports yet</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {reports.map((r, i) => (
              <div
                key={i}
                className="relative bg-[#111827] border border-gray-700 rounded-xl p-5 hover:border-pink-500 transition"
              >
                {/* ❌ DELETE BUTTON */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteReport(r._id);
                  }}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                >
                  ❌
                </button>

                {/* CLICK AREA */}
                <div onClick={() => openReport(r)} className="cursor-pointer">
                  <h3 className="text-lg font-semibold mb-2">
                    {r.title || "Untitled Role"}
                  </h3>

                  <p className="text-gray-400 text-sm">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>

                  <p className="text-pink-500 mt-2 font-medium">
                    Match Score: {r.matchScore}%
                  </p>

                  <p className="text-green-400 text-xs mt-1">
                    Strong match for this role
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}