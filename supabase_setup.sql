-- FAMS Supabase Schema & Security Rules

-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Clients Table
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_info JSONB,
  project_type TEXT,
  budget NUMERIC(12, 2) DEFAULT 0,
  paid_amount NUMERIC(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Waiting for Client', 'Completed', 'Blocked')),
  template_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 3. Workflow Templates
CREATE TABLE public.workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- 4. Workflow Steps
CREATE TABLE public.workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

-- 5. Checklist Items
CREATE TABLE public.checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  assigned_to UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- 6. Tasks
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Waiting for Client', 'Completed', 'Blocked')),
  priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  deadline DATE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 7. Documents
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  category TEXT CHECK (category IN ('invoice', 'GST', 'deliverables', 'other')),
  version INT DEFAULT 1,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 8. Payments
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'Paid' CHECK (status IN ('Paid', 'Partial', 'Unpaid')),
  payment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 9. Activity Logs
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 10. Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Clients Policies
CREATE POLICY "Admins can manage all clients" ON public.clients FOR ALL USING (public.is_admin());
CREATE POLICY "Employees can view assigned clients" ON public.clients FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.client_id = clients.id AND tasks.assigned_to = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.checklist_items
    WHERE checklist_items.client_id = clients.id AND checklist_items.assigned_to = auth.uid()
  )
);

-- Tasks Policies
CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL USING (public.is_admin());
CREATE POLICY "Employees can view and update assigned tasks" ON public.tasks FOR ALL USING (assigned_to = auth.uid());

-- Checklist Items Policies
CREATE POLICY "Admins can manage all checklist items" ON public.checklist_items FOR ALL USING (public.is_admin());
CREATE POLICY "Employees can view and update assigned checklist items" ON public.checklist_items FOR ALL USING (assigned_to = auth.uid());

-- Documents Policies
CREATE POLICY "Admins can manage all documents" ON public.documents FOR ALL USING (public.is_admin());
CREATE POLICY "Employees can view documents for assigned clients" ON public.documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = documents.client_id AND (
      EXISTS (SELECT 1 FROM public.tasks WHERE tasks.client_id = clients.id AND tasks.assigned_to = auth.uid())
      OR EXISTS (SELECT 1 FROM public.checklist_items WHERE checklist_items.client_id = clients.id AND checklist_items.assigned_to = auth.uid())
    )
  )
);
CREATE POLICY "Employees can upload documents for assigned clients" ON public.documents FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = documents.client_id AND (
      EXISTS (SELECT 1 FROM public.tasks WHERE tasks.client_id = clients.id AND tasks.assigned_to = auth.uid())
      OR EXISTS (SELECT 1 FROM public.checklist_items WHERE checklist_items.client_id = clients.id AND checklist_items.assigned_to = auth.uid())
    )
  )
);

-- Payments Policies
CREATE POLICY "Admins can manage all payments" ON public.payments FOR ALL USING (public.is_admin());

-- Activity Logs Policies
CREATE POLICY "Logs are viewable by admins" ON public.activity_logs FOR SELECT USING (public.is_admin());

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- TRIGGER: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
