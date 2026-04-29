export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, level } = req.body;
    const intensity = level / 10;

    // ─── HUMAN CONNECTORS POOL ───────────────────────────────
    const connectors = [
      "But here's the thing —", "Anyway,", "And look,",
      "Which is wild when you think about it.", "The thing is,",
      "Here's where it gets interesting:", "And that's kind of the point.",
      "Funny enough,", "Not to go too deep into it, but",
      "Which, honestly,", "To be fair,", "It boils down to this:",
      "And I think that matters.", "But still —", "Go figure.",
    ];

    // ─── STAGE 1: DECONSTRUCT into raw claims ────────────────
    const deconstructRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `Extract every distinct fact, claim, or idea from this text as a numbered list. No explanations. Just the raw ideas, one per line, stripped of any structure or transitions.\n\nText:\n${text}`
        }],
        temperature: 0.3,
        max_tokens: 800
      })
    });
    const deconstructData = await deconstructRes.json();
    const claims = deconstructData.choices?.[0]?.message?.content?.trim() || text;

    // ─── STAGE 2: REWRITE each claim with perplexity injection ─
    const rewriteRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `You are a human with strong opinions and a casual writing style. You write like you're texting a smart friend. You use unexpected word choices — not wrong, just surprising. You never sound like Wikipedia.`
          },
          {
            role: "user",
            content: `Take these raw ideas and rewrite them as natural human prose. Follow every rule:

STRUCTURE RULES:
- Use fragments. Deliberately. Like this.
- Use rhetorical questions to break flow. Why does this matter? Because it does.
- Use em-dashes—like this—to interrupt thoughts
- CRITICAL: After every 2-3 long sentences, write a very short one. 2-5 words max. Then go long again.
- Start some sentences with "And" or "But" — it's fine, humans do it
- Never write 3 sentences with the same grammatical structure in a row

WORD CHOICE RULES (perplexity injection):
- Choose the SECOND word that comes to mind, not the first obvious one
- "important" → "it actually matters" / "loud" / "charged"
- "diverse" → "all over the place" / "a messy mix"
- "rich" → "dense" / "loaded" / "thick with"
- "connect" → "tie together" / "thread through"
- Use ONE strong word instead of 3 adjectives. Never "rich, vibrant, and diverse"
- BANNED WORDS: tapestry, delve, unlock, comprehensive, vibrant, foster, crucial, vital, seamless, robust, innovative, leverage, utilize, facilitate, demonstrate, significant, substantial, numerous, individuals, shaping, furthermore, moreover, subsequently, in conclusion, additionally, nevertheless

TONE RULES:
- Add ONE personal opinion or observation
- Make it feel like a late-night conversation about why this topic actually matters
- Use contractions everywhere: it's, don't, that's, won't, can't, they're
- Slightly imperfect is better than polished

OUTPUT: Return flowing paragraphs only. No bullet points, no markdown, no headers, no lists. Plain text.

Raw ideas to rewrite:
${claims}`
          }
        ],
        temperature: 1.0,
        presence_penalty: 0.95,
        frequency_penalty: 0.85,
        max_tokens: 2000
      })
    });

    const rewriteData = await rewriteRes.json();
    let rewritten = rewriteData.choices?.[0]?.message?.content?.trim() || text;

    // ─── STAGE 3: BURSTINESS ENFORCEMENT ─────────────────────
    // Split into sentences and algorithmically enforce length variance
    const sentences = rewritten.match(/[^.!?]+[.!?]+/g) || [rewritten];
    let bursty = [];
    let i = 0;

    while (i < sentences.length) {
      const s = sentences[i].trim();
      const wordCount = s.split(' ').length;

      // If 3 sentences in a row are similar length, inject a short one
      if (i >= 2) {
        const prev1 = bursty[bursty.length - 1]?.split(' ').length || 0;
        const prev2 = bursty[bursty.length - 2]?.split(' ').length || 0;
        const variance = Math.abs(prev1 - prev2);
        if (variance < 4 && prev1 > 8) {
          // inject a random short connector
          const c = connectors[Math.floor(Math.random() * connectors.length)];
          bursty.push(c);
        }
      }
      bursty.push(s);
      i++;
    }

    let final = bursty.join(' ');

    // ─── STAGE 4: FINAL CLEANUP ───────────────────────────────
    // Strip markdown
    final = final
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Kill any surviving AI words
    final = final
      .replace(/\btapestry\b/gi, "mix")
      .replace(/\bdelve\b/gi, "dig into")
      .replace(/\bunlock\b/gi, "open up")
      .replace(/\bvibrant\b/gi, "electric")
      .replace(/\bfoster\b/gi, "build")
      .replace(/\bcrucial\b/gi, "key")
      .replace(/\bseamless\b/gi, "smooth")
      .replace(/\brobust\b/gi, "strong")
      .replace(/\butilize\b/gi, "use")
      .replace(/\bleverage\b/gi, "use")
      .replace(/\bfacilitate\b/gi, "help")
      .replace(/\bdemonstrate\b/gi, "show")
      .replace(/\bsignificant\b/gi, "major")
      .replace(/\bnumerous\b/gi, "many")
      .replace(/\bindividuals\b/gi, "people")
      .replace(/\bfurthermore\b/gi, "and look,")
      .replace(/\bmoreover\b/gi, "also,")
      .replace(/\bin conclusion\b/gi, "it boils down to this:")
      .replace(/\badditionally\b/gi, "and,")
      .replace(/\bnevertheless\b/gi, "still,")
      .replace(/\bconsequently\b/gi, "so,")
      .replace(/\bsubsequently\b/gi, "after that,")
      .replace(/\bin order to\b/gi, "to")
      .replace(/\bdue to the fact that\b/gi, "because")
      .replace(/\bapproximately\b/gi, "about")
      .replace(/\bpurchase\b/gi, "buy")
      .replace(/\bobtain\b/gi, "get")
      .replace(/\bcommence\b/gi, "start")
      .replace(/\bendeavor\b/gi, "try")
      .replace(/\boptimize\b/gi, "improve")
      .replace(/\bholistic\b/gi, "overall")
      .replace(/\binquire\b/gi, "ask")
      .replace(/\bascertain\b/gi, "find out");

    res.status(200).json({
      text: final,
      aiPct: Math.max(0, 15 - (level * 1.5))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
