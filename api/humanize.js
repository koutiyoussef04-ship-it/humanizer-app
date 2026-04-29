export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text, level } = req.body;

    // PASS 1: Rewrite as human student
    const pass1 = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: `You are a college student who writes casually and imperfectly. You sometimes start sentences with "And" or "But". You use contractions always. You occasionally make a point feel personal. Your writing has natural rhythm — not too polished.`
          },
          {
            role: "user",
            content: `Rewrite this text as if YOU are a real college student writing it for the first time. Make it sound genuinely human:
- Use "And" or "But" to start some sentences
- Mix super short sentences with longer ones randomly
- Add "honestly", "basically", "I mean", "kind of", "pretty much" occasionally  
- Use contractions everywhere: it's, don't, that's, won't, can't, I've
- Remove ALL formal transitions: no "Furthermore", "Moreover", "In conclusion", "Subsequently"
- Add one personal observation or opinion
- Vary punctuation — use a dash here and there, maybe "..." once
- Deliberately make one sentence feel incomplete or casual
- NEVER sound polished or academic

Return ONLY the rewritten text.

Text: ${text}`
          }
        ],
        temperature: 1.0,
        presence_penalty: 0.8,
        frequency_penalty: 0.6,
        max_tokens: 1500
      })
    });

    const data1 = await pass1.json();
    let rewritten = data1.choices?.[0]?.message?.content?.trim() || text;

    // PASS 2: Post-processing to inject human imperfections
    const sentences = rewritten.split(/(?<=[.!?])\s+/);
    
    const fillers = ["Honestly,", "Basically,", "I mean,", "To be fair,", "Look,", "Thing is,"];
    const connectors = ["And honestly,", "But also,", "Plus,", "Though,", "Still,"];
    
    let processed = sentences.map((sentence, i) => {
      // Randomly remove a comma
      if (Math.random() > 0.6) sentence = sentence.replace(/,(?=\s\w)/, '');
      
      // Randomly add a filler at start of some sentences
      if (i > 0 && Math.random() > 0.75) {
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        sentence = filler + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
      }
      
      // Occasionally replace period with "..." for trailing thought
      if (i < sentences.length - 1 && Math.random() > 0.88) {
        sentence = sentence.replace(/\.$/, '...');
      }

      // Randomly split a long sentence into two shorter ones
      if (sentence.split(' ').length > 20 && Math.random() > 0.5) {
        const words = sentence.split(' ');
        const mid = Math.floor(words.length / 2);
        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        sentence = words.slice(0, mid).join(' ') + '. ' + connector + ' ' + words.slice(mid).join(' ');
      }

      return sentence;
    });

    let final = processed.join(' ');

    // Fix common AI phrases
    final = final
      .replace(/it is important to note that/gi, "worth knowing is")
      .replace(/it is worth noting that/gi, "also")
      .replace(/in conclusion/gi, "so yeah")
      .replace(/to summarize/gi, "basically")
      .replace(/this demonstrates/gi, "this shows")
      .replace(/furthermore/gi, "plus")
      .replace(/moreover/gi, "also")
      .replace(/nevertheless/gi, "still")
      .replace(/consequently/gi, "so")
      .replace(/subsequently/gi, "then")
      .replace(/in addition/gi, "and")
      .replace(/as a result/gi, "so")
      .replace(/for instance/gi, "like")
      .replace(/for example/gi, "like")
      .replace(/in order to/gi, "to")
      .replace(/due to the fact that/gi, "because")
      .replace(/at this point in time/gi, "now")
      .replace(/utilize/gi, "use")
      .replace(/implement/gi, "use")
      .replace(/leverage/gi, "use")
      .replace(/facilitate/gi, "help")
      .replace(/demonstrate/gi, "show")
      .replace(/significant/gi, "big")
      .replace(/substantial/gi, "major")
      .replace(/numerous/gi, "many")
      .replace(/individuals/gi, "people")
      .replace(/purchase/gi, "buy")
      .replace(/obtain/gi, "get")
      .replace(/assistance/gi, "help")
      .replace(/approximately/gi, "about")
      .replace(/sufficient/gi, "enough");

    res.status(200).json({ 
      text: final, 
      aiPct: Math.max(0, 25 - (level * 2)) 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
