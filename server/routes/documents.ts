import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../supabase';
import { authenticateSupabase, authorizeRole, logActivity } from './middleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all documents
router.get('/', authenticateSupabase, async (req, res) => {
  const user = (req as any).user;
  const profile = user.profile;

  try {
    let query = supabaseAdmin
      .from('documents')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    if (profile.role !== 'admin') {
      // Employees only see documents for clients they are assigned to
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

      query = query.in('client_id', clientIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const documents = data.map((d: any) => ({
      ...d,
      client_name: d.clients?.name
    }));

    res.json(documents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document
router.post('/upload', authenticateSupabase, upload.single('file'), async (req, res) => {
  const { client_id, category } = req.body;
  const file = req.file;
  const user = (req as any).user;

  if (!file) return res.status(400).json({ message: 'No file uploaded' });
  if (!client_id) return res.status(400).json({ message: 'Client ID is required' });

  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${client_id}/${fileName}`;

    // 1. Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (storageError) throw storageError;

    // 2. Save metadata to database
    const { data: docData, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        client_id,
        name: file.originalname,
        file_path: filePath,
        category: category || 'other',
        uploaded_by: user.id
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 3. Log activity
    await logActivity(user.id, `Uploaded document: ${file.originalname}`, 'document', docData.id);

    res.status(201).json(docData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get signed URL for download
router.get('/:id/download', authenticateSupabase, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    // 1. Get document metadata
    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError || !doc) return res.status(404).json({ message: 'Document not found' });

    // 2. Check permissions (simplified: admin or assigned)
    // In a real app, you'd check if the user is assigned to the client
    // For now, we'll allow admins or the uploader
    if (user.profile.role !== 'admin' && doc.uploaded_by !== user.id) {
        // Additional check for assigned employees
        const { data: assignedTasks } = await supabaseAdmin
            .from('tasks')
            .select('id')
            .eq('client_id', doc.client_id)
            .eq('assigned_to', user.id)
            .single();
        
        if (!assignedTasks) {
            return res.status(403).json({ message: 'Access denied' });
        }
    }

    // 3. Generate signed URL
    const { data, error } = await supabaseAdmin
      .storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600); // 1 hour

    if (error) throw error;

    res.json({ url: data.signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
