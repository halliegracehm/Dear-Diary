import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, username, message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    await resend.emails.send({
      from: "My Inner Mind <noreply@halliewho.com>",
      to: "halliegracehm@gmail.com",
      subject: `💌 Ask Hallie — message from ${username || "a member"}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fdf6ec; padding: 40px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 40px; margin-bottom: 8px;">🌿</div>
            <h1 style="font-size: 24px; color: #7a4a1e; font-weight: 600; margin: 0;">Someone wrote to you</h1>
          </div>

          <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(200,137,90,0.2);">
            <div style="font-size: 12px; color: #b08060; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">From</div>
            <div style="font-size: 16px; color: #5a2e0e; font-weight: 600;">${username || "Anonymous"}</div>
            ${email ? `<div style="font-size: 13px; color: #b08060; margin-top: 2px;">${email}</div>` : ""}
          </div>

          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid rgba(200,137,90,0.2);">
            <div style="font-size: 12px; color: #b08060; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Message</div>
            <p style="font-size: 16px; color: #5a3a1a; line-height: 1.8; font-style: italic; margin: 0;">${message.replace(/\n/g, "<br/>")}</p>
          </div>

          ${email ? `
          <div style="text-align: center; margin-top: 28px;">
            <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #d4956a, #c8895a); color: white; border-radius: 20px; padding: 12px 28px; font-family: sans-serif; font-size: 14px; font-weight: 700; text-decoration: none;">Reply to ${username || "them"} →</a>
          </div>` : ""}

          <p style="text-align: center; font-size: 11px; color: #b08060; margin-top: 32px; letter-spacing: 1px; text-transform: uppercase;">My Inner Mind · Ask Hallie</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Ask Hallie email error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
