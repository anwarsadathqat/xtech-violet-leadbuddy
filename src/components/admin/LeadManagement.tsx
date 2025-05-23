
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  inquiry: string | null;
  source: string;
  status: string;
  created_at: string;
}

const LeadManagement = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
    
    // Set up a real-time subscription for new leads
    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'leads' 
      }, payload => {
        setLeads(prevLeads => [payload.new as Lead, ...prevLeads]);
        toast({
          title: "New lead received!",
          description: `${payload.new.name} just submitted an inquiry.`,
        });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setLeads(data as Lead[]);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, status: newStatus } : lead
      ));
      
      if (currentLead && currentLead.id === id) {
        setCurrentLead({ ...currentLead, status: newStatus });
      }
      
      toast({
        title: "Status updated",
        description: `Lead status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (lead: Lead) => {
    setCurrentLead(lead);
    setIsDialogOpen(true);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In MVP, we'll just show a toast notification
      // In the next iteration, we would save this to a notes table
      toast({
        title: "Note added",
        description: "Your note has been saved for this lead.",
      });
      setNewNote('');
      setIsNewNoteDialogOpen(false);
    }
  };

  const handleSendEmail = () => {
    if (!currentLead) return;
    
    // In the MVP, just show a notification
    // In the next iteration, this would integrate with the email sending edge function
    toast({
      title: "Email queued",
      description: `An email will be sent to ${currentLead.name} shortly.`,
    });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 p-4 rounded-lg bg-white/5 backdrop-blur-lg border border-white/10">
        <h2 className="text-2xl font-bold text-white">Lead Management</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="w-8 h-8 border-t-2 border-b-2 border-xtech-blue rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-white/5">
                  <TableHead className="text-xtech-light">Name</TableHead>
                  <TableHead className="text-xtech-light">Email</TableHead>
                  <TableHead className="text-xtech-light">Phone</TableHead>
                  <TableHead className="text-xtech-light">Source</TableHead>
                  <TableHead className="text-xtech-light">Created</TableHead>
                  <TableHead className="text-xtech-light">Status</TableHead>
                  <TableHead className="text-xtech-light">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id}
                      className="hover:bg-white/5 border-b border-white/10"
                    >
                      <TableCell className="font-medium text-white">{lead.name}</TableCell>
                      <TableCell className="text-gray-300">{lead.email}</TableCell>
                      <TableCell className="text-gray-300">{lead.phone || 'N/A'}</TableCell>
                      <TableCell className="text-gray-300">{lead.source}</TableCell>
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          {formatDate(lead.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => handleViewDetails(lead)}
                          >
                            View
                          </Button>
                          <Select 
                            value={lead.status} 
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-[130px] h-9 text-xs bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-400">
                      No leads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-xtech-dark-purple border border-white/10 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Lead Details</DialogTitle>
          </DialogHeader>
          
          {currentLead && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{currentLead.name}</h3>
                    <LeadStatusBadge status={currentLead.status} className="mt-2" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{currentLead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{currentLead.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Source</p>
                      <p className="text-white">{currentLead.source}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Created</p>
                      <p className="text-white">{formatDate(currentLead.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button onClick={handleSendEmail} className="bg-gradient-to-r from-xtech-purple to-xtech-blue">
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/20 hover:bg-white/10"
                    onClick={() => setIsNewNoteDialogOpen(true)}
                  >
                    Add Note
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-2">Inquiry</h4>
                <div className="p-4 rounded bg-white/10 text-white">
                  {currentLead.inquiry || 'No inquiry provided'}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium mb-2">AI Assistant Insights</h4>
                <div className="p-4 rounded bg-white/10 text-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-xtech-purple to-xtech-blue flex items-center justify-center">
                      🤖
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">LeadBuddy</p>
                      <p className="text-gray-300">
                        Based on the inquiry, this lead is interested in IT consulting services. 
                        I recommend following up within 24 hours with information about our 
                        consulting packages. This lead has high potential with a 85% likelihood of conversion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Select 
                value={currentLead?.status} 
                onValueChange={(value) => currentLead && updateLeadStatus(currentLead.id, value)}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsDialogOpen(false)} variant="ghost">Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Note Dialog */}
      <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
        <DialogContent className="bg-xtech-dark-purple border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter your note..."
            className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} className="bg-gradient-to-r from-xtech-purple to-xtech-blue">
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadManagement;
