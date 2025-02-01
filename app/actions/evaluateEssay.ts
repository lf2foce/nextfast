"use server";

export async function evaluateEssay(essayText: string, file: File | null) {
  const formData = new FormData();
  
  if (essayText) {
    formData.append("essay_text", essayText);
  } else if (file) {
    formData.append("file", file);
  } else {
    throw new Error("Please provide either text or an image.");
  }
    // Dynamically detect localhost or production
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

    const res = await fetch(`${baseURL}/api/py/evaluate`, {
    method: "POST",
    body: formData,
    });

  if (!res.ok) {
    const errorResponse = await res.json();
    throw new Error(`Server error: ${res.status} ${errorResponse.detail || res.statusText}`);
  }

  return res.json();
}