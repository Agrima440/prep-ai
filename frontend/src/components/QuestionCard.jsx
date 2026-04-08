export default function QuestionCard({ question, answer }) {
  return (
    <div className="border p-3 rounded mb-3">
      <p className="font-semibold">{question}</p>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}