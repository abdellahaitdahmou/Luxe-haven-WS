import { Resend } from 'resend';

// No top-level instantiation to avoid build-time errors

export async function sendNewMessageEmail({
  to,
  recipientName,
  senderName,
  propertyName,
  messageContent,
  chatLink,
}: {
  to: string;
  recipientName: string;
  senderName: string;
  propertyName: string;
  messageContent: string;
  chatLink: string;
}) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'Luxe Haven <notifications@luxehaven.com>',
      to: [to],
      subject: `New message from ${senderName} regarding ${propertyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">New Message Received</h2>
          <p>Hi ${recipientName},</p>
          <p>You have received a new message from <strong>${senderName}</strong> regarding the property <strong>${propertyName}</strong>:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #eab308; margin: 20px 0; font-style: italic;">
            "${messageContent}"
          </div>
          <p style="margin-top: 30px;">
            <a href="${chatLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reply in Chat
            </a>
          </p>
          <hr style="margin: 40px 0 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="color: #666; font-size: 12px;">This is an automated notification from Luxe Haven. Please do not reply directly to this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { success: false, error: err };
  }
}
