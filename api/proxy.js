export default async function handler(req, res) {

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check community password — accept from header or body
  const correctPassword = process.env.COMMUNITY_PASSWORD;
  const headerPassword = req.headers["x-community-password"];
  const bodyPassword = req.body?.password;
  const submittedPassword = headerPassword || bodyPassword;

  if (!submittedPassword || submittedPassword !== correctPassword) {
    return res.status(401).json({ error: "Invalid community password" });
  }

  // Strip password from body before forwarding to Anthropic
  const { password, ...anthropicBody } = req.body;

  // Forward request to Anthropic
  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await anthropicResponse.json();

    // Pass Anthropic's status code back to the client
    return res.status(anthropicResponse.status).json(data);

  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({ error: "Proxy request failed" });
  }
}

