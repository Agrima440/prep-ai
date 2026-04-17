import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function InterviewReport() {
  const location = useLocation();
  const [tab, setTab] = useState("technical");

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) return <p className="text-center mt-10">No data found</p>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">

      {/* LEFT NAV */}
      <div className="w-60 bg-[#111827] p-5 border-r border-gray-800">
        <h2 className="text-gray-400 text-sm mb-4">SECTIONS</h2>

        {["technical", "behavioral", "roadmap"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`block w-full text-left px-3 py-2 rounded-lg mb-2 
              ${tab === item ? "bg-pink-600 text-white" : "text-gray-400 hover:bg-gray-700"}`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">

        {/* SCORE */}
        <div className="bg-green-600/20 border border-green-500 p-6 rounded-xl text-center mb-6">
          <h2 className="text-xl">Match Score</h2>
          <p className="text-4xl font-bold text-green-400">
            {data.matchScore ?? 0}%
          </p>
        </div>

        {/* CONTENT */}
        {tab === "technical" && (
          <div className="space-y-4">
            {data.technicalQuestions.map((q, i) => (
              <div key={i} className="bg-[#111827] p-4 rounded-lg border border-gray-700">
                <p className="text-pink-400 font-semibold">Q{i + 1}. {q.question}</p>
                <p className="text-gray-400 mt-2">{q.answer}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "behavioral" && (
          <div className="space-y-4">
            {data.behavioralQuestions.map((q, i) => (
              <div key={i} className="bg-[#111827] p-4 rounded-lg border border-gray-700">
                <p className="text-blue-400 font-semibold">Q{i + 1}. {q.question}</p>
                <p className="text-gray-400 mt-2">{q.answer}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "roadmap" && (
          <div className="space-y-6">
            {data.preparationPlan.map((day) => (
              <div key={day.day} className="border-l-2 border-pink-500 pl-4">
                <h3 className="text-lg font-bold text-pink-400">
                  Day {day.day}: {day.focus}
                </h3>
                <ul className="list-disc ml-5 mt-2 text-gray-400">
                  {day.tasks.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-64 bg-[#111827] p-5 border-l border-gray-800">
        <h2 className="text-gray-400 mb-4">Skill Gaps</h2>

        <div className="flex flex-wrap gap-2">
          {data.skillGaps.map((gap, i) => (
            <span
              key={i}
              className={`px-3 py-1 rounded-full text-sm 
                ${gap.severity === "high" ? "bg-red-500/20 text-red-400" :
                  gap.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-green-500/20 text-green-400"}`}
            >
              {gap.skill}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}