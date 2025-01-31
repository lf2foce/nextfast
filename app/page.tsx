"use client";

import { useState } from "react";

interface Score {
    overall_band: number;
    task_response: number;
    coherence_and_cohesion: number;
    lexical_resource: number;
    grammatical_range_and_accuracy: number;
}

interface Feedback {
    task_response: string;
    coherence_and_cohesion: string;
    lexical_resource: string;
    grammatical_range_and_accuracy: string;
}

interface IELTSWritingEvaluation {
    word_count: number;
    score: Score;
    feedback: Feedback;
    suggestions: string[];
}

export default function Home() {
    const [essay, setEssay] = useState("");
    const [response, setResponse] = useState<IELTSWritingEvaluation | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setResponse(null);
        
        try {
            const res = await fetch("/api/py/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ essay_text: essay }),
            });
            
            if (!res.ok) {
                throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setResponse(data);
        } catch (error: unknown) {
            console.error("Error evaluating essay", error);
            let errorMessage = "An unknown error occurred.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setResponse({
                word_count: 0,
                score: {
                    overall_band: 0,
                    task_response: 0,
                    coherence_and_cohesion: 0,
                    lexical_resource: 0,
                    grammatical_range_and_accuracy: 0,
                },
                feedback: {
                    task_response: errorMessage,
                    coherence_and_cohesion: "",
                    lexical_resource: "",
                    grammatical_range_and_accuracy: "",
                },
                suggestions: [],
            });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold mb-6">IELTS Writing Examiner</h1>
            <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                <textarea
                    className="w-full p-4 border rounded bg-gray-700 text-white resize-none"
                    rows={6}
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
                    <p><strong>Word Count:</strong> {response.word_count}</p>
                    <p><strong>Overall Band:</strong> {response.score.overall_band}/9</p>
                    <h3 className="mt-4 text-lg font-semibold">Criteria Scores:</h3>
                    <ul>
                        <li><strong>Task Response:</strong> {response.score.task_response}/9</li>
                        <li><strong>Coherence and Cohesion:</strong> {response.score.coherence_and_cohesion}/9</li>
                        <li><strong>Lexical Resource:</strong> {response.score.lexical_resource}/9</li>
                        <li><strong>Grammar Accuracy:</strong> {response.score.grammatical_range_and_accuracy}/9</li>
                    </ul>
                    <h3 className="mt-4 text-lg font-semibold">Feedback:</h3>
                    <ul>
                        <li><strong>Task Response:</strong> {response.feedback.task_response}</li>
                        <li><strong>Coherence and Cohesion:</strong> {response.feedback.coherence_and_cohesion}</li>
                        <li><strong>Lexical Resource:</strong> {response.feedback.lexical_resource}</li>
                        <li><strong>Grammar Accuracy:</strong> {response.feedback.grammatical_range_and_accuracy}</li>
                    </ul>
                    <h3 className="mt-4 text-lg font-semibold">Suggestions:</h3>
                    <ul>
                        {response.suggestions.length > 0 ? response.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        )) : <li>No suggestions provided.</li>}
                    </ul>
                </div>
            )}
        </div>
    );
}
