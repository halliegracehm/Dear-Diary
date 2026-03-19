export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email;
    const priceId = session.line_items?.data?.[0]?.price?.id;
    const plan = priceId === "price_1TBmxqDC5IHfzeBkFuxyZPfX" ? "plus" : "group";

    await fetch(`${process.env.SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });
  }

  res.status(200).json({ received: true });
}
