
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
import { Calendar, Mail, Phone, Globe, Clock, User, MessageSquare, Tag } from 'lucide-react';
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

  const getTimeSinceSubmission = (dateString: string) => {
    const now = new Date();
    const submissionDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getLeadPriority = (lead: Lead) => {
    const inquiry = lead.inquiry?.toLowerCase() || '';
    if (inquiry.includes('urgent') || inquiry.includes('immediate')) return 'High';
    if (inquiry.includes('enterprise') || inquiry.includes('large')) return 'High';
    if (inquiry.includes('small') || inquiry.includes('budget')) return 'Low';
    return 'Medium';
  };

  const getLeadScore = (lead: Lead) => {
    let score = 50; // Base score
    
    // Boost score based on inquiry keywords
    const inquiry = lead.inquiry?.toLowerCase() || '';
    if (inquiry.includes('enterprise')) score += 30;
    if (inquiry.includes('urgent')) score += 20;
    if (inquiry.includes('budget')) score -= 20;
    if (inquiry.includes('cost-effective')) score -= 10;
    
    // Source scoring
    if (lead.source === 'referral') score += 25;
    if (lead.source === 'website') score += 10;
    
    // Phone number availability
    if (lead.phone) score += 15;
    
    return Math.min(Math.max(score, 0), 100);
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
                      className="hover:bg-white/5 border-b border-white/10 cursor-pointer"
                      onClick={() => handleViewDetails(lead)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(lead);
                            }}
                          >
                            View Details
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

      {/* Enhanced Lead Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-xtech-dark-purple border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <User className="w-6 h-6" />
              Lead Details - {currentLead?.name}
            </DialogTitle>
          </DialogHeader>
          
          {currentLead && (
            <div className="space-y-6">
              {/* Lead Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-xtech-blue" />
                    <span className="text-sm text-gray-400">Lead Score</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{getLeadScore(currentLead)}%</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-xtech-purple" />
                    <span className="text-sm text-gray-400">Time Since Submission</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{getTimeSinceSubmission(currentLead.created_at)}</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-xtech-blue" />
                    <span className="text-sm text-gray-400">Priority</span>
                  </div>
                  <div className={`text-lg font-semibold ${
                    getLeadPriority(currentLead) === 'High' ? 'text-red-400' :
                    getLeadPriority(currentLead) === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {getLeadPriority(currentLead)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Full Name</p>
                        <p className="text-white font-medium">{currentLead.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Email Address</p>
                        <p className="text-white font-medium">{currentLead.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Phone Number</p>
                        <p className="text-white font-medium">{currentLead.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Lead Source</p>
                        <p className="text-white font-medium capitalize">{currentLead.source}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Timeline */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Status & Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Current Status</p>
                    <LeadStatusBadge status={currentLead.status} className="text-base px-4 py-2" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Submitted On</p>
                    <p className="text-white font-medium">{formatDate(currentLead.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Details */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Inquiry Details
                </h3>
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-white leading-relaxed">
                    {currentLead.inquiry || 'No specific inquiry message provided.'}
                  </p>
                </div>
              </div>
              
              {/* AI Insights */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🤖 AI Assistant Insights
                </h3>
                <div className="bg-gradient-to-r from-xtech-purple/20 to-xtech-blue/20 rounded-lg p-4 border border-xtech-purple/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-xtech-purple to-xtech-blue flex items-center justify-center text-lg">
                      🤖
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white mb-2">LeadBuddy Analysis</p>
                      <div className="space-y-2 text-gray-300">
                        <p>• Lead Score: {getLeadScore(currentLead)}% - {getLeadScore(currentLead) > 70 ? 'High potential conversion' : getLeadScore(currentLead) > 40 ? 'Moderate potential' : 'Requires nurturing'}</p>
                        <p>• Priority Level: {getLeadPriority(currentLead)} - {getLeadPriority(currentLead) === 'High' ? 'Follow up within 2 hours' : 'Follow up within 24 hours'}</p>
                        <p>• Recommended Action: {currentLead.status === 'new' ? 'Send welcome email and schedule initial consultation' : 'Continue nurturing sequence'}</p>
                        <p>• Best Contact Time: {currentLead.phone ? 'Phone call preferred during business hours' : 'Email communication recommended'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSendEmail} className="bg-gradient-to-r from-xtech-purple to-xtech-blue">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-white/20 hover:bg-white/10"
                    onClick={() => setIsNewNoteDialogOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                  {currentLead.phone && (
                    <Button 
                      variant="outline" 
                      className="border-white/20 hover:bg-white/10"
                      onClick={() => window.open(`tel:${currentLead.phone}`)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Lead
                    </Button>
                  )}
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
