import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// No top-level instantiation to avoid build-time errors

export async function POST(request: Request) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { email, role } = await request.json();

        const { data, error } = await resend.emails.send({
            from: 'Luxe Haven <onboarding@resend.dev>', // Use default until domain is verified
            to: [email],
            subject: 'You have been invited to Luxe Haven',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #D4AF37;">Luxe Haven Invitation</h1>
          <p>You have been invited to join the Luxe Haven platform as a <strong>${role}</strong>.</p>
          <p>Please sign up using this email address to access your account.</p>
          <a href="${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/login" style="background-color: #D4AF37; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">If you were not expecting this invitation, please ignore this email.</p>
        </div>
      `,
        });

        console.log("Resend API Response:", { data, error });

        if (error) {
            console.error("Resend Error:", error);
            // Ensure error object is serializable
            const errorMessage = error.message || "Unknown error";
            const errorName = error.name || "Error";
            return NextResponse.json({ error: errorMessage, name: errorName, details: error }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error }, { status: 500 });
    }
}
