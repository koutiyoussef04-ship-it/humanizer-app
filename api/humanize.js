export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, level } = req.body;
    const intensityDesc = level <= 3 ? "lightly" : level <= 6 ? "moderately" : level <= 8 ? "heavily" : "completely";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `You are an expert at making AI-generated text sound natural and human-written so it bypasses AI detectors like GPTZero. Rewrite the following text ${intensityDesc} so it varies sentence lengths dramatically, uses natural conversational transitions, adds subtle imperfections and personal tone, uses contractions naturally, and sounds like a real person wrote it. Return ONLY the rewritten text, nothing else.\n\nText to rewrite:\n${text}`
        }],
        temperature: 0.85,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const humanized = data.choices?.[0]?.message?.content?.trim() || text;
    res.status(200).json({ text: humanized, aiPct: Math.max(0, 30 - (level * 3)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
