import { NextResponse } from "next/server";

export const maxDuration = 60;


export async function POST(req: Request) {
    try {
        const formData = await req.formData(); // Extract FormData from request

        if (!formData.has("essay_text") && !formData.has("file")) {
            return NextResponse.json({ error: "Please provide either text or an image." }, { status: 400 });
        }

        // Forward request to the Python API
        const res = await fetch(process.env.PYTHON_API_URL || "http://localhost:3003/api/py/evaluate", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorResponse = await res.json();
            return NextResponse.json({ error: `Server error: ${res.status} ${errorResponse.detail || res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error evaluating essay:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}