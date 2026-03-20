export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "My Inner Mind <hello@halliewho.com>",
      to: email,
      subject: "Your My Inner Mind reset code 🌿",
      html: `
        <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:40px;background:#fffdf8;color:#5a2e0e;">
          <div style="font-size:36px;margin-bottom:16px;">🌿</div>
          <h1 style="font-size:24px;margin-bottom:8px;">Reset your password</h1>
          <p style="color:#b08060;font-size:15px;line-height:1.6;margin-bottom:24px;">
            Use the code below to reset your My Inner Mind password. It expires in 15 minutes.
          </p>
          <div style="background:#f5e8d3;border-radius:12px;padding:24px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#7a4a1e;margin-bottom:24px;">
            ${code}
          </div>
          <p style="color:#b08060;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
          <p style="color:#c8895a;font-size:13px;margin-top:24px;">With love, Hallie 🌿</p>
        </div>
      `,
    }),
  });

  const data = await response.json();
  if (!response.ok) return res.status(500).json({ error: data });
  res.status(200).json({ success: true });
}
