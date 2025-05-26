import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Copy, Mail, UserPlus, Trash, Edit } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import EmailDraftDialog from "@/components/admin/EmailDraftDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  inquiry?: string;
  source: string;
  status: string;
  created_at: string;
}

interface EmailData {
  subject: string;
  content: string;
  recipientEmail: string;
  recipientName: string;
}

const EnhancedLeadManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<'welcome' | 'follow_up' | 'demo' | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch leads using react-query
  const { isLoading, error, data: leads, refetch } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching leads:", error);
        throw new Error(error.message);
      }
      return data as Lead[];
    },
  });

  // Mutation for deleting a lead
  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting lead:", error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate the query to refetch leads after deletion
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: "Lead deleted successfully!",
        description: "This lead has been permanently removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenEmailDialog = (lead: Lead, type: 'welcome' | 'follow_up' | 'demo') => {
    setSelectedLead(lead);
    setSelectedEmailType(type);
    setIsEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setIsEmailDialogOpen(false);
    setSelectedLead(null);
    setSelectedEmailType(null);
  };

  const getActionFromEmailType = (type: string) => {
    const actionMap = {
      welcome: 'send_welcome_email',
      follow_up: 'follow_up_email',
      demo: 'send_demo_link'
    };
    return actionMap[type as keyof typeof actionMap] || 'send_welcome_email';
  };

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      console.log('🚀 Sending email with data:', emailData);
      
      // Call the backend with the email data from the dialog
      const { data, error } = await supabase.functions.invoke('execute-lead-action', {
        body: {
          leadId: selectedLead?.id,
          action: getActionFromEmailType(selectedEmailType!),
          leadData: selectedLead,
          previewOnly: false, // This is the actual send
          emailData: emailData // Pass the edited email data
        }
      });

      if (error) throw error;

      console.log('✅ Email sent successfully:', data);
      
      toast({
        title: "Email sent successfully!",
        description: `${selectedEmailType} email sent to ${selectedLead?.name}`,
      });

      // Refresh leads data
      refetch();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Failed to send email",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLead = (id: string) => {
    deleteLeadMutation.mutate(id);
  };

  const filteredLeads = leads?.filter((lead) =>
    lead.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="text-center text-gray-500">Loading leads...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <Input
          type="search"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Inquiry</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>{lead.phone || 'N/A'}</TableCell>
                <TableCell>{lead.inquiry || 'N/A'}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{lead.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleOpenEmailDialog(lead, 'welcome')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Welcome Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEmailDialog(lead, 'follow_up')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Follow-up Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEmailDialog(lead, 'demo')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Demo Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <CopyToClipboard text={JSON.stringify(lead, null, 2)}
                          onCopy={() => toast({ description: "Lead data copied to clipboard." })}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Lead Data
                        </CopyToClipboard>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/20">
                              <Trash className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this lead from our
                                servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteLead(lead.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredLeads?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Email Draft Dialog */}
      <EmailDraftDialog
        isOpen={isEmailDialogOpen}
        onClose={handleCloseEmailDialog}
        onSend={handleSendEmail}
        lead={selectedLead}
        emailType={selectedEmailType}
      />
    </div>
  );
};

export default EnhancedLeadManagement;
