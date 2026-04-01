import express from 'express';
import { authenticateToken } from '../auth';
import pool from '../db';
import { mockDb } from '../mockDb';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const result = await pool.query('SELECT p.*, c.name as client_name FROM payments p JOIN clients c ON p.client_id = c.id');
      res.json(result.rows);
    } else {
      res.json(mockDb.payments.map(p => ({
        ...p,
        client_name: mockDb.clients.find(c => c.id === p.client_id)?.name
      })));
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
