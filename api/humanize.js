export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

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
        content: `You are an expert at making AI-generated text sound natural and human-written so it bypasses AI detectors like GPTZero.

Rewrite the following text ${intensityDesc} so it:
- Varies sentence lengths dramatically (mix very short and longer sentences)
- Uses natural conversational transitions instead of formal ones
- Adds subtle imperfections and personal tone
- Uses contractions naturally (it's, that's, don't, etc.)
- Sounds like a real person wrote it

Return ONLY the rewritten text, nothing else.

Text to rewrite:
${text}`
      }],
      temperature: 0.85,
      max_tokens: 1000
    })
  });

  const data = await response.json();
  const humanized = data.choices?.[0]?.message?.content?.trim() || text;
  res.status(200).json({ text: humanized, aiPct: Math.max(0, 30 - (level * 3)) });
}
