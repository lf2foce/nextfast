import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { recipient, subject, content } = await req.json();

        if (!recipient || !subject || !content) {
            return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const emailResponse = await resend.emails.send({
            from: "no-reply@thietkeai.com",
            to: recipient,
            subject: subject,
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                        <h2>${subject}</h2>
                        <p>${content}</p>
                        <p>Best regards,<br/>IELTS Evaluation Team</p>
                    </body>
                </html>
            `,
        });

        return NextResponse.json({ success: true, message: "Email sent!", emailResponse });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
