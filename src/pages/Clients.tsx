import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Search, MoreHorizontal } from 'lucide-react';
import { Input } from '../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Clients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    project_type: '',
    budget: '',
    template_id: ''
  });

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase.from('workflow_templates').select('*');
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to fetch templates', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchTemplates();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      toast.success('Client added successfully');
      setIsAddDialogOpen(false);
      setNewClient({ name: '', email: '', phone: '', project_type: '', budget: '', template_id: '' });
      fetchClients();
    } catch (error) {
      toast.error('Failed to add client');
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.project_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input 
                  id="name" 
                  value={newClient.name} 
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newClient.email} 
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={newClient.phone} 
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type</Label>
                <Input 
                  id="project_type" 
                  value={newClient.project_type} 
                  onChange={(e) => setNewClient({...newClient, project_type: e.target.value})}
                  placeholder="e.g. Web Development"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input 
                  id="budget" 
                  type="number"
                  value={newClient.budget} 
                  onChange={(e) => setNewClient({...newClient, budget: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Workflow Template (Optional)</Label>
                <select
                  id="template"
                  className="w-full p-2 border rounded-md"
                  value={newClient.template_id}
                  onChange={(e) => setNewClient({...newClient, template_id: e.target.value})}
                >
                  <option value="">No Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">Create Client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading clients...</TableCell>
              </TableRow>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.project_type}</TableCell>
                  <TableCell>
                    <Badge variant={
                      client.status === 'Completed' ? 'default' : 
                      client.status === 'In Progress' ? 'secondary' : 'outline'
                    }>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${Number(client.budget).toLocaleString()}</TableCell>
                  <TableCell>${Number(client.paid_amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clients;
