export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { priceId, email } = req.body;
  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "payment_method_types[]": "card",
        "mode": "subscription",
        "customer_email": email,
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "success_url": "https://dear-diary-git-main-halliegracehm-5351s-projects.vercel.app/?upgraded=true",
        "cancel_url": "https://dear-diary-git-main-halliegracehm-5351s-projects.vercel.app/?cancelled=true",
      }),
    });
    const session = await response.json();
    if (session.error) throw new Error(session.error.message);
    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
