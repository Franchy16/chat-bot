import { verifyJwt } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = verifyJwt(req, res);
  if (!user) return;

  res.json({ success: true, message: 'Token hợp lệ', user });
}


