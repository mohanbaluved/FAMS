import express from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticateSupabase, authorizeRole, logActivity } from './middleware';

const router = express.Router();

router.get('/', authenticateSupabase, async (req, res) => {
  const user = (req as any).user;
  const profile = user.profile;

  try {
    let query = supabaseAdmin
      .from('tasks')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    if (profile.role !== 'admin') {
      query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Flatten client name
    const tasks = data.map((t: any) => ({
      ...t,
      client_name: t.clients?.name
    }));

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticateSupabase, authorizeRole(['admin']), async (req, res) => {
  const { client_id, title, description, priority, deadline, assigned_to } = req.body;
  const user = (req as any).user;

  try {
    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .insert({ client_id, title, description, priority, deadline, assigned_to })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(user.id, `Assigned task: ${title}`, 'task', task.id);

    // Create notification for assigned user
    if (assigned_to) {
      await supabaseAdmin.from('notifications').insert({
        user_id: assigned_to,
        message: `New task assigned: ${title}`
      });
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
