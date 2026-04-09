import { useLocation } from "react-router-dom";

export default function InterviewReport() {

  const location = useLocation(); // ✅ use variable explicitly

  const data =
    location.state ||
    JSON.parse(localStorage.getItem("report") || "null"); // ✅ safe parsing

  if (!data) {
    return <p>No data found</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Interview Report</h1>

      <p><strong>Match Score:</strong> {data.matchScore}</p>

      <h2 className="text-xl mt-4">Technical Questions</h2>
      {data.technicalQuestions?.map((q, i) => (
        <div key={i} className="border p-3 my-2 rounded">
          <p><strong>Q:</strong> {q.question}</p>
          <p><strong>A:</strong> {q.answer}</p>
        </div>
      ))}
    </div>
  );
}