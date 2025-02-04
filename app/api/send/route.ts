import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { recipient, subject, content } = await req.json();

        if (!recipient || !subject || !content) {
            return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);
        // 🔹 Check if running in local or production
        const isProduction = process.env.NODE_ENV === "production";

        const emailResponse = await resend.emails.send({
            // from: "no-reply@thietkeai.com",
            from: isProduction ? "no-reply@thietkeai.com" : "test@thietkeai.com", // ✅ Change sender based on environment
            to: recipient,
            subject: subject,
            html: content,
        });

        return NextResponse.json({ success: true, message: "Email sent!", emailResponse });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
