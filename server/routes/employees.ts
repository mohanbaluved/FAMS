import express from 'express';
import { authenticateToken, authorizeRole } from '../auth';
import pool from '../db';
import { mockDb } from '../mockDb';

const router = express.Router();

router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const result = await pool.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } else {
      res.json(mockDb.users.map(({ password, ...u }) => u));
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
