import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        if (!formData.has("essay_text") && !formData.has("file")) {
            return NextResponse.json({ error: "Please provide either text or an image." }, { status: 400 });
        }

        // 🔥 Forward request to Python API
        const res = await fetch(process.env.PYTHON_API_URL || "http://localhost:5000/api/py/evaluate", {
            method: "POST",
            body: formData,
        });

        const textResponse = await res.text(); // Get raw response

        // console.log("🔍 Raw response from Python API:", textResponse); // Log it

        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (error) {
            // console.error("🚨 Failed to parse JSON from backend. Response was:", textResponse);
            return NextResponse.json({ error: "Invalid JSON response from backend" }, { status: 500 });
        }

        if (!res.ok) {
            return NextResponse.json({ error: `Server error: ${res.status} ${data.detail || res.statusText}` }, { status: res.status });
        }

        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        // console.error("❌ Error evaluating essay:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
