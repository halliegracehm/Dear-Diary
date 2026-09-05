export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { messages, system } = req.body;
  if (!messages) {
    return res.status(400).json({ error: "Messages are required" });
  }
  try {
    const body = { model: "claude-sonnet-5", max_tokens: 300, messages };
    if (system) body.system = system;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("Anthropic API error:", r.status, errText);
      return res.status(500).json({ error: "AI request failed" });
    }

    const data = await r.json();
    const text = data.content?.map((b) => b.text || "").join("") || "";
    return res.status(200).json({ text });
  } catch (error) {
    console.error("AI completion error:", error);
    return res.status(500).json({ error: "Failed to get completion" });
  }
}
