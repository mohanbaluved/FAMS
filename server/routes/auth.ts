import express from 'express';
import { generateToken, comparePassword, hashPassword } from '../auth';
import pool from '../db';
import { mockDb } from '../mockDb';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    let user;
    if (process.env.DATABASE_URL) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    } else {
      user = mockDb.users.find(u => u.email === email);
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // In mock mode, we skip bcrypt for simplicity in demo
    const isValid = process.env.DATABASE_URL 
      ? await comparePassword(password, user.password)
      : (password === 'admin123' || password === 'employee123');

    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
