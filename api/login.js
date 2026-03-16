import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Thiếu username hoặc password' });
        return;
      }

      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== adminUsername || password !== adminPassword) {
        res
          .status(401)
          .json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ success: false, error: 'JWT_SECRET chưa được cấu hình.' });
        return;
      }

      const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '24h' });

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: { username, role: 'admin' }
      });
    } catch (e) {
      console.error('Lỗi khi đăng nhập (serverless):', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}



