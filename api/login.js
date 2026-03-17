import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getAdminsCollection } from '../src/lib/mongo.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body || {};

      if (!username || !password) {
        res.status(400).json({ success: false, error: 'Thiếu username hoặc password' });
        return;
      }

      const col = await getAdminsCollection();
      await col.createIndex({ usernameLower: 1 }, { unique: true });

      // Seed default admin if empty
      const count = await col.countDocuments();
      if (count === 0) {
        const u = process.env.ADMIN_USERNAME || 'admin';
        const p = process.env.ADMIN_PASSWORD || 'admin123';
        await col.insertOne({
          id: Date.now().toString(),
          username: u,
          usernameLower: String(u).trim().toLowerCase(),
          passwordHash: await bcrypt.hash(String(p), 10),
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }

      const admin = await col.findOne(
        { usernameLower: String(username).trim().toLowerCase() },
        { projection: { _id: 0 } }
      );
      if (!admin) {
        res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        return;
      }
      const ok = await bcrypt.compare(String(password), admin.passwordHash || '');
      if (!ok) {
        res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        res.status(500).json({ success: false, error: 'JWT_SECRET chưa được cấu hình.' });
        return;
      }

      const token = jwt.sign(
        { adminId: admin.id, username: admin.username, role: admin.role || 'admin' },
        secret,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: { id: admin.id, username: admin.username, role: admin.role || 'admin' }
      });
    } catch (e) {
      console.error('Lỗi khi đăng nhập (serverless):', e);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}



