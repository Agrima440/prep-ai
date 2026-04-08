import { useLocation } from "react-router-dom";
import ScoreCard from "../components/ScoreCard";
import QuestionCard from "../components/QuestionCard";

export default function InterviewReport() {
  const { state } = useLocation();

  if (!state) return <p>No data found</p>;

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">

      <ScoreCard score={state.matchScore} />

      {/* Skill Gaps */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Skill Gaps</h2>
        {state.skillGaps.map((s, i) => (
          <p key={i}>
            {s.skill} - <span className="text-red-500">{s.severity}</span>
          </p>
        ))}
      </div>

      {/* Technical Questions */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Technical Questions</h2>
        {state.technicalQuestions.map((q, i) => (
          <QuestionCard key={i} {...q} />
        ))}
      </div>

      {/* Behavioral Questions */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold">Behavioral Questions</h2>
        {state.behavioralQuestions.map((q, i) => (
          <QuestionCard key={i} {...q} />
        ))}
      </div>

    </div>
  );
}