import express from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticateSupabase, authorizeRole } from './middleware';

const router = express.Router();

router.get('/stats', authenticateSupabase, async (req, res) => {
  const user = (req as any).user;
  const profile = user.profile;

  try {
    if (profile.role === 'admin') {
      const [
        { count: totalClients },
        { count: activeProjects },
        { data: payments },
        { data: tasks }
      ] = await Promise.all([
        supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'In Progress'),
        supabaseAdmin.from('clients').select('budget, paid_amount'),
        supabaseAdmin.from('tasks').select('*, clients(name)').order('created_at', { ascending: false }).limit(5)
      ]);

      const totalRevenue = payments?.reduce((acc, c) => acc + Number(c.paid_amount), 0) || 0;
      const totalBudget = payments?.reduce((acc, c) => acc + Number(c.budget), 0) || 0;
      const pendingPayments = totalBudget - totalRevenue;

      res.json({
        totalClients,
        activeProjects,
        totalRevenue,
        pendingPayments,
        recentTasks: tasks?.map((t: any) => ({ ...t, client_name: t.clients?.name })) || []
      });
    } else {
      // Employee stats
      const { data: tasks } = await supabaseAdmin
        .from('tasks')
        .select('*, clients(name)')
        .eq('assigned_to', user.id)
        .order('deadline', { ascending: true });

      res.json({
        assignedTasks: tasks?.length || 0,
        upcomingDeadlines: tasks?.filter(t => new Date(t.deadline) > new Date()).length || 0,
        recentTasks: tasks?.slice(0, 5).map((t: any) => ({ ...t, client_name: t.clients?.name })) || []
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
