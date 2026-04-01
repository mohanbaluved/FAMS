import React, { useEffect, useState } from 'react';
import api from '../lib/api';
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
import { DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { toast } from 'sonner';

const Payments = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/payments');
        setPayments(response.data);
      } catch (error) {
        toast.error('Failed to fetch payments');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
            <ArrowDownLeft className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-bold">$10,000</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <ArrowUpRight className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending Invoices</p>
            <p className="text-2xl font-bold">$3,500</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Ticket</p>
            <p className="text-2xl font-bold">$2,500</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading payments...</TableCell>
              </TableRow>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">#PAY-{payment.id}00{payment.id}</TableCell>
                  <TableCell>{payment.client_name}</TableCell>
                  <TableCell className="font-medium">${Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'Paid' ? 'default' : 'outline'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View Receipt</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Payments;
