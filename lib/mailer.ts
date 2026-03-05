import nodemailer from "nodemailer";

/**
 * Creates a Gmail SMTP transporter.
 * Requires in .env.local:
 *   GMAIL_USER=ahmed505ait@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  (Google App Password, NOT your Gmail password)
 */
export function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendMail({ to, subject, html }: MailOptions) {
    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail({
            from: `Luxe Haven <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("Email error:", error.message);
        return { success: false, error: error.message };
    }
}
