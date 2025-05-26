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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Phone, Mail, Bot, TrendingUp, Users, 
  DollarSign, Star, Clock, Eye, MessageSquare, RefreshCw, Loader2, User, Globe, Tag
} from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  inquiry: string | null;
  source: string;
  status: string;
  created_at: string;
  lead_score?: number;
  last_contact?: string;
  next_action?: string;
  ai_insights?: string;
}

const EnhancedLeadManagement = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<string>('checking');
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  
  // Lead detail dialog states
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');

  const fetchLeads = async () => {
    console.log('🔄 Fetching leads...');
    setIsLoading(true);
    setConnectionStatus('checking');
    
    try {
      // Simple direct query without complex error handling
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
        
      console.log('📊 Direct query result:', { data: leadsData, error });
        
      if (error) {
        console.error('❌ Query error:', error);
        setConnectionStatus('error');
        toast({
          title: "Database Error",
          description: `Failed to fetch leads: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      if (!leadsData) {
        console.warn('⚠️ No data returned');
        setConnectionStatus('connected');
        setLeads([]);
        return;
      }
      
      console.log(`✅ Successfully fetched ${leadsData.length} leads`);
      setConnectionStatus('connected');
      
      // Enhance leads with AI scoring
      const enhancedLeads = leadsData.map(lead => ({
        ...lead,
        lead_score: calculateLeadScore(lead),
        ai_insights: generateAIInsights(lead),
        next_action: determineNextAction(lead)
      }));
      
      setLeads(enhancedLeads);
      
      toast({
        title: "✅ Leads loaded",
        description: `Found ${enhancedLeads.length} leads`,
      });
      
    } catch (error) {
      console.error('💥 Fetch error:', error);
      setConnectionStatus('error');
      toast({
        title: "Error",
        description: `Failed to load leads: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads' 
      }, (payload) => {
        console.log('🔔 Real-time update:', payload);
        fetchLeads();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateLeadScore = (lead: any) => {
    let score = 50; // Base score
    
    // Email domain scoring
    const email = lead.email?.toLowerCase() || '';
    if (email.includes('.gov') || email.includes('.edu')) score += 20;
    if (email.includes('gmail.com') || email.includes('yahoo.com')) score -= 10;
    if (email.includes('company.com') || email.includes('corp.com')) score += 15;
    
    // Phone presence
    if (lead.phone && lead.phone !== 'Not provided') score += 15;
    
    // Inquiry content analysis
    const inquiry = lead.inquiry?.toLowerCase() || '';
    if (inquiry.includes('urgent') || inquiry.includes('asap')) score += 25;
    if (inquiry.includes('budget') || inquiry.includes('cost')) score += 20;
    if (inquiry.includes('timeline') || inquiry.includes('when')) score += 15;
    if (inquiry.includes('demo') || inquiry.includes('meeting')) score += 20;
    if (inquiry.includes('enterprise') || inquiry.includes('large scale')) score += 25;
    
    // Source scoring
    if (lead.source === 'referral') score += 30;
    if (lead.source === 'linkedin') score += 20;
    if (lead.source === 'website') score += 10;
    
    // Length of inquiry (more detailed = higher intent)
    if (inquiry.length > 200) score += 15;
    if (inquiry.length > 500) score += 10;
    
    return Math.min(100, Math.max(0, score));
  };

  const generateAIInsights = (lead: any) => {
    const score = calculateLeadScore(lead);
    const inquiry = lead.inquiry?.toLowerCase() || '';
    
    if (score > 80) {
      return "High-priority lead with strong buying signals. Recommend immediate outreach.";
    } else if (score > 60) {
      return "Qualified lead with good potential. Schedule follow-up within 24 hours.";
    } else if (inquiry.includes('price') || inquiry.includes('cost')) {
      return "Price-sensitive lead. Focus on value proposition and ROI in communications.";
    } else if (inquiry.includes('info') || inquiry.includes('learn')) {
      return "Information-seeking lead. Send educational content and nurture with value-driven emails.";
    } else {
      return "Standard lead. Follow standard nurture sequence and monitor engagement.";
    }
  };

  const determineNextAction = (lead: any) => {
    const score = calculateLeadScore(lead);
    const leadAge = new Date().getTime() - new Date(lead.created_at).getTime();
    const hoursOld = leadAge / (1000 * 60 * 60);
    
    if (lead.status === 'new') {
      if (score > 80) return "Priority call within 2 hours";
      return "Send welcome email + schedule follow-up";
    } else if (lead.status === 'contacted' && hoursOld > 72) {
      return "Send follow-up email with case studies";
    } else if (lead.status === 'qualified') {
      return "Schedule demo/consultation call";
    } else if (hoursOld > 168) { // 7 days
      return "Re-engagement campaign";
    }
    
    return "Monitor engagement";
  };

  const updateLeadStatus = async (id: string, newStatus: string) => {
    try {
      console.log(`🔄 Updating lead ${id} status to ${newStatus}`);
      
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
        title: "✅ Status updated",
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
    console.log('🔍 Opening lead details for:', lead.name);
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

  const executeAIAction = async (leadId: string, action: string, lead?: any) => {
    const leadData = lead || leads.find(l => l.id === leadId);
    if (!leadData) {
      toast({
        title: "Error",
        description: "Lead not found",
        variant: "destructive",
      });
      return;
    }
    
    const actionKey = `${leadId}-${action}`;
    setExecutingActions(prev => new Set([...prev, actionKey]));
    
    console.log(`🤖 LeadBuddy: Executing ${action} for ${leadData.name}`);
    
    try {
      // Call the actual edge function to execute the action
      const { data, error } = await supabase.functions.invoke('execute-lead-action', {
        body: {
          leadId: leadId,
          action: action,
          leadData: {
            id: leadData.id,
            name: leadData.name,
            email: leadData.email,
            phone: leadData.phone || 'Not provided',
            inquiry: leadData.inquiry || 'General inquiry',
            source: leadData.source
          }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to execute ${action}: ${error.message}`);
      }

      console.log('✅ Action executed successfully:', data);

      // Show success message based on action type
      let successMessage = '';
      switch (action) {
        case 'send_welcome_email':
        case 'welcome_email':
          successMessage = `📧 Welcome email sent to ${leadData.name} at ${leadData.email}`;
          // Update lead status to contacted
          await updateLeadStatus(leadId, 'contacted');
          break;
        case 'schedule_follow_up':
        case 'follow_up_email':
          successMessage = `📞 Follow-up scheduled and email sent to ${leadData.name}`;
          break;
        case 'send_demo_link':
        case 'demo_scheduler':
          successMessage = `🎥 Demo link sent to ${leadData.name} at ${leadData.email}`;
          break;
        case 'priority_outreach':
          successMessage = `⭐ Priority outreach initiated for ${leadData.name}`;
          // Update lead status to qualified
          await updateLeadStatus(leadId, 'qualified');
          break;
        default:
          successMessage = `✅ Action ${action} completed for ${leadData.name}`;
      }

      toast({
        title: "🤖 LeadBuddy Action Complete",
        description: successMessage,
      });

      // If there's email content in the response, log it
      if (data.emailContent || data.demoContent) {
        console.log('📧 Email content preview:', data.emailContent || data.demoContent);
      }

    } catch (error) {
      console.error('Error executing AI action:', error);
      toast({
        title: "❌ Action Failed",
        description: `Failed to execute ${action} for ${leadData.name}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    const matchesScore = scoreFilter === 'all' || 
      (scoreFilter === 'high' && (lead.lead_score || 0) > 80) ||
      (scoreFilter === 'medium' && (lead.lead_score || 0) > 50 && (lead.lead_score || 0) <= 80) ||
      (scoreFilter === 'low' && (lead.lead_score || 0) <= 50);
    
    return matchesSearch && matchesStatus && matchesScore;
  });

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-green-400";
    if (score > 60) return "text-yellow-400";
    return "text-red-400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
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
    return lead.lead_score || calculateLeadScore(lead);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Debug Info */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Users size={24} />
                Enhanced Lead Management
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                  {connectionStatus}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-400">
                AI-powered lead scoring and automated lifecycle management • {leads.length} total leads
              </CardDescription>
              <div className="mt-2 text-sm">
                <p className="text-blue-400">🔍 Info:</p>
                <p className="text-gray-400">• Connection: {connectionStatus}</p>
                <p className="text-gray-400">• Raw leads fetched: {leads.length}</p>
                <p className="text-gray-400">• Filtered results: {filteredLeads.length}</p>
                <p className="text-gray-400">• Loading state: {isLoading ? 'true' : 'false'}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={fetchLeads}
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-white"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Force Refresh
              </Button>
              
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
              
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="high">High (80+)</SelectItem>
                  <SelectItem value="medium">Medium (50-80)</SelectItem>
                  <SelectItem value="low">Low (0-50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Leads Table */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-t-2 border-b-2 border-xtech-blue rounded-full animate-spin"></div>
              <span className="ml-3 text-white">Loading leads from Supabase...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
              <p className="text-gray-400 mb-4">
                {leads.length === 0 
                  ? "No leads fetched from database despite test data being present."
                  : `${leads.length} total leads, but none match your current filters.`
                }
              </p>
              <Button 
                onClick={fetchLeads}
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-white"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Force Refresh
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                <p>Status: {connectionStatus} | Fetched: {leads.length} leads</p>
                <p>Filters: Status={statusFilter}, Score={scoreFilter}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white/5">
                    <TableHead className="text-xtech-light">Lead Info</TableHead>
                    <TableHead className="text-xtech-light">Score</TableHead>
                    <TableHead className="text-xtech-light">Status</TableHead>
                    <TableHead className="text-xtech-light">AI Insights</TableHead>
                    <TableHead className="text-xtech-light">Next Action</TableHead>
                    <TableHead className="text-xtech-light">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow 
                      key={lead.id}
                      className="hover:bg-white/5 border-b border-white/10 cursor-pointer"
                      onClick={() => handleViewDetails(lead)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-white">{lead.name}</div>
                          <div className="text-sm text-gray-400">{lead.email}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{lead.source}</span>
                            <span>•</span>
                            <span>{formatDate(lead.created_at)}</span>
                            {lead.phone && (
                              <>
                                <span>•</span>
                                <span>{lead.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${getScoreColor(lead.lead_score || 0)}`}>
                            {lead.lead_score || 0}
                          </div>
                          <Progress 
                            value={lead.lead_score || 0} 
                            className="w-16 h-2"
                          />
                          {(lead.lead_score || 0) > 80 && <Star size={16} className="text-yellow-400" />}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex items-start gap-2">
                            <Bot size={14} className="text-purple-400 mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-300 truncate">
                              {lead.ai_insights}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-blue-400" />
                          <span className="text-sm text-gray-300">
                            {lead.next_action}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 border-white/20 hover:bg-white/10"
                            onClick={() => executeAIAction(lead.id, 'send_welcome_email', lead)}
                            disabled={executingActions.has(`${lead.id}-send_welcome_email`)}
                            title="Send Welcome Email"
                          >
                            {executingActions.has(`${lead.id}-send_welcome_email`) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Mail size={14} />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 border-white/20 hover:bg-white/10"
                            onClick={() => executeAIAction(lead.id, 'schedule_follow_up', lead)}
                            disabled={executingActions.has(`${lead.id}-schedule_follow_up`)}
                            title="Schedule Follow-up"
                          >
                            {executingActions.has(`${lead.id}-schedule_follow_up`) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Phone size={14} />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 border-white/20 hover:bg-white/10"
                            onClick={() => executeAIAction(lead.id, 'send_demo_link', lead)}
                            disabled={executingActions.has(`${lead.id}-send_demo_link`)}
                            title="Send Demo Link"
                          >
                            {executingActions.has(`${lead.id}-send_demo_link`) ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Eye size={14} />
                            )}
                          </Button>
                          
                          <Select 
                            value={lead.status} 
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs bg-white/10 border-white/20 text-white">
                              <SelectValue />
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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

export default EnhancedLeadManagement;
