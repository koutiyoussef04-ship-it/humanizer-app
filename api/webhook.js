import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const timestamp = sig.split(',').find(p => p.startsWith('t=')).split('=')[1];
    const payload = `${timestamp}.${rawBody.toString()}`;
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
    const receivedSig = sig.split(',').find(p => p.startsWith('v1=')).split('=')[1];
    if (expectedSig !== receivedSig) throw new Error('Invalid signature');
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    if (email) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          plan: 'gold',
          uses_count: 0,
          updated_at: new Date().toISOString()
        })
      });
    }
  }

  res.status(200).json({ received: true });
}
