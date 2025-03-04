"use client";

import { useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";

// import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";
import Image from "next/image"; // ✅ Import Next.js Image component
import heicConvert from 'heic-convert';

// export const maxDuration = 60




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

export default function Home() {
    const [activeTab, setActiveTab] = useState("text");
    const [essay, setEssay] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    // const [response, setResponse] = useState<IELTSWritingEvaluation | null>(null);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState(""); //email
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [eloading, seteLoading] = useState(false);

    const [assessment, setAssessment] = useState<{ [key: string]: IELTSWritingEvaluation | null }>({
        text: null,
        image: null,
        "multi-image": null,
    });
    

    const handleSubmit = async () => {

        setLoading(true);
        // setResponse(null);
        setAssessment((prev) => ({ ...prev, [activeTab]: null }));

        
        try {
            const formData = new FormData();

            

        if (activeTab === "text" && essay) {
            formData.append("essay_text", essay);
        } else if (activeTab === "image" && file) {
            formData.append("file", file);
        } else if (activeTab === "multi-image" && files.length > 0) {

            
                // alert(`Number of files: ${files.length}`);
                
            files.forEach((file) => {
                formData.append("files", file); // ✅ Ensure the key matches FastAPI expected "files"
            });
        } else {
            throw new Error("Please provide either text or an image.");
        }

        const endpoint = activeTab === "multi-image" 
            ? "/api/py/evaluate-multi" 
            : "/api/py/evaluate";
        
        const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorResponse = await res.json();
            throw new Error(`Server error: ${res.status} ${errorResponse.detail || res.statusText}`);
        }

        const data = await res.json();
        // setResponse(data);
        setAssessment((prev) => ({ ...prev, [activeTab]: data })); // ✅ Store response per tab

        //email here
        // 🔹 Call the new API to send an email
        // 🔹 Send email ONLY if data exists
        // if (data && data.score) {
        //     const emailRes = await fetch("/api/send", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({
        //             recipient: "mr.anhbt@gmail.com",
        //             subject: "Your IELTS Essay Evaluation",
        //             content: `
        //                 <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        //                     <h2 style="text-align: center; color: #007bff;">IELTS Essay Evaluation</h2>
                            
        //                     <p>Dear Candidate,</p>
        //                     <p>Thank you for submitting your essay. Below is your evaluation report.</p>

        //                     <h3 style="background-color: #007bff; color: #fff; padding: 8px; border-radius: 4px;">Evaluation Summary</h3>
        //                     <ul style="list-style: none; padding: 0;">
        //                         <li><strong>Overall Band:</strong> ${data.score.overall_band}/9</li>
        //                         <li><strong>Task Response:</strong> ${data.score.task_response}/9</li>
        //                         <li><strong>Coherence & Cohesion:</strong> ${data.score.coherence_and_cohesion}/9</li>
        //                         <li><strong>Lexical Resource:</strong> ${data.score.lexical_resource}/9</li>
        //                         <li><strong>Grammar Accuracy:</strong> ${data.score.grammatical_range_and_accuracy}/9</li>
        //                     </ul>

        //                     <h3 style="background-color: #28a745; color: #fff; padding: 8px; border-radius: 4px;">Feedback & Suggestions</h3>
        //                     <ul style="list-style: none; padding: 0;">
        //                         <li><strong>Task Response:</strong> ${data.feedback.task_response}</li>
        //                         <li><strong>Coherence & Cohesion:</strong> ${data.feedback.coherence_and_cohesion}</li>
        //                         <li><strong>Lexical Resource:</strong> ${data.feedback.lexical_resource}</li>
        //                         <li><strong>Grammar Accuracy:</strong> ${data.feedback.grammatical_range_and_accuracy}</li>
        //                     </ul>

        //                     <h3 style="background-color: #6c757d; color: #fff; padding: 8px; border-radius: 4px;">Your Essay</h3>
        //                     <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">
        //                         <p>${data.original_essay.replace(/\n/g, "<br/>")}</p>
        //                     </div>

        //                     <p style="text-align: center; margin-top: 20px;">
        //                         <a href="https://nextwriting.vercel.app/" style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px;">Create account to View Full Report</a>
        //                     </p>

        //                     <p>Best regards, <br/> IELTS Evaluation Team</p>
        //                 </div>
        //             `,
        //         }),
        //     });

        //     const emailResponse = await emailRes.json();
        //     if (!emailResponse.success) {
        //         throw new Error(`Email failed: ${emailResponse.error}`);
        //     }

            // console.log("Success email sent!");
        // }
        // 🔹 Send email on success
        
        } catch (error) {
            console.error("Error evaluating essay", error);
        }

        setLoading(false);
    };

    // const convertHEICtoJPG = async (file: File) => {
    //     if (file.type === "image/heic" || file.name.endsWith(".heic")) {
    //         const buffer = await file.arrayBuffer();
    //         const outputBuffer = await heicConvert({
    //             buffer,
    //             format: 'JPEG',
    //             quality: 0.8,
    //         });
    //         return new File([outputBuffer], file.name.replace(".heic", ".jpg"), { type: "image/jpeg" });
    //     }
    //     return file;
    // };

    const onDropRejected = (fileRejections: FileRejection[]) => {
        const oversizedFiles = fileRejections.map(({ file }) => `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        
        alert(`These files are too large (Max ${MAX_FILE_SIZE_MB}MB each):\n${oversizedFiles.join("\n")}`);
    };

    const MAX_FILE_SIZE_MB = 5; // Max 5MB per file
    const MAX_TOTAL_SIZE_MB = 20; // Max 20MB total upload

    const compressImage = async (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (event) => {
                const imgSrc = event.target?.result as string;
    
                const img = document.createElement("img");
                img.src = imgSrc;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
    
                    const scaleFactor = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scaleFactor;
    
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: "image/jpeg" }));
                        } else {
                            resolve(file); // Fallback: return original file
                        }
                    }, "image/jpeg", quality);
                };
            };
        });
    };
    

    const convertHEICtoJPG = async (file: File) => {
        if (file.type === "image/heic" || file.name.endsWith(".heic")) {
            const buffer = await file.arrayBuffer();
            const outputBuffer = await heicConvert({
                buffer,
                format: "JPEG",
                quality: 0.8,
            });
            return new File([outputBuffer], file.name.replace(".heic", ".jpg"), {
                type: "image/jpeg",
            });
        }
        return file;
    };

    const processImages = async (acceptedFiles: File[]): Promise<File[]> => {
        return await Promise.all(
            acceptedFiles.map(async (file) => {
                if (file.type === "image/heic" || file.name.endsWith(".heic")) {
                    console.log(`Converting HEIC file: ${file.name}`); // Debugging
                    return await convertHEICtoJPG(file); // ✅ Convert HEIC to JPG
                } else {
                    return await compressImage(file); // ✅ Compress JPG/PNG
                }
            })
        );
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: async (acceptedFiles) => {
            if (activeTab === "image") {
                // setFile(acceptedFiles[0]);
                const processedFile = await processImages([acceptedFiles[0]]);
                setFile(processedFile[0]);
            } else if (activeTab === "multi-image") {
                
                let totalSize = 0;
                const processedFiles = await processImages(acceptedFiles);
                const validFiles: File[] = [];

                processedFiles.forEach((file) => {
                    const fileSizeMB = file.size / (1024 * 1024);
                    totalSize += fileSizeMB;

                    if (fileSizeMB <= MAX_FILE_SIZE_MB) {
                        validFiles.push(file);
                    }
                });

                // Show total size warning
                if (totalSize > MAX_TOTAL_SIZE_MB) {
                    alert(`Total upload size exceeds ${MAX_TOTAL_SIZE_MB}MB! Current: ${totalSize.toFixed(2)}MB`);
                    return;
                }
                // setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
                setFiles((prevFiles) => [...prevFiles, ...validFiles]);
            }
        },
        onDropRejected, // 🔹 Now detects oversized files
        accept: { "image/*": [] },
        // accept: { "image/jpeg": [], "image/png": [] }, // 🔹 Prevents HEIC selection
        multiple: true,
    });

    // Handle rejected files due to size
 

    const removeFile = (index: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    // const exportToPDF = async () => {
    //     if (!response) return;
    
    //     const pdf = new jsPDF("p", "mm", "a4");
    
    //     // 🔹 Step 1: Capture the Evaluation Section
    //     const evaluationElement = document.getElementById("evaluation-section");
    //     if (evaluationElement) {
    //         const exportButton = document.getElementById("export-button");
    //         if (exportButton) exportButton.style.display = "none"; // Hide button
    
    //         const canvas = await html2canvas(evaluationElement, { scale: 2, ignoreElements: (el) => el.tagName === "BUTTON" });
    //         const imgData = canvas.toDataURL("image/png");
    //         pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    
    //         if (exportButton) exportButton.style.display = "block"; // Restore button
    //     }
    
    //     // 🔹 Step 2: Capture Topic & Essay Section (Keep Web UI Styling)
    //     const topicEssayElement = document.getElementById("topic-essay-section");
    //     if (topicEssayElement) {
    //         pdf.addPage(); // Ensure it's on a new page
    
    //         const canvas = await html2canvas(topicEssayElement, { scale: 2, ignoreElements: (el) => el.tagName === "BUTTON" });
    //         const imgData = canvas.toDataURL("image/png");
    //         pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    //     }
    
    //     pdf.save("IELTS_Evaluation.pdf");
    // };

    const handleSendEmail = async () => {
        if (!email || !assessment[activeTab]) return;
        
        seteLoading(true);
    
        try {
            const res = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipient: email,
                    subject: "Your IELTS Writing Evaluation",
                    content: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                            <h2 style="text-align: center; color: #007bff;">IELTS Writing Evaluation</h2>
                            
                            <p>Dear Candidate,</p>
                            <p>Here is your IELTS writing evaluation result.</p>
    
                            <h3 style="background-color: #007bff; color: #fff; padding: 8px; border-radius: 4px;">Evaluation Summary</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Overall Band:</strong> ${assessment[activeTab]?.score.overall_band}/9</li>
                                <li><strong>Task Response:</strong> ${assessment[activeTab]?.score.task_response}/9</li>
                                <li><strong>Coherence & Cohesion:</strong> ${assessment[activeTab]?.score.coherence_and_cohesion}/9</li>
                                <li><strong>Lexical Resource:</strong> ${assessment[activeTab]?.score.lexical_resource}/9</li>
                                <li><strong>Grammar Accuracy:</strong> ${assessment[activeTab]?.score.grammatical_range_and_accuracy}/9</li>
                            </ul>
    
                            <h3 style="background-color: #28a745; color: #fff; padding: 8px; border-radius: 4px;">Feedback & Suggestions</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Task Response:</strong> ${assessment[activeTab]?.feedback.task_response}</li>
                                <li><strong>Coherence & Cohesion:</strong> ${assessment[activeTab]?.feedback.coherence_and_cohesion}</li>
                                <li><strong>Lexical Resource:</strong> ${assessment[activeTab]?.feedback.lexical_resource}</li>
                                <li><strong>Grammar Accuracy:</strong> ${assessment[activeTab]?.feedback.grammatical_range_and_accuracy}</li>
                            </ul>
    
                            <h3 style="background-color: #6c757d; color: #fff; padding: 8px; border-radius: 4px;">Your Essay</h3>
                            <div style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">
                                <p>${assessment[activeTab]?.original_essay.replace(/\n/g, "<br/>")}</p>
                            </div>
    
                            <p style="text-align: center; margin-top: 20px;">
                                <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://ielts.thietkeai.com"}" style="display: inline-block; background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 4px;">View Full Report</a>
                            </p>
    
                            <p>Best regards, <br/> IELTS Evaluation Team</p>
                        </div>
                    `,
                }),
            });
    
            const data = await res.json();
            if (data.success) {
                alert("Email sent successfully!");
            } else {
                alert(`Failed to send email: ${data.error}`);
            }
        } catch (error) {
            console.error("Email sending error:", error);
            alert("Failed to send email.");
        }
    
        seteLoading(false);
    };
    
    


    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold text-center mb-6">
            IELTS Writing Evaluation
        </h1>
             <div className="flex w-full max-w-2xl bg-gray-800 p-2 rounded-lg m-4">
                <button 
                    className={`w-1/3 p-3 rounded-md transition-all ${activeTab === "text" ? "bg-white text-black shadow-lg" : "bg-transparent text-gray-400"}`} 
                    onClick={() => setActiveTab("text")}
                >
                    Text Input
                </button>
                <button 
                    className={`w-1/3 p-3 rounded-md transition-all ${activeTab === "image" ? "bg-white text-black shadow-lg" : "bg-transparent text-gray-400"}`} 
                    onClick={() => setActiveTab("image")}
                >
                    Upload Image
                </button>
                <button 
                    className={`w-1/3 p-3 rounded-md transition-all ${activeTab === "multi-image" ? "bg-white text-black shadow-lg" : "bg-transparent text-gray-400"}`} 
                    onClick={() => setActiveTab("multi-image")}
                >
                    Multiple Images
                </button>
            </div>

            <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
                {activeTab === "text" ? (
                    <textarea
                    className="w-full p-4 border rounded bg-gray-700 text-white resize-none"
                    rows={6} // 🔹 Shorten text area
                    placeholder="Write or paste your IELTS essay here. Minimum 250 words..."
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                />
                ) : activeTab === "image" ? (
                    <div
                    {...getRootProps()}
                    className="border-dashed border-2 border-gray-500 p-2 rounded-lg cursor-pointer text-center bg-gray-800 w-full h-[250px] flex items-center justify-center relative overflow-hidden"
                >
                    <input {...getInputProps()} className="hidden" />
                    {file ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={URL.createObjectURL(file)}
                                alt="Uploaded preview"
                                fill
                                className="rounded-md object-cover"
                                style={{ objectFit: "cover" }} // Ensures it covers the whole zone
                            />
                            <button
                                className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded-md text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                            >
                                ✕ Remove
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-400">Drop an image or click to upload</p>
                    )}
                </div>
                ) : (
                    <div {...getRootProps()} className="border-dashed border-2 border-gray-500 p-6 rounded-lg cursor-pointer text-center bg-gray-800">
                        <input {...getInputProps()} className="hidden" />
                        <p>Drop images or click to upload</p>
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {files.map((file, index) => (
                                <div key={index} className="relative aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                                    <Image 
                                        src={URL.createObjectURL(file)} 
                                        alt="Uploaded preview" 
                                        fill
                                        className="rounded-lg object-cover"
                                    />
                                    <button 
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm" 
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
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


{assessment[activeTab] && (
    <div id="evaluation-section" className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Results:</h2>
        {assessment[activeTab].error ? (
            <p className="text-red-500">{assessment[activeTab].error}</p>
        ) : (
            <>
                <p className="text-lg font-bold text-green-400">Overall Band: {assessment[activeTab].score.overall_band}/9</p>
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Task Response:</strong> {assessment[activeTab].score.task_response}/9</p>
                    <p><strong>Coherence Cohesion:</strong> {assessment[activeTab].score.coherence_and_cohesion}/9</p>
                    <p><strong>Lexical Resource:</strong> {assessment[activeTab].score.lexical_resource}/9</p>
                    <p><strong>Grammar Accuracy:</strong> {assessment[activeTab].score.grammatical_range_and_accuracy}/9</p>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Feedback:</h3>
                <ul className="list-disc pl-5">
                    <li><strong>Task Response:</strong> {assessment[activeTab].feedback.task_response}</li>
                    <li><strong>Coherence Cohesion:</strong> {assessment[activeTab].feedback.coherence_and_cohesion}</li>
                    <li><strong>Lexical Resource:</strong> {assessment[activeTab].feedback.lexical_resource}</li>
                    <li><strong>Grammar Accuracy:</strong> {assessment[activeTab].feedback.grammatical_range_and_accuracy}</li>
                </ul>
                <h3 className="mt-4 text-lg font-semibold">Areas for Improvement:</h3>
                <ul className="list-disc pl-5">
                    {assessment[activeTab].suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </>
        )}
    </div>
)}

    {assessment[activeTab] && (
        <div id="topic-essay-section" className="mt-6 w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mt-4">Topic:</h3>
            <p className="bg-gray-700 p-4 rounded-lg whitespace-pre-wrap mt-2">{assessment[activeTab]?.topic}</p>

            <h3 className="mt-4 text-lg font-semibold">Original Essay:</h3>
            <p className="bg-gray-700 p-3 rounded-lg whitespace-pre-wrap mt-2">{assessment[activeTab]?.original_essay}</p>

            {/* <button id="export-button" className="mt-4 w-full p-3 bg-green-400 hover:bg-green-500 text-white rounded-lg font-semibold" onClick={exportToPDF}>
                Export to PDF
            </button> */}
        </div>
    )}


            {assessment[activeTab] && (
                <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
                    <h3 className="text-lg font-semibold text-white">Send Evaluation Result</h3>
                    <p className="text-gray-400">Enter your email to receive your IELTS evaluation report.</p>

                    {showEmailForm ? (
                        <div className="mt-4 flex flex-col">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                            <button
                                onClick={handleSendEmail}
                                disabled={!email || eloading}
                                className={`mt-3 p-3 rounded-lg font-semibold shadow-md ${!email || eloading ? "bg-gray-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"}`}
                            >
                                {eloading ? "Sending..." : "Send Result"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowEmailForm(true)}
                            className="mt-4 w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md"
                        >
                            Send Result to Email
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    
}
