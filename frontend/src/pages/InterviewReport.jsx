import { useLocation } from "react-router-dom";
import ScoreCard from "../components/ScoreCard";
import QuestionCard from "../components/QuestionCard";

export default function InterviewReport() {


  const data =
    data || JSON.parse(localStorage.getItem("report"));

  if (!data) return <p>No data found</p>;
  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">

      <ScoreCard score={data.matchScore} />

      {/* Skill Gaps */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Skill Gaps</h2>
        {data.skillGaps.map((s, i) => (
          <p key={i}>
            {s.skill} - <span className="text-red-500">{s.severity}</span>
          </p>
        ))}
      </div>

      {/* Technical Questions */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Technical Questions</h2>
        {data.technicalQuestions.map((q, i) => (
          <QuestionCard key={i} {...q} />
        ))}
      </div>

      {/* Behavioral Questions */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Behavioral Questions</h2>
        {data.behavioralQuestions.map((q, i) => (
          <QuestionCard key={i} {...q} />
        ))}
      </div>

    </div>
  );
}