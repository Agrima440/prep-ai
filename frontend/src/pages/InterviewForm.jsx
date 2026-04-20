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

  // ✅ FETCH ALL REPORTS
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get("/interview");
      console.log("FETCHED REPORTS:", res.data.interviewReports);
      setReports(res.data.interviewReports || []);
      console.log("REPORTS SET IN STATE:", res.data.interviewReports);
    } catch (err) {
console.log("ERROR FETCHING REPORTS:", err.response?.data || err.message);    }
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

      await fetchReports(); // ✅ refresh recent list

      navigate("/report");
    } catch (err) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  // ✅ OPEN REPORT
  const openReport = (report) => {
    localStorage.setItem("report", JSON.stringify(report));
navigate("/report", { state: report });  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center p-6">

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
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">Target Job Description</h2>
            <span className="text-xs bg-pink-600 px-2 py-1 rounded">REQUIRED</span>
          </div>

          <textarea
            placeholder="Paste job description..."
            className="flex-1 h-64 p-4 rounded-lg bg-[#0B0F19] border border-gray-700 focus:ring-2 focus:ring-pink-500 outline-none"
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-4">

          {/* UPLOAD */}
          <div>
            <div className="flex justify-between mb-2">
              <h2 className="font-semibold">Upload Resume</h2>
              <span className="text-xs bg-green-600 px-2 py-1 rounded">
                BEST
              </span>
            </div>

            <label className="flex items-center justify-center h-40 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-pink-500">
              <p className="text-gray-400 text-sm">
                {file ? file.name : "Click to upload PDF"}
              </p>
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
          </div>

          <div className="text-center text-gray-500 text-sm">OR</div>

          {/* SELF DESC */}
          <textarea
            placeholder="Describe your experience..."
            className="h-32 p-4 rounded-lg bg-[#0B0F19] border border-gray-700 focus:ring-2 focus:ring-pink-500"
            onChange={(e) => setSelfDescription(e.target.value)}
          />

          <div className="bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm p-3 rounded-lg">
            Either Resume or Self Description is required
          </div>
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 hover:scale-105 transition shadow-lg"
      >
        {loading ? "Generating..." : "✨ Generate My Interview Strategy"}
      </button>

      {/* RECENT REPORTS */}
      <div className="w-full max-w-5xl mt-12">
        <h2 className="text-2xl font-bold mb-6">
          My Recent Interview Plans
        </h2>

        {reports.length === 0 ? (
          <p className="text-gray-400">No reports yet</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {reports.map((r, i) => (
              <div
                key={i}
                onClick={() => openReport(r)}
                className="bg-[#111827] border border-gray-700 rounded-xl p-5 cursor-pointer hover:border-pink-500 hover:scale-[1.02] transition"
              >
                <h3 className="text-lg font-semibold mb-2">
                  {r.title || "Untitled Role"}
                </h3>

                <p className="text-gray-400 text-sm">
                  Generated on{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>

                <p className="text-pink-500 mt-2 font-medium">
                  Match Score: {r.matchScore}%
                </p>

                <p className="text-green-400 text-xs mt-1">
                  Strong match for this role
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}