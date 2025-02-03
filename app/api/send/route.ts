import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { recipient, subject, content } = await req.json();

        // Initialize Resend with API Key (ONLY on server)
        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailResponse = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: recipient,
            subject: subject,
            html: content,
        });

        return NextResponse.json({ success: true, message: "Email sent!", emailResponse });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}