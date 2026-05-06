export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const host = req.headers['host'] || '';
  const origin = req.headers['origin'] || '';
  const domainString = (host + origin).toLowerCase();

  let expectedPassword;
  if (domainString.includes('legalexplainr')) {
    expectedPassword = process.env.COMMUNITY_PASSWORD_LEGALE;
  } else {
    expectedPassword = process.env.COMMUNITY_PASSWORD_MEDE;
  }

  const { password, messages, system, max_tokens, model } = req.body;

  if (!password || password !== expectedPassword) {
    return res.status(401).json({ error: 'Invalid community password.' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-5',
        max_tokens: max_tokens || 4096,
        system: system || '',
        messages: messages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}