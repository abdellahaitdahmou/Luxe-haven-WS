import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';

export async function POST(request: Request) {
    try {
        const { email, role } = await request.json();

        const result = await sendMail({
            to: email,
            subject: 'You have been invited to Luxe Haven',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D4AF37;">Luxe Haven Invitation</h1>
          <p>You have been invited to join the Luxe Haven platform as a <strong>${role}</strong>.</p>
          <p>Please sign up using this email address to access your account.</p>
          <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/signup?email=${encodeURIComponent(email)}" style="background-color: #D4AF37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-top: 10px;">Accept Invitation</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">If you were not expecting this invitation, please ignore this email.</p>
        </div>
      `,
        });

        if (!result.success) {
            console.error("Email Error:", result.error);
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, messageId: result.messageId });
    } catch (error) {
        console.error("Send invite error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
