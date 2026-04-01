// Mock Database for preview when DATABASE_URL is missing
export const mockDb = {
  users: [
    { id: 1, name: 'Admin User', email: 'admin@fams.com', password: 'hashed_password', role: 'admin', status: 'active' },
    { id: 2, name: 'John Employee', email: 'john@fams.com', password: 'hashed_password', role: 'employee', status: 'active' }
  ],
  clients: [
    { id: 1, name: 'Acme Corp', email: 'contact@acme.com', phone: '123-456-7890', project_type: 'Web App', budget: 5000, paid_amount: 2000, status: 'In Progress' },
    { id: 2, name: 'Globex', email: 'info@globex.com', phone: '987-654-3210', project_type: 'Mobile App', budget: 8000, paid_amount: 8000, status: 'Completed' }
  ],
  tasks: [
    { id: 1, client_id: 1, title: 'Design UI', status: 'In Progress', priority: 'High', assigned_to: 2, deadline: '2026-04-15' },
    { id: 2, client_id: 1, title: 'Setup Backend', status: 'Not Started', priority: 'Urgent', assigned_to: 1, deadline: '2026-04-10' }
  ],
  workflow_templates: [
    { id: 1, name: 'Standard Onboarding', description: 'Steps for new clients' }
  ],
  template_steps: [
    { id: 1, template_id: 1, step_name: 'Send Welcome Email', order_index: 1 },
    { id: 2, template_id: 1, step_name: 'Generate Invoice', order_index: 2 }
  ],
  checklists: [
    { id: 1, client_id: 1, step_name: 'Send Welcome Email', status: 'completed', assigned_to: 1, completed_at: new Date() },
    { id: 2, client_id: 1, step_name: 'Generate Invoice', status: 'pending', assigned_to: 2 }
  ],
  documents: [
    { id: 1, client_id: 1, name: 'Contract.pdf', file_url: 'https://example.com/contract.pdf', category: 'deliverables', version: 1, uploaded_by: 1 }
  ],
  payments: [
    { id: 1, client_id: 1, amount: 2000, status: 'Paid', date: '2026-03-25' }
  ],
  activity_logs: [
    { id: 1, user_id: 1, action: 'Created client Acme Corp', target_type: 'client', target_id: 1, created_at: new Date() }
  ],
  notifications: [
    { id: 1, user_id: 2, message: 'New task assigned: Design UI', is_read: false, created_at: new Date() }
  ]
};
