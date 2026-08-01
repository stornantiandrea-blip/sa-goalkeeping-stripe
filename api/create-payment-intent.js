export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non permesso' });
  }

  try {
    const { amount, product, size, qty, code } = req.body;

    const importoCentesimi = Math.round(Number(amount));
    if (!importoCentesimi || importoCentesimi < 100) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);

    const descrizione = `${product || 'Ordine'} - Taglia ${size || '-'} - Qta ${qty || 1}${code ? ' - Codice: ' + code : ''}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: importoCentesimi,
      currency: 'eur',
      description: descrizione,
      automatic_payment_methods: { enabled: true },
      metadata: {
        product: product || '',
        size: size || '',
        qty: String(qty || 1),
        discount_code: code || 'nessuno',
      },
    });

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
      }
