"use client";

import { useState } from "react";

export default function Home() {
    const [essay, setEssay] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/py/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ essay }),
            });
            const data = await res.json();
            setResponse(data);
        } catch (error) {
            console.error("Error evaluating essay", error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold mb-6">IELTS Writing Examiner</h1>
            <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                <textarea
                    className="w-full p-4 border rounded bg-gray-700 text-white resize-none"
                    rows="6"
                    placeholder="Enter your essay here..."
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                />
                <button
                    className="mt-4 w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Evaluating..." : "Submit Essay"}
                </button>
            </div>
            {response && (
                <div className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Results:</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(response.scores || {}).map(([criteria, score]) => (
                            <p key={criteria} className="text-lg">
                                <strong className="capitalize">{criteria.replace("_", " ")}</strong>: {score}/9
                            </p>
                        ))}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Feedback:</h3>
                    <ul className="list-disc pl-6">
                        {Object.entries(response.feedback || {}).map(([criteria, feedback]) => (
                            <li key={criteria} className="mt-2">
                                <strong className="capitalize">{criteria.replace("_", " ")}</strong>: {feedback}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
