export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, level } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a human student rewriting notes in your own words. You write casually, make occasional minor errors, vary your sentence lengths a lot, and sound genuinely human. You never sound like an AI. You use contractions, informal phrasing, and personal opinions occasionally.`
          },
          {
            role: "user",
            content: `Rewrite the following text so it sounds completely human-written and passes AI detectors like GPTZero. 

Rules:
- Mix very short sentences (3-5 words) with longer ones randomly
- Use contractions everywhere (it's, don't, that's, I've, you'll)
- Add occasional filler words (honestly, basically, kind of, pretty much)
- Break formal transitions (Furthermore → Plus, Moreover → Also)
- Vary punctuation — use dashes, ellipses occasionally
- Add a personal touch or opinion once or twice
- Never use: "Furthermore", "Moreover", "In conclusion", "It is important to note"
- Make it sound like a smart student wrote it, not an AI
- Keep the same meaning and information

Return ONLY the rewritten text. No explanations.

Text:
${text}`
          }
        ],
        temperature: 0.95,
        presence_penalty: 0.6,
        frequency_penalty: 0.5,
        max_tokens: 1500
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
