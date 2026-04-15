import { useLocation } from "react-router-dom";

export default function InterviewReport() {
  const location = useLocation();

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null");

  if (!data) return <p className="text-center mt-10">No data found</p>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6">

      <h1 className="text-3xl font-bold mb-6 text-center">
        Interview Report
      </h1>

      {/* SCORE */}
      <div className="bg-green-600/20 border border-green-500 p-6 rounded-xl text-center mb-6">
        <h2 className="text-xl">Match Score</h2>
        <p className="text-4xl font-bold text-green-400">
          {data.matchScore}%
        </p>
      </div>

      {/* QUESTIONS */}
      <div className="space-y-4">
        {data.technicalQuestions?.map((q, i) => (
          <div
            key={i}
            className="bg-[#111827] border border-gray-700 p-4 rounded-lg"
          >
            <p className="font-semibold text-pink-400">
              Q: {q.question}
            </p>
            <p className="text-gray-300 mt-2">
              A: {q.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}