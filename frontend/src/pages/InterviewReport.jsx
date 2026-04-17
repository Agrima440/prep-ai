import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function InterviewReport() {
  const location = useLocation();
  const [tab, setTab] = useState("technical");

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) return <p>No data</p>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex">

      {/* LEFT */}
      <div className="w-64 bg-[#0F172A] p-5 border-r border-gray-800">
        <h2 className="text-gray-400 mb-4">SECTIONS</h2>

        {["technical", "behavioral", "roadmap"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`block w-full px-3 py-2 mb-2 rounded-lg 
              ${tab === item ? "bg-pink-600" : "hover:bg-gray-700"}`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CENTER */}
      <div className="flex-1 p-6">

        {/* SCORE */}
        <div className="bg-gradient-to-r from-green-900/40 to-green-600/20 border border-green-500 p-6 rounded-xl text-center mb-6 shadow-lg">
          <h2>Match Score</h2>
          <p className="text-4xl text-green-400">{data.matchScore}%</p>
        </div>

        {/* CONTENT */}
        {tab === "technical" &&
  data.technicalQuestions.map((q, i) => (
    <div
      key={i}
      className="bg-[#111827] border border-gray-700 rounded-xl mb-4 p-5 hover:border-pink-500 transition"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">
          <span className="bg-pink-600 text-xs px-2 py-1 rounded mr-2">
            Q{i + 1}
          </span>
          {q.question}
        </h3>
      </div>

      {/* INTENTION */}
      <div className="mt-4">
        <span className="text-xs bg-purple-700/30 text-purple-300 px-2 py-1 rounded">
          INTENTION
        </span>
        <p className="text-gray-400 mt-2 text-sm">
          {q.intention}
        </p>
      </div>

      {/* ANSWER */}
      <div className="mt-4">
        <span className="text-xs bg-green-700/30 text-green-300 px-2 py-1 rounded">
          MODEL ANSWER
        </span>
        <p className="text-gray-300 mt-2 text-sm leading-relaxed">
          {q.answer}
        </p>
      </div>
    </div>
))}

        {tab === "behavioral" &&
          data.behavioralQuestions.map((q, i) => (
            <div key={i} className="bg-[#111827] p-4 mb-4 rounded-lg border border-gray-700">
              <p className="text-blue-400 font-semibold">Q{i + 1}. {q.question}</p>
              <p className="text-gray-400 mt-2">{q.answer}</p>
            </div>
          ))}

        {tab === "roadmap" &&
          data.preparationPlan.map((day) => (
            <div key={day.day} className="border-l-2 border-pink-500 pl-4 mb-4">
              <h3 className="text-pink-400 font-bold">
                Day {day.day}: {day.focus}
              </h3>
              <ul className="ml-5 list-disc text-gray-400">
                {day.tasks.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      {/* RIGHT */}
      <div className="w-72 bg-[#0F172A] p-5 border-l border-gray-800">
<h2 className="text-gray-400 mb-4 uppercase text-sm tracking-wide">
  Skill Gaps
</h2>
        <div className="flex flex-wrap gap-2">
          {data.skillGaps.map((gap, i) => (
            <span
  className={`px-3 py-1 rounded-full text-xs font-medium border
  ${gap.severity === "high"
    ? "bg-red-500/20 text-red-400 border-red-500/30"
    : gap.severity === "medium"
    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    : "bg-green-500/20 text-green-400 border-green-500/30"
  }`}
>
              {gap.skill}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}