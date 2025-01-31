"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";

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
    score: Score;
    feedback: Feedback;
    suggestions: string[];
}

export default function Home() {
    const [activeTab, setActiveTab] = useState("text");
    const [essay, setEssay] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [response, setResponse] = useState<IELTSWritingEvaluation | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        setResponse(null);
        
        try {
            const formData = new FormData();
            if (activeTab === "text" && essay) {
                formData.append("essay_text", essay);
            } else if (activeTab === "image" && file) {
                formData.append("file", file);
            } else {
                throw new Error("Please provide either text or an image.");
            }

            const res = await fetch("/api/py/evaluate", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorResponse = await res.json();
                throw new Error(`Server error: ${res.status} ${errorResponse.detail || res.statusText}`);
            }

            const data = await res.json();
            setResponse(data);
        } catch (error: unknown) {
            console.error("Error evaluating essay", error);
            let errorMessage = "An unknown error occurred.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setResponse({ error: errorMessage } as IELTSWritingEvaluation);
        }

        setLoading(false);
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };
    
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold mb-6">IELTS Writing Examiner</h1>
            
            <div className="flex space-x-4 mb-6">
                <button className={`p-3 rounded ${activeTab === "text" ? "bg-blue-500" : "bg-gray-700"}`} onClick={() => setActiveTab("text")}>
                    Text Input
                </button>
                <button className={`p-3 rounded ${activeTab === "image" ? "bg-blue-500" : "bg-gray-700"}`} onClick={() => setActiveTab("image")}>
                    Upload Image
                </button>
            </div>

            {activeTab === "text" ? (
                <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <textarea
                        className="w-full p-4 border rounded bg-gray-700 text-white resize-none"
                        rows={10}
                        placeholder="Enter your essay here..."
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                    />
                </div>
            ) : (
                <div {...getRootProps()} className="border-dashed border-2 border-gray-500 p-6 rounded-lg cursor-pointer text-center bg-gray-800 mb-4">
                    <input {...getInputProps()} />
                    {file ? <p>{file.name}</p> : <p>Drop an image or click to upload an essay</p>}
                </div>
            )}
            
            <button
                className="mt-4 w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Evaluating..." : "Submit Essay"}
            </button>

            {response && (
                <div className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Results:</h2>
                    {response.error ? (
                        <p className="text-red-500">{response.error}</p>
                    ) : (
                        <div>
                            <p className="text-lg font-bold text-green-400">Overall Band: {response.score.overall_band}/9</p>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Task Response:</strong> {response.score.task_response}/9</p>
                                <p><strong>Coherence Cohesion:</strong> {response.score.coherence_and_cohesion}/9</p>
                                <p><strong>Lexical Resource:</strong> {response.score.lexical_resource}/9</p>
                                <p><strong>Grammar Accuracy:</strong> {response.score.grammatical_range_and_accuracy}/9</p>
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">Feedback:</h3>
                            <ul className="list-disc pl-5">
                                <li><strong>Task Response:</strong> {response.feedback.task_response}</li>
                                <li><strong>Coherence Cohesion:</strong> {response.feedback.coherence_and_cohesion}</li>
                                <li><strong>Lexical Resource:</strong> {response.feedback.lexical_resource}</li>
                                <li><strong>Grammar Accuracy:</strong> {response.feedback.grammatical_range_and_accuracy}</li>
                            </ul>
                            <h3 className="mt-4 text-lg font-semibold">Areas for Improvement:</h3>
                            <ul className="list-disc pl-5">
                                {response.suggestions.map((suggestion, index) => (
                                    <li key={index}>{suggestion}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
