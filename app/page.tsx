"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
    topic: string;
    score: Score;
    feedback: Feedback;
    suggestions: string[];
    original_essay: string;
    error?: string; //check error
}
export const maxDuration = 300

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
        }

        setLoading(false);
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    };
    
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { "image/*": [] } });

    const exportToPDF = async () => {
      if (!response) return;
      
      const pdf = new jsPDF("p", "mm", "a4");
      
      // Capture the main evaluation section
      const resultElement = document.getElementById("result-section");
      if (resultElement) {
          const canvas = await html2canvas(resultElement, { scale: 2, ignoreElements: (el) => el.tagName === "BUTTON" });
          const imgData = canvas.toDataURL("image/png");
          pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      }
      
      // Add a new page for the original essay
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("Original Essay:", 10, 20);
      pdf.setFontSize(12);
      const splitEssay = pdf.splitTextToSize(response.original_essay, 180);
      pdf.text(splitEssay, 10, 30);
      
      pdf.save("IELTS_Evaluation.pdf");
  };


    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold">IELTS Writing Examiner</h1>

<div className="flex w-full max-w-2xl bg-gray-800 p-2 rounded-lg">
    <button 
        className={`w-1/2 p-3 rounded-md transition-all ${activeTab === "text" ? "bg-white text-black shadow-lg" : "bg-transparent text-gray-400"}`} 
        onClick={() => setActiveTab("text")}
    >
        Text Input
    </button>
    <button 
        className={`w-1/2 p-3 rounded-md transition-all ${activeTab === "image" ? "bg-white text-black shadow-lg" : "bg-transparent text-gray-400"}`} 
        onClick={() => setActiveTab("image")}
    >
        Upload Image
    </button>
</div>

<div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg space-y-6 mt-4">
    {activeTab === "text" ? (
        <textarea
            className="w-full p-4 border rounded bg-gray-700 text-white resize-none"
            rows={10}
            placeholder="Enter your essay here..."
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
        />
    ) : (
        <div {...getRootProps()} className="border-dashed border-2 border-gray-500 p-6 rounded-lg cursor-pointer text-center bg-gray-800">
                        <input {...getInputProps()} className="hidden" />
                        {file ? (
                            <img 
                                src={URL.createObjectURL(file)} 
                                alt="Uploaded preview" 
                                className="max-w-full h-auto rounded-md mt-4"
                            />
                        ) : (
                            <p>Drop an image or click to upload an essay</p>
                        )}
                    </div>
    )}
</div>

<button
    className="w-full max-w-2xl p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md mt-4"
    onClick={handleSubmit}
    disabled={loading}
>
    {loading ? "Evaluating..." : "Submit Essay"}
</button>


            {response && (
                <div id="result-section" className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Results:</h2>
                    {response.error ? (
                        <p className="text-red-500">{response.error}</p>
                    ) : (
                        <>
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
                            <h3 className="mt-4 text-lg font-semibold">Original Essay:</h3>
                            <p className="bg-gray-700 p-3 rounded-lg whitespace-pre-wrap">{response.original_essay}</p>
                            <button className="mt-4 w-full p-3 bg-green-400 hover:bg-green-500 text-white rounded-lg font-semibold" onClick={exportToPDF}>
                                Export to PDF
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
