import { useLocation } from "react-router-dom";
import { useState } from "react";

export default function InterviewReport() {
  const location = useLocation();
  const [tab, setTab] = useState("technical");

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
        No data found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex font-sans">

      {/* LEFT SIDEBAR */}
      <div className="w-64 bg-[#0F172A] p-6 border-r border-gray-800">
        <h2 className="text-xs tracking-widest text-gray-500 mb-6">
          SECTIONS
        </h2>

        {["technical", "behavioral", "roadmap"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`w-full text-left px-4 py-2 rounded-xl mb-3 transition-all duration-200
              ${
                tab === item
                  ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* SCORE CARD */}
        <div className="bg-gradient-to-r from-green-900/40 to-green-600/20 border border-green-500 p-8 rounded-2xl text-center mb-8 shadow-lg">
          <h2 className="text-lg text-gray-300 mb-2">Match Score</h2>
          <p className="text-5xl font-bold text-green-400">
            {data.matchScore ?? 0}%
          </p>
        </div>

        {/* TECHNICAL */}
        {tab === "technical" && (
          <div className="space-y-5">
            {(data.technicalQuestions?.length
              ? data.technicalQuestions
              : [
                  {
                    question: "Explain closures in JavaScript",
                    answer:
                      "Closures allow access to outer scope variables even after function execution.",
                    intention: "Check JS fundamentals",
                  },
                ]
            ).map((q, i) => (
              <div
                key={i}
                className="bg-[#111827]/80 backdrop-blur-md p-5 rounded-xl border border-gray-700 hover:border-pink-500 transition"
              >
                <p className="text-pink-400 font-semibold">
                  Q{i + 1}. {q.question}
                </p>

                <p className="text-gray-300 mt-3 leading-relaxed">
                  {q.answer}
                </p>

                <p className="text-xs text-gray-500 mt-2 italic">
                  🎯 {q.intention}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* BEHAVIORAL */}
        {tab === "behavioral" && (
          <div className="space-y-5">
            {(data.behavioralQuestions?.length
              ? data.behavioralQuestions
              : [
                  {
                    question: "Tell me about yourself",
                    answer:
                      "Summarize your experience, skills, and goals briefly.",
                    intention: "Communication skills",
                  },
                ]
            ).map((q, i) => (
              <div
                key={i}
                className="bg-[#111827]/80 p-5 rounded-xl border border-gray-700 hover:border-blue-500 transition"
              >
                <p className="text-blue-400 font-semibold">
                  Q{i + 1}. {q.question}
                </p>

                <p className="text-gray-300 mt-3">{q.answer}</p>

                <p className="text-xs text-gray-500 mt-2 italic">
                  🎯 {q.intention}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ROADMAP */}
        {tab === "roadmap" && (
          <div className="space-y-8">
            {(data.preparationPlan?.length
              ? data.preparationPlan
              : [
                  {
                    day: 1,
                    focus: "JavaScript",
                    tasks: ["Closures", "Promises", "Async/Await"],
                  },
                ]
            ).map((day) => (
              <div
                key={day.day}
                className="relative pl-6 border-l-2 border-pink-500"
              >
                <span className="absolute -left-[10px] top-1 w-4 h-4 bg-pink-500 rounded-full"></span>

                <h3 className="text-lg font-bold text-pink-400">
                  Day {day.day}: {day.focus}
                </h3>

                <ul className="mt-3 space-y-1 text-gray-300">
                  {day.tasks.map((t, i) => (
                    <li key={i}>• {t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR (SKILL GAPS) */}
      <div className="w-72 bg-[#0F172A] p-6 border-l border-gray-800">
        <h2 className="text-sm text-gray-400 mb-5 tracking-wide">
          SKILL GAPS
        </h2>

        <div className="flex flex-wrap gap-3">
          {(data.skillGaps?.length
            ? data.skillGaps
            : [{ skill: "System Design", severity: "medium" }]
          ).map((gap, i) => (
            <span
              key={i}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border
                ${
                  gap.severity === "high"
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : gap.severity === "medium"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                    : "bg-green-500/10 text-green-400 border-green-500/30"
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