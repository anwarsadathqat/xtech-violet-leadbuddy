
import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmailDraftDialog from "@/components/admin/EmailDraftDialog";
import LeadCard from "@/components/admin/LeadCard";
import LeadDetailsDialog from "@/components/admin/LeadDetailsDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Users, Filter } from 'lucide-react';

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
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<'welcome' | 'follow_up' | 'demo' | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Fetch leads using react-query
  const { isLoading, error, data: leads, refetch } = useQuery({
    queryKey: ['leads', search, statusFilter, sourceFilter],
    queryFn: async () => {
      console.log('🔍 Fetching leads with filters:', { search, statusFilter, sourceFilter });
      
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching leads:", error);
        throw new Error(error.message);
      }
      
      console.log('✅ Leads fetched:', data?.length || 0);
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

  const handleViewDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setIsDetailsDialogOpen(false);
    setSelectedLead(null);
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
      
      const { data, error } = await supabase.functions.invoke('execute-lead-action', {
        body: {
          leadId: selectedLead?.id,
          action: getActionFromEmailType(selectedEmailType!),
          leadData: selectedLead,
          previewOnly: false,
          emailData: emailData
        }
      });

      if (error) throw error;

      console.log('✅ Email sent successfully:', data);
      
      toast({
        title: "Email sent successfully!",
        description: `${selectedEmailType} email sent to ${selectedLead?.name}`,
      });

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

  const filteredLeads = leads || [];
  const totalLeads = filteredLeads.length;
  const rawLeads = leads?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-xtech-blue" />
          <span className="text-gray-300">Loading leads...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Error: {error.message}</div>
        <Button onClick={() => refetch()} variant="outline" className="border-white/20">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-xtech-blue" />
            <h1 className="text-2xl font-bold text-white">Enhanced Lead Management</h1>
            <span className="bg-xtech-blue/20 text-xtech-blue px-2 py-1 rounded text-sm">connected</span>
          </div>
        </div>
        
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Force Refresh
        </Button>
      </div>

      {/* Debug Info */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="text-sm text-gray-400 space-y-1">
          <p>🔍 <strong>Debug Info:</strong></p>
          <p>• Connection: connected</p>
          <p>• Raw leads fetched: {rawLeads}</p>
          <p>• Filtered results: {totalLeads}</p>
          <p>• Loading state: {isLoading ? 'true' : 'false'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-xtech-dark-purple border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent className="bg-xtech-dark-purple border-white/10">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social">Social Media</SelectItem>
              <SelectItem value="email">Email Campaign</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads Grid */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No leads found</h3>
            <p className="text-gray-400 mb-6">
              {rawLeads === 0 
                ? "No leads fetched from database despite test data being present."
                : "No leads match your current filters."
              }
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Force Refresh
            </Button>
            <div className="mt-4 text-sm text-gray-500">
              Status: connected | Fetched: {rawLeads} leads<br />
              Filters: Status={statusFilter}, Score=all
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onViewDetails={handleViewDetails}
                onSendEmail={handleOpenEmailDialog}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Email Draft Dialog */}
      <EmailDraftDialog
        isOpen={isEmailDialogOpen}
        onClose={handleCloseEmailDialog}
        onSend={handleSendEmail}
        lead={selectedLead}
        emailType={selectedEmailType}
      />

      {/* Lead Details Dialog */}
      <LeadDetailsDialog
        lead={selectedLead}
        isOpen={isDetailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        onSendEmail={handleOpenEmailDialog}
      />
    </div>
  );
};

export default EnhancedLeadManagement;
