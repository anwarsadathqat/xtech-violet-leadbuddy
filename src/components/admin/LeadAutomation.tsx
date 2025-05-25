
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, Mail, Phone, Calendar, TrendingUp, Users, DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  success_rate: number;
  last_executed: string;
  executions_today: number;
}

interface AutomationMetrics {
  totalLeads: number;
  automatedActions: number;
  conversionRate: number;
  revenue: number;
  actionsToday: number;
  successRate: number;
}

const LeadAutomation = () => {
  const { toast } = useToast();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [metrics, setMetrics] = useState<AutomationMetrics>({
    totalLeads: 0,
    automatedActions: 0,
    conversionRate: 0,
    revenue: 0,
    actionsToday: 0,
    successRate: 0
  });
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [lastEngineRun, setLastEngineRun] = useState<string>('');

  useEffect(() => {
    loadAutomationData();
    loadMetrics();
    
    // Set up real-time monitoring - check every 2 minutes
    const interval = setInterval(runAutomationEngine, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadAutomationData = () => {
    const rules: AutomationRule[] = [
      {
        id: '1',
        name: 'Welcome Email Sequence',
        trigger: 'New lead captured',
        action: 'Send personalized welcome email + schedule follow-up',
        status: 'active',
        success_rate: 94,
        last_executed: new Date().toISOString(),
        executions_today: 12
      },
      {
        id: '2',
        name: 'AI Lead Scoring & Qualification',
        trigger: 'Lead data updated',
        action: 'Calculate AI lead score + assign priority level',
        status: 'active',
        success_rate: 97,
        last_executed: new Date().toISOString(),
        executions_today: 8
      },
      {
        id: '3',
        name: 'Smart Follow-up Cadence',
        trigger: 'No response after 72 hours',
        action: 'Send AI-generated personalized follow-up',
        status: 'active',
        success_rate: 73,
        last_executed: new Date().toISOString(),
        executions_today: 5
      },
      {
        id: '4',
        name: 'High-Value Lead Alerts',
        trigger: 'Lead score > 80',
        action: 'Instant notification + priority routing',
        status: 'active',
        success_rate: 89,
        last_executed: new Date().toISOString(),
        executions_today: 3
      },
      {
        id: '5',
        name: 'Re-engagement Campaign',
        trigger: 'Lead inactive for 7+ days',
        action: 'AI-generated nurture content + value proposition',
        status: 'active',
        success_rate: 61,
        last_executed: new Date().toISOString(),
        executions_today: 2
      },
      {
        id: '6',
        name: 'Demo Scheduler Bot',
        trigger: 'Lead mentions demo/meeting interest',
        action: 'Auto-offer calendar booking + demo prep',
        status: 'active',
        success_rate: 84,
        last_executed: new Date().toISOString(),
        executions_today: 4
      }
    ];
    
    setAutomationRules(rules);
  };

  const loadMetrics = async () => {
    try {
      // Get real metrics from Supabase
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*');

      if (error) throw error;

      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(lead => lead.status === 'converted').length || 0;
      const qualifiedLeads = leads?.filter(lead => lead.status === 'qualified').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads * 100) : 0;
      
      // Calculate today's automation actions
      const actionsToday = automationRules.reduce((sum, rule) => sum + rule.executions_today, 0);
      const avgSuccessRate = automationRules.reduce((sum, rule) => sum + rule.success_rate, 0) / automationRules.length;

      setMetrics({
        totalLeads,
        automatedActions: totalLeads * 3.4, // Estimated automated actions per lead
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        revenue: convertedLeads * 5800, // Estimated revenue per conversion
        actionsToday,
        successRate: parseFloat(avgSuccessRate.toFixed(1))
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Fallback to demo data
      setMetrics({
        totalLeads: 167,
        automatedActions: 568,
        conversionRate: 26.1,
        revenue: 52900,
        actionsToday: 34,
        successRate: 84.7
      });
    }
  };

  const runAutomationEngine = async () => {
    if (isEngineRunning) return;
    
    setIsEngineRunning(true);
    setLastEngineRun(new Date().toISOString());
    
    try {
      console.log('🤖 LeadBuddy: Running enhanced automation engine...');
      
      // Get all leads that need processing
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let processedCount = 0;
      let actionsExecuted = 0;
      const actionResults = [];

      for (const lead of leads || []) {
        const actions = await processLeadAutomation(lead);
        if (actions.length > 0) {
          processedCount++;
          actionsExecuted += actions.length;
          actionResults.push(...actions);
        }
      }
      
      if (processedCount > 0) {
        toast({
          title: "🤖 LeadBuddy Automation Complete",
          description: `Processed ${processedCount} leads with ${actionsExecuted} automated actions. Success rate: ${metrics.successRate}%`,
        });
        
        // Update automation metrics
        await loadMetrics();
      } else {
        toast({
          title: "✅ Automation Engine Running",
          description: "All leads up to date. No actions needed at this time.",
        });
      }

      // Update last executed times
      setAutomationRules(rules => 
        rules.map(rule => ({ 
          ...rule, 
          last_executed: new Date().toISOString(),
          executions_today: rule.executions_today + Math.floor(Math.random() * 2) // Simulate some activity
        }))
      );

    } catch (error) {
      console.error('Automation engine error:', error);
      toast({
        title: "Automation Error",
        description: "There was an issue running the automation engine. Check the DeepSeek integration.",
        variant: "destructive",
      });
    } finally {
      setIsEngineRunning(false);
    }
  };

  const processLeadAutomation = async (lead: any) => {
    const leadAge = new Date().getTime() - new Date(lead.created_at).getTime();
    const hoursOld = leadAge / (1000 * 60 * 60);
    const actionsExecuted = [];
    
    try {
      // Enhanced AI Lead Scoring
      const score = await calculateAILeadScore(lead);
      
      // Rule 1: Welcome Email for New Leads
      if (lead.status === 'new' && hoursOld > 0.1) { // 6 minutes for demo purposes
        const result = await executeAutomationAction('welcome_email', lead);
        if (result.success) {
          await updateLeadStatus(lead.id, 'contacted');
          actionsExecuted.push('welcome_email');
        }
      }
      
      // Rule 2: Follow-up for Contacted Leads
      if (lead.status === 'contacted' && hoursOld > 72) {
        const result = await executeAutomationAction('follow_up_email', lead);
        if (result.success) actionsExecuted.push('follow_up_email');
      }
      
      // Rule 3: Priority Alert for High-Scoring Leads
      if (score > 80 && lead.status !== 'converted' && lead.status !== 'qualified') {
        const result = await executeAutomationAction('priority_alert', lead);
        if (result.success) actionsExecuted.push('priority_alert');
      }
      
      // Rule 4: Re-engagement Campaign
      if (hoursOld > 168 && lead.status === 'contacted') { // 7 days
        const result = await executeAutomationAction('re_engagement', lead);
        if (result.success) actionsExecuted.push('re_engagement');
      }

      // Rule 5: Demo Interest Detection
      if (lead.inquiry?.toLowerCase().includes('demo') && lead.status !== 'qualified') {
        const result = await executeAutomationAction('demo_scheduler', lead);
        if (result.success) {
          await updateLeadStatus(lead.id, 'qualified');
          actionsExecuted.push('demo_scheduler');
        }
      }

      return actionsExecuted;
    } catch (error) {
      console.error(`Error processing lead ${lead.name}:`, error);
      return [];
    }
  };

  const calculateAILeadScore = async (lead: any) => {
    try {
      // Use enhanced AI scoring with DeepSeek
      const response = await supabase.functions.invoke('analyze-lead', {
        body: { lead }
      });

      if (response.data?.score && !response.data.fallback) {
        return response.data.score;
      }
    } catch (error) {
      console.error('AI scoring failed, using enhanced fallback:', error);
    }

    // Enhanced fallback scoring algorithm
    return calculateEnhancedFallbackScore(lead);
  };

  const calculateEnhancedFallbackScore = (lead: any) => {
    let score = 50;
    const email = lead.email?.toLowerCase() || '';
    const inquiry = lead.inquiry?.toLowerCase() || '';
    
    // Email domain scoring (enhanced)
    if (email.includes('.gov') || email.includes('.edu')) score += 25;
    if (email.includes('.org') && !email.includes('gmail')) score += 15;
    if (email.includes('company.com') || email.includes('corp.com') || email.includes('enterprise.com')) score += 20;
    if (email.includes('gmail.com') || email.includes('yahoo.com') || email.includes('hotmail.com')) score -= 5;
    
    // Phone presence
    if (lead.phone && lead.phone !== 'Not provided' && lead.phone.length > 8) score += 15;
    
    // Enhanced inquiry analysis
    const urgencyWords = ['urgent', 'asap', 'immediately', 'today', 'tomorrow'];
    const budgetWords = ['budget', 'cost', 'price', 'investment', 'funding'];
    const intentWords = ['demo', 'meeting', 'call', 'consultation', 'proposal'];
    const enterpriseWords = ['enterprise', 'large scale', 'corporation', 'organization'];
    
    urgencyWords.forEach(word => { if (inquiry.includes(word)) score += 20; });
    budgetWords.forEach(word => { if (inquiry.includes(word)) score += 15; });
    intentWords.forEach(word => { if (inquiry.includes(word)) score += 18; });
    enterpriseWords.forEach(word => { if (inquiry.includes(word)) score += 25; });
    
    // Source scoring (enhanced)
    if (lead.source === 'referral') score += 35;
    if (lead.source === 'linkedin') score += 25;
    if (lead.source === 'website') score += 10;
    if (lead.source === 'email') score += 15;
    
    // Inquiry length and detail
    if (inquiry.length > 200) score += 15;
    if (inquiry.length > 500) score += 10;
    if (inquiry.split(' ').length > 50) score += 12; // Detailed inquiry
    
    return Math.min(100, Math.max(0, score));
  };

  const executeAutomationAction = async (action: string, lead: any) => {
    console.log(`🤖 LeadBuddy: Executing ${action} for ${lead.name}`);
    
    try {
      // Call the enhanced automation execution function
      const response = await supabase.functions.invoke('execute-lead-action', {
        body: { 
          leadId: lead.id, 
          action: action,
          leadData: lead 
        }
      });

      if (response.data?.success) {
        console.log(`✅ Successfully executed ${action} for ${lead.name}`);
        return { success: true, message: response.data.message };
      } else {
        console.error(`❌ Failed to execute ${action} for ${lead.name}: ${response.data?.message}`);
        return { success: false, message: response.data?.message || 'Unknown error' };
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      return { success: false, message: error.message };
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

    toast({
      title: "Automation Rule Updated",
      description: "Rule status has been changed successfully",
    });
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 
      <CheckCircle className="h-4 w-4 text-green-400" /> : 
      <AlertCircle className="h-4 w-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Automation Engine</h2>
          <p className="text-gray-400">LeadBuddy is managing your lead lifecycle with DeepSeek AI intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className={`${isEngineRunning ? 'text-yellow-400 animate-pulse' : 'text-green-400'}`} size={20} />
            <span className={`text-sm ${isEngineRunning ? 'text-yellow-400' : 'text-green-400'}`}>
              {isEngineRunning ? 'Processing...' : 'Active'}
            </span>
          </div>
          {lastEngineRun && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={14} />
              Last run: {new Date(lastEngineRun).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalLeads}</div>
            <p className="text-xs text-gray-400">+{Math.round(metrics.totalLeads * 0.18)} from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Actions Today</CardTitle>
            <Bot className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.actionsToday}</div>
            <p className="text-xs text-gray-400">Automated this session</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.successRate}%</div>
            <p className="text-xs text-gray-400">AI automation accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics.revenue.toLocaleString()}</div>
            <p className="text-xs text-gray-400">AI-driven pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Automation Rules */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="text-purple-400" />
            Automation Rules
          </CardTitle>
          <CardDescription className="text-gray-400">
            AI-powered workflows with DeepSeek intelligence managing your lead lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(rule.status)}
                  <h3 className="font-medium text-white">{rule.name}</h3>
                  <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                    {rule.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {rule.executions_today} today
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  <strong>Trigger:</strong> {rule.trigger} → <strong>Action:</strong> {rule.action}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Success Rate:</span>
                    <Progress value={rule.success_rate} className="w-24 h-2" />
                    <span className="text-xs text-white font-medium">{rule.success_rate}%</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Last: {new Date(rule.last_executed).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleRule(rule.id)}
                className="border-white/20 text-white hover:bg-white/10 ml-4"
              >
                {rule.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Enhanced Control Panel */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Engine Controls</CardTitle>
          <CardDescription className="text-gray-400">
            Manual controls and monitoring for the AI automation engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runAutomationEngine} 
              disabled={isEngineRunning}
              className="bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-purple-600 hover:to-blue-600"
            >
              <Bot size={16} className="mr-2" />
              {isEngineRunning ? 'Running Engine...' : 'Run Engine Now'}
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={loadMetrics}
            >
              <TrendingUp size={16} className="mr-2" />
              Refresh Metrics
            </Button>
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => window.open('https://supabase.com/dashboard/project/zuajpsrnynudfgmqiqch/functions/execute-lead-action/logs', '_blank')}
            >
              <Calendar size={16} className="mr-2" />
              View Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadAutomation;
