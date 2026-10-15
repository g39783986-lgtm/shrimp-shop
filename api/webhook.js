export default function handler(req, res) {
  if (req.method === 'POST') {
    return res.status(200).json({ status: 'success' });
  }
  return res.status(200).send('Webhook endpoint is active');
}
