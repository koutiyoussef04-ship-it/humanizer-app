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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a human with strong opinions and a casual writing style. You write like you're talking to a smart friend. You use unexpected word choices. You never sound like Wikipedia or an AI.`
          },
          {
            role: "user",
            content: `CRITICAL RULE: You MUST write your response in the EXACT SAME LANGUAGE as the input text. If the input is in Spanish, respond in Spanish. If French, respond in French. Never translate.

Rewrite the following text so it sounds completely human. Follow these rules:

- Write long flowing sentences that build on each other naturally. Avoid short choppy sentences.
- Aim for sentences of 20-35 words on average. Let ideas breathe and connect.
- Use contractions everywhere: it's don't that's won't can't they're we're
- Use spoken transitions: "But here's the thing" "Anyway" "And look" "To be fair" "Funny enough" "Which makes sense when you think about it"
- Add one personal opinion or observation
- NEVER use commas. Replace every comma with a period or rewrite the sentence to flow without one.
- NEVER use em-dashes (—) or en-dashes (–).
- NEVER use: furthermore moreover in conclusion additionally tapestry delve vibrant robust utilize leverage facilitate demonstrate significant numerous individuals seamless comprehensive foster crucial
- No bullet points no bold no headers no markdown. Plain text paragraphs only.
- Keep all original facts and meaning intact.

Return ONLY the rewritten text. Nothing else.

Text:
${text}`
          }
        ],
        temperature: 1.0,
        presence_penalty: 0.9,
        frequency_penalty: 0.8,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    let final = data.choices?.[0]?.message?.content?.trim() || text;

    // Strip markdown
    final = final
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[—–]/g, ' ')
      .replace(/,/g, '')
      .trim();

    // Kill AI words
    final = final
      .replace(/\btapestry\b/gi, "mix")
      .replace(/\bdelve\b/gi, "dig into")
      .replace(/\bvibrant\b/gi, "electric")
      .replace(/\butilize\b/gi, "use")
      .replace(/\bleverage\b/gi, "use")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\bdemonstrate\b/gi, "show")
      .replace(/\bsignificant\b/gi, "major")
      .replace(/\bnumerous\b/gi, "many")
      .replace(/\bindividuals\b/gi, "people")
      .replace(/\bfurthermore\b/gi, "and look,")
      .replace(/\bmoreover\b/gi, "also,")
      .replace(/\bin conclusion\b/gi, "so,")
      .replace(/\badditionally\b/gi, "and,")
      .replace(/\bnevertheless\b/gi, "still,")
      .replace(/\bconsequently\b/gi, "so,")
      .replace(/\bin order to\b/gi, "to")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bendeavor\b/gi, "try");

    res.status(200).json({
      text: final,
      aiPct: Math.max(0, 20 - (level * 2))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
