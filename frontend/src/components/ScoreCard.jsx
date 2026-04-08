export default function ScoreCard({ score }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <h2 className="text-lg font-bold">Match Score</h2>
      <p className="text-4xl text-green-600">{score}%</p>
    </div>
  );
}