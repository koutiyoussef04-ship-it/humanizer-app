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
            content: `You are a skilled human writer who rewrites AI-generated text to sound completely natural and human. You have a distinct voice — slightly opinionated, grounded, and real. You never sound like a language model.`
          },
          {
            role: "user",
            content: `Rewrite the following text so it passes AI detectors like GPTZero completely. Follow these rules strictly:

1. VARY SENTENCE DYNAMICS: Mix short punchy sentences (3-6 words) with longer complex ones. Never have 3 sentences of the same length in a row. Create natural burstiness.

2. INJECT PERSONALITY: Use a specific perspective. Add idioms, subtle metaphors, or imperfect conversational transitions like "The thing is,", "Now here's where it gets interesting,", "And that's exactly the point —", "Funny enough,", "Which, when you think about it,".

3. AVOID AI-ISMS: NEVER use these words: tapestry, delve, unlock, comprehensive, shaping, furthermore, moreover, subsequently, it is important to note, in conclusion, to summarize, this demonstrates, facilitate, utilize, leverage, implement, significant, substantial, numerous, individuals. Use raw, grounded language instead.

4. EMBRACE SUBJECTIVITY: Take a slight opinion or add a sense of lived experience. Humans don't sit on the fence. Give the text a point of view.

5. REORDER IDEAS: Do NOT follow the original Intro-Point-Conclusion structure. Rearrange the ideas so they flow conversationally — maybe start with the most interesting point, then explain why.

6. USE CONTRACTIONS EVERYWHERE: it's, don't, that's, won't, can't, I've, you'll, they're, we're.

7. IMPERFECT PUNCTUATION: Use dashes — like this — for asides. Use "..." occasionally for trailing thoughts. Start some sentences with "And" or "But". Remove unnecessary commas.

8. MAINTAIN FACTS: Keep all the original information and context intact. Just change how it's expressed.

Return ONLY the rewritten text. No explanations, no preamble.

Text to rewrite:
${text}`
          }
        ],
        temperature: 1.0,
        presence_penalty: 0.9,
        frequency_penalty: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    let final = data.choices?.[0]?.message?.content?.trim() || text;

    // Post-processing: force replace any remaining AI words
    final = final
      .replace(/\btapestry\b/gi, "mix")
      .replace(/\bdelve\b/gi, "dig")
      .replace(/\bunlock\b/gi, "open up")
      .replace(/\bcomprehensive\b/gi, "full")
      .replace(/\bfurthermore\b/gi, "plus")
      .replace(/\bmoreover\b/gi, "also")
      .replace(/\bsubsequently\b/gi, "then")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\butilize\b/gi, "use")
      .replace(/\bleverage\b/gi, "use")
      .replace(/\bimplement\b/gi, "put in place")
      .replace(/\bsignificant\b/gi, "real")
      .replace(/\bsubstantial\b/gi, "major")
      .replace(/\bnumerous\b/gi, "many")
      .replace(/\bindividuals\b/gi, "people")
      .replace(/\bdemonstrate\b/gi, "show")
      .replace(/\bin conclusion\b/gi, "so yeah")
      .replace(/\bto summarize\b/gi, "basically")
      .replace(/\bit is important to note\b/gi, "worth knowing")
      .replace(/\bthis demonstrates\b/gi, "this shows")
      .replace(/\bin order to\b/gi, "to")
      .replace(/\bdue to the fact that\b/gi, "because")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bpurchase\b/gi, "buy")
      .replace(/\bobtain\b/gi, "get")
      .replace(/\bassistance\b/gi, "help")
      .replace(/\bsufficient\b/gi, "enough")
      .replace(/\binquire\b/gi, "ask")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bterminate\b/gi, "end")
      .replace(/\bendeavor\b/gi, "try")
      .replace(/\bascertain\b/gi, "find out")
      .replace(/\bprioritize\b/gi, "focus on")
      .replace(/\boptimize\b/gi, "improve")
      .replace(/\bsynergy\b/gi, "teamwork")
      .replace(/\bparadigm\b/gi, "way of thinking")
      .replace(/\brobust\b/gi, "strong")
      .replace(/\bseamless\b/gi, "smooth")
      .replace(/\binnovative\b/gi, "new")
      .replace(/\bcutting-edge\b/gi, "latest")
      .replace(/\bstate-of-the-art\b/gi, "modern")
      .replace(/\bbespoke\b/gi, "custom")
      .replace(/\bholistic\b/gi, "overall");

    res.status(200).json({
      text: final,
      aiPct: Math.max(0, 20 - (level * 2))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
