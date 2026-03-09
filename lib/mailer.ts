/**
 * lib/mailer.ts
 * Sends emails using Resend (primary) with a Gmail SMTP fallback.
 *
 * Required env vars:
 *   RESEND_API_KEY   — already set in .env.local
 *   GMAIL_USER / GMAIL_APP_PASSWORD — optional fallback
 */

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

// ─── Resend ───────────────────────────────────────────────────────────────────
async function sendViaResend({ to, subject, html }: MailOptions) {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: "Luxe Haven <onboarding@resend.dev>",
            to,
            subject,
            html,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data.id as string;
}

// ─── Gmail SMTP fallback ──────────────────────────────────────────────────────
async function sendViaGmail({ to, subject, html }: MailOptions) {
    // Lazily import nodemailer so it doesn't break if not installed
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
    const info = await transporter.sendMail({
        from: `Luxe Haven <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });
    return info.messageId as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function sendMail(options: MailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    provider?: string;
}> {
    // 1️⃣  Try Resend first (no domain setup needed for onboarding@resend.dev)
    if (process.env.RESEND_API_KEY) {
        try {
            const id = await sendViaResend(options);
            console.log("[mailer] Sent via Resend:", id);
            return { success: true, messageId: id, provider: "resend" };
        } catch (err: any) {
            console.warn("[mailer] Resend failed, trying Gmail:", err.message);
        }
    }

    // 2️⃣  Fallback: Gmail SMTP
    const gmailReady =
        process.env.GMAIL_USER &&
        process.env.GMAIL_APP_PASSWORD &&
        !process.env.GMAIL_APP_PASSWORD.startsWith("paste_");

    if (gmailReady) {
        try {
            const id = await sendViaGmail(options);
            console.log("[mailer] Sent via Gmail:", id);
            return { success: true, messageId: id, provider: "gmail" };
        } catch (err: any) {
            console.error("[mailer] Gmail failed:", err.message);
            return { success: false, error: err.message };
        }
    }

    return {
        success: false,
        error:
            "No email provider configured. Set RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD in .env.local.",
    };
}
