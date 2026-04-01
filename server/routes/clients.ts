import express from 'express';
import { supabaseAdmin } from '../supabase';
import { authenticateSupabase, authorizeRole, logActivity } from './middleware';

const router = express.Router();

// Get all clients (Admin sees all, Employee sees assigned)
router.get('/', authenticateSupabase, async (req, res) => {
  const user = (req as any).user;
  const profile = user.profile;

  try {
    let query = supabaseAdmin.from('clients').select('*').order('created_at', { ascending: false });

    if (profile.role !== 'admin') {
      // Employees only see clients where they have an assigned task or checklist item
      // This is a bit complex for a single query, so we'll use the RLS-like logic or a join
      // For simplicity in this service layer, we'll fetch IDs first
      const { data: assignedTasks } = await supabaseAdmin
        .from('tasks')
        .select('client_id')
        .eq('assigned_to', user.id);
      
      const { data: assignedChecklists } = await supabaseAdmin
        .from('checklist_items')
        .select('client_id')
        .eq('assigned_to', user.id);

      const clientIds = [
        ...(assignedTasks?.map(t => t.client_id) || []),
        ...(assignedChecklists?.map(c => c.client_id) || [])
      ];

      query = query.in('id', clientIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create client and apply template (Admin only)
router.post('/', authenticateSupabase, authorizeRole(['admin']), async (req, res) => {
  const { name, contact_info, project_type, budget, template_id } = req.body;
  const user = (req as any).user;

  try {
    // 1. Create client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({ name, contact_info, project_type, budget, template_id })
      .select()
      .single();

    if (clientError) throw clientError;

    // 2. Apply template steps if provided
    if (template_id) {
      const { data: steps } = await supabaseAdmin
        .from('workflow_steps')
        .select('*')
        .eq('template_id', template_id)
        .order('order_index', { ascending: true });

      if (steps && steps.length > 0) {
        const checklistItems = steps.map(step => ({
          client_id: client.id,
          step_name: step.name,
          status: 'pending'
        }));

        await supabaseAdmin.from('checklist_items').insert(checklistItems);
      }
    }

    // 3. Log activity
    await logActivity(user.id, `Created client: ${name}`, 'client', client.id);

    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
