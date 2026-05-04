export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { email, firstName, lastName, action } = req.method === 'GET'
    ? req.query
    : req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  if (req.method === 'GET') {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`,
      { headers }
    );
    const users = await resp.json();
    if (!users.length) return res.status(200).json({ exists: false });
    return res.status(200).json({ exists: true, ...users[0] });
  }

  if (req.method === 'POST') {
    if (action === 'register') {
      await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          first_name: firstName || '',
          last_name: lastName || '',
          plan: 'free',
          uses_count: 0
        })
      });
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`,
        { headers }
      );
      const users = await resp.json();
      return res.status(200).json({ exists: true, ...users[0] });
    }

    if (action === 'increment') {
      const getResp = await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=uses_count,plan`,
        { headers }
      );
      const users = await getResp.json();
      if (!users.length) return res.status(404).json({ error: 'User not found' });
      const { uses_count, plan } = users[0];
      if (plan !== 'gold' && uses_count >= 5) {
        return res.status(403).json({ error: 'limit_reached', plan });
      }
      await fetch(
        `${SUPABASE_URL}/rest/v1/users?email=eq.${encodeURIComponent(email.toLowerCase())}`,
        {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ uses_count: uses_count + 1, updated_at: new Date().toISOString() })
        }
      );
      return res.status(200).json({ uses_count: uses_count + 1, plan });
    }
  }

  res.status(400).json({ error: 'Invalid request' });
}
