export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { text } = req.body;

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
        content: `Analyse this text and estimate if it was written by AI. Return ONLY valid JSON:
{"score": <0-100>, "perplexity": <0-100>, "burstiness": <0-100>, "patternMatch": <0-100>}

Text: ${text}`
      }],
      temperature: 0.2,
      max_tokens: 100
    })
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  res.status(200).json({
    score: parsed.score ?? 50,
    breakdown: { perplexity: parsed.perplexity ?? 50, burstiness: parsed.burstiness ?? 50, patternMatch: parsed.patternMatch ?? 50 }
  });
}
