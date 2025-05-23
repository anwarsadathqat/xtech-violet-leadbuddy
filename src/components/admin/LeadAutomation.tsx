
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Mail, Phone, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  success_rate: number;
  last_executed: string;
}

interface LeadScore {
  lead_id: string;
  score: number;
  factors: string[];
  updated_at: string;
}

const LeadAutomation = () => {
  const { toast } = useToast();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    automatedActions: 0,
    conversionRate: 0,
    revenue: 0
  });

  useEffect(() => {
    loadAutomationData();
    // Set up real-time monitoring
    const interval = setInterval(runAutomationEngine, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAutomationData = () => {
    // Simulated automation rules for MVP
    const rules: AutomationRule[] = [
      {
        id: '1',
        name: 'Welcome Email Sequence',
        trigger: 'New lead captured',
        action: 'Send welcome email + schedule follow-up',
        status: 'active',
        success_rate: 85,
        last_executed: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Lead Scoring & Qualification',
        trigger: 'Lead data updated',
        action: 'Calculate lead score + assign priority',
        status: 'active',
        success_rate: 92,
        last_executed: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Follow-up Cadence',
        trigger: 'No response after 3 days',
        action: 'Send personalized follow-up',
        status: 'active',
        success_rate: 67,
        last_executed: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Meeting Scheduler',
        trigger: 'Lead shows high interest',
        action: 'Offer calendar booking link',
        status: 'active',
        success_rate: 78,
        last_executed: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Nurture Campaign',
        trigger: 'Lead goes cold (7+ days)',
        action: 'Start educational content drip',
        status: 'active',
        success_rate: 54,
        last_executed: new Date().toISOString()
      }
    ];
    
    setAutomationRules(rules);
    
    // Load metrics
    setMetrics({
      totalLeads: 156,
      automatedActions: 432,
      conversionRate: 24.3,
      revenue: 45600
    });
  };

  const runAutomationEngine = async () => {
    try {
      console.log('🤖 LeadBuddy: Running automation engine...');
      
      // Get all leads
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      for (const lead of leads || []) {
        await processLeadAutomation(lead);
      }
      
      toast({
        title: "🤖 LeadBuddy Active",
        description: `Processed ${leads?.length || 0} leads automatically`,
      });
    } catch (error) {
      console.error('Automation engine error:', error);
    }
  };

  const processLeadAutomation = async (lead: any) => {
    const leadAge = new Date().getTime() - new Date(lead.created_at).getTime();
    const hoursOld = leadAge / (1000 * 60 * 60);
    
    // Lead Scoring
    const score = calculateLeadScore(lead);
    
    // Automated Actions Based on Lead Status and Age
    if (lead.status === 'new' && hoursOld > 0.5) {
      await executeAutomation('welcome_email', lead);
      await updateLeadStatus(lead.id, 'contacted');
    }
    
    if (lead.status === 'contacted' && hoursOld > 72) {
      await executeAutomation('follow_up', lead);
    }
    
    if (score > 80 && lead.status !== 'converted') {
      await executeAutomation('priority_outreach', lead);
    }
    
    if (hoursOld > 168 && lead.status === 'contacted') { // 7 days
      await executeAutomation('nurture_campaign', lead);
    }
  };

  const calculateLeadScore = (lead: any) => {
    let score = 50; // Base score
    
    // Email domain scoring
    if (lead.email?.includes('.gov') || lead.email?.includes('.edu')) score += 20;
    if (lead.email?.includes('gmail.com') || lead.email?.includes('yahoo.com')) score -= 10;
    
    // Phone presence
    if (lead.phone) score += 15;
    
    // Inquiry content analysis (simplified)
    if (lead.inquiry?.toLowerCase().includes('urgent')) score += 25;
    if (lead.inquiry?.toLowerCase().includes('budget')) score += 20;
    if (lead.inquiry?.toLowerCase().includes('timeline')) score += 15;
    
    // Source scoring
    if (lead.source === 'referral') score += 30;
    if (lead.source === 'linkedin') score += 20;
    
    return Math.min(100, Math.max(0, score));
  };

  const executeAutomation = async (action: string, lead: any) => {
    console.log(`🤖 LeadBuddy: Executing ${action} for ${lead.name}`);
    
    // In a real implementation, this would trigger actual emails, SMS, etc.
    // For MVP, we'll simulate the actions
    
    switch (action) {
      case 'welcome_email':
        console.log(`📧 Sending welcome email to ${lead.email}`);
        break;
      case 'follow_up':
        console.log(`📞 Scheduling follow-up for ${lead.name}`);
        break;
      case 'priority_outreach':
        console.log(`⭐ High-priority outreach for ${lead.name}`);
        break;
      case 'nurture_campaign':
        console.log(`🌱 Starting nurture campaign for ${lead.name}`);
        break;
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const toggleRule = (ruleId: string) => {
    setAutomationRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: rule.status === 'active' ? 'paused' : 'active' }
          : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Automation Engine</h2>
          <p className="text-gray-400">LeadBuddy is managing your lead lifecycle automatically</p>
        </div>
        <div className="flex items-center gap-2">
          <Bot className="text-green-400" size={20} />
          <span className="text-green-400 text-sm">Active</span>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalLeads}</div>
            <p className="text-xs text-gray-400">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Automated Actions</CardTitle>
            <Bot className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.automatedActions}</div>
            <p className="text-xs text-gray-400">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.conversionRate}%</div>
            <p className="text-xs text-gray-400">+3.2% with AI</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics.revenue.toLocaleString()}</div>
            <p className="text-xs text-gray-400">AI-driven revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Automation Rules</CardTitle>
          <CardDescription className="text-gray-400">
            AI-powered workflows managing your lead lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-white">{rule.name}</h3>
                  <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                    {rule.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  <strong>Trigger:</strong> {rule.trigger} → <strong>Action:</strong> {rule.action}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Success Rate:</span>
                    <Progress value={rule.success_rate} className="w-20 h-2" />
                    <span className="text-xs text-white">{rule.success_rate}%</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Last run: {new Date(rule.last_executed).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRule(rule.id)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {rule.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">
            Manual controls for the automation engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={runAutomationEngine} className="bg-gradient-to-r from-xtech-purple to-xtech-blue">
              <Bot size={16} className="mr-2" />
              Run Engine Now
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Mail size={16} className="mr-2" />
              Bulk Email Campaign
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Calendar size={16} className="mr-2" />
              Schedule Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadAutomation;
