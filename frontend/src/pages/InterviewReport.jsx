import { useLocation } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";

export default function InterviewReport() {
  const location = useLocation();
  const [tab, setTab] = useState("technical");
  const [openIndex, setOpenIndex] = useState(null);

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) return <p>No data</p>;

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  const downloadResume = async () => {
    try {
      const res = await api.get(`/interview/resume/pdf/${data._id}`, {
        responseType: "blob"
      });

      const contentType = res.headers["content-type"] || "";
      if (!contentType.includes("application/pdf")) {
        throw new Error("Invalid file type");
      }

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("Resume download failed:", err);
      alert("Download failed");
    }
  };

  const QuestionCard = ({ q, i }) => (
    <div className="bg-[#111827] border border-gray-700 rounded-xl mb-4">
      <div
        onClick={() => toggle(i)}
        className="cursor-pointer p-4 flex justify-between items-center"
      >
        <h3 className="font-semibold">
          <span className="bg-pink-600 text-xs px-2 py-1 rounded mr-2">
            Q{i + 1}
          </span>
          {q.question}
        </h3>

        <span>{openIndex === i ? "▲" : "▼"}</span>
      </div>

      {openIndex === i && (
        <div className="px-4 pb-4">
          <div className="mt-3">
            <span className="text-xs bg-purple-700/30 px-2 py-1 rounded">
              INTENTION
            </span>
            <p className="text-gray-400 mt-2">{q.intention}</p>
          </div>

          <div className="mt-3">
            <span className="text-xs bg-green-700/30 px-2 py-1 rounded">
              MODEL ANSWER
            </span>
            <p className="text-gray-300 mt-2">{q.answer}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">

      {/* LEFT */}
      <div className="w-64 bg-[#0F172A] p-5 border-r border-gray-800 flex flex-col">
        <h2 className="text-gray-400 mb-4">SECTIONS</h2>

        {["technical", "behavioral", "roadmap"].map((item) => (
          <button
            key={item}
            onClick={() => {
              setTab(item);
              setOpenIndex(null);
            }}
            className={`block w-full px-3 py-2 mb-2 rounded-lg 
              ${tab === item ? "bg-pink-600" : "hover:bg-gray-700"}`}
          >
            {item.toUpperCase()}
          </button>
        ))}
<div className="mt-auto pt-10">
   <button
  onClick={downloadResume}
  className="w-full bg-pink-600 py-3 rounded-xl"
>
  ✨ Download Resume
</button>
</div>
      </div>

      {/* CENTER */}
      <div className="flex-1 p-6">

        <h1 className="text-center text-3xl font-bold mb-6">
          {tab === "technical" && "Technical Questions"}
          {tab === "behavioral" && "Behavioral Questions"}
          {tab === "roadmap" && "Preparation Roadmap"}
        </h1>

        {/* TECH */}
        {tab === "technical" &&
          (data.technicalQuestions || []).map((q, i) => (
            <QuestionCard key={i} q={q} i={i} />
          ))}

        {/* BEHAVIORAL */}
        {tab === "behavioral" &&
          (data.behavioralQuestions || []).map((q, i) => (
            <QuestionCard key={i} q={q} i={i} />
          ))}

        {/* ROADMAP */}
        {tab === "roadmap" &&
          (data.preparationPlan || []).map((day) => (
            <div
              key={day.day}
              className="bg-[#111827] border border-gray-700 rounded-xl p-4 mb-4"
            >
              <h3 className="text-pink-400 font-semibold mb-2">
                Day {day.day}: {day.focus}
              </h3>

              <ul className="ml-5 list-disc text-gray-400">
                {(day.tasks || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {/* RIGHT */}
      <div className="w-72 bg-[#0F172A] p-5 border-l border-gray-800">

        {/* SCORE */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-green-500 flex items-center justify-center text-2xl font-bold text-green-400">
            {data.matchScore}%
          </div>
          <p className="text-green-400 mt-2 text-sm">
            Strong match for this role
          </p>
        </div>

        {/* SKILLS */}
        <h2 className="text-gray-400 mb-3">SKILL GAPS</h2>

        <div className="flex flex-col gap-2">
          {(data.skillGaps || []).map((gap, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-md text-sm border
                ${gap.severity === "high"
                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                  : gap.severity === "medium"
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
                }`}
            >
              {gap.skill}
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}