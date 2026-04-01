import express from 'express';
import { supabaseAdmin } from '../supabase';

const router = express.Router();

// Middleware to verify Supabase token and get user profile
export const authenticateSupabase = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authentication required' });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error || !user) return res.status(403).json({ message: 'Invalid or expired token' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  (req as any).user = { ...user, profile };
  next();
};

export const authorizeRole = (roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const profile = (req as any).user?.profile;
    if (!profile || !roles.includes(profile.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Helper for activity logging
export const logActivity = async (userId: string, action: string, targetType?: string, targetId?: string) => {
  await supabaseAdmin.from('activity_logs').insert({
    user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId
  });
};

export default router;
