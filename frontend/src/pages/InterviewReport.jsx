import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function InterviewReport() {
  const location = useLocation();
  const [tab, setTab] = useState("roadmap");

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) return <p>No data</p>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">

      {/* LEFT */}
      <div className="w-64 bg-[#0F172A] p-6 border-r border-gray-800">
        <h2 className="text-gray-500 text-sm mb-6">SECTIONS</h2>

        {["technical", "behavioral", "roadmap"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`block w-full text-left px-4 py-2 rounded-lg mb-3
              ${tab === item ? "bg-pink-600 text-white" : "text-gray-400 hover:bg-gray-800"}`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CENTER */}
      <div className="flex-1 p-8">

        {tab === "roadmap" && (
          <>
            <h1 className="text-2xl font-bold mb-6">
              Preparation Road Map
            </h1>

            <div className="space-y-10">
              {data.preparationPlan.map((day) => (
                <div key={day.day} className="relative pl-8 border-l-2 border-pink-500">

                  <span className="absolute -left-2 top-2 w-4 h-4 bg-pink-500 rounded-full"></span>

                  <h3 className="text-lg font-semibold text-white">
                    Day {day.day}: {day.focus}
                  </h3>

                  <ul className="text-gray-400 mt-2 space-y-1">
                    {day.tasks.map((task, i) => (
                      <li key={i}>• {task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "technical" && (
          <div className="space-y-5">
            {data.technicalQuestions.map((q, i) => (
              <div key={i} className="bg-[#111827] p-5 rounded-xl border border-gray-700">
                <p className="text-pink-400 font-semibold">{q.question}</p>
                <p className="text-gray-400 mt-2">{q.answer}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "behavioral" && (
          <div className="space-y-5">
            {data.behavioralQuestions.map((q, i) => (
              <div key={i} className="bg-[#111827] p-5 rounded-xl border border-gray-700">
                <p className="text-blue-400 font-semibold">{q.question}</p>
                <p className="text-gray-400 mt-2">{q.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-72 bg-[#0F172A] p-6 border-l border-gray-800">

        {/* SCORE */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-green-500 flex items-center justify-center text-3xl font-bold text-green-400">
            {data.matchScore}%
          </div>
          <p className="text-green-400 mt-2 text-sm">
            Strong match for this role
          </p>
        </div>

        {/* SKILL GAPS */}
        <h3 className="text-gray-400 mb-4">SKILL GAPS</h3>

        <div className="space-y-3">
          {data.skillGaps.map((gap, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-lg text-sm
                ${gap.severity === "high" ? "bg-red-500/20 text-red-400" :
                  gap.severity === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-green-500/20 text-green-400"}`}
            >
              {gap.skill}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}