
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, Bot, Mail, Phone, 
  Calendar, Target, Award, Zap
} from 'lucide-react';

const LeadAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalLeads: 156,
    qualifiedLeads: 38,
    convertedLeads: 9,
    avgLeadScore: 67,
    conversionRate: 23.7,
    aiAutomationRate: 89,
    avgResponseTime: 2.3,
    revenueImpact: 45600
  });

  const conversionFunnelData = [
    { stage: 'Captured', count: 156, percentage: 100 },
    { stage: 'Contacted', count: 124, percentage: 79.5 },
    { stage: 'Qualified', count: 38, percentage: 24.4 },
    { stage: 'Demo Scheduled', count: 15, percentage: 9.6 },
    { stage: 'Converted', count: 9, percentage: 5.8 }
  ];

  const leadSourceData = [
    { source: 'Website', count: 65, percentage: 41.7, color: '#8B5CF6' },
    { source: 'LinkedIn', count: 42, percentage: 26.9, color: '#06B6D4' },
    { source: 'Referral', count: 28, percentage: 17.9, color: '#10B981' },
    { source: 'Email', count: 21, percentage: 13.5, color: '#F59E0B' }
  ];

  const weeklyLeadsData = [
    { week: 'Week 1', leads: 32, converted: 2 },
    { week: 'Week 2', leads: 28, converted: 3 },
    { week: 'Week 3', leads: 45, converted: 2 },
    { week: 'Week 4', leads: 51, converted: 2 }
  ];

  const aiPerformanceData = [
    { metric: 'Email Open Rate', ai: 68, manual: 24 },
    { metric: 'Response Rate', ai: 34, manual: 12 },
    { metric: 'Meeting Booking', ai: 23, manual: 8 },
    { metric: 'Conversion Rate', ai: 24, manual: 11 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Lead Analytics & AI Performance</h2>
          <p className="text-gray-400">Comprehensive insights into your lead pipeline and AI automation effectiveness</p>
        </div>
        <Badge className="bg-gradient-to-r from-green-500 to-blue-500">
          <Bot size={16} className="mr-2" />
          AI-Powered Analytics
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalLeads}</div>
            <p className="text-xs text-green-400">+18% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Avg Lead Score</CardTitle>
            <Target className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.avgLeadScore}</div>
            <Progress value={analytics.avgLeadScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.conversionRate}%</div>
            <p className="text-xs text-green-400">+5.2% with AI automation</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">AI Automation</CardTitle>
            <Zap className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.aiAutomationRate}%</div>
            <p className="text-xs text-gray-400">of tasks automated</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Lead Conversion Funnel</CardTitle>
            <CardDescription className="text-gray-400">
              Track leads through each stage of the pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionFunnelData.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{stage.stage}</span>
                    <span className="text-gray-400">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Lead Sources</CardTitle>
            <CardDescription className="text-gray-400">
              Distribution of lead acquisition channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadSourceData.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-white">{source.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{source.count}</div>
                    <div className="text-gray-400 text-sm">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI vs Manual Performance */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bot className="text-purple-400" />
            AI Performance vs Manual Processes
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comparison of AI-automated vs manual lead management metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="metric" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="ai" fill="#8B5CF6" name="AI Automated" />
                <Bar dataKey="manual" fill="#6B7280" name="Manual Process" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Weekly Lead Trends</CardTitle>
          <CardDescription className="text-gray-400">
            Lead capture and conversion trends over the past month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyLeadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#06B6D4" 
                  strokeWidth={3}
                  name="Total Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="converted" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Converted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="text-yellow-400" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="text-green-400 font-medium mb-2">🎯 Best Performing Strategy</h4>
              <p className="text-gray-300 text-sm">
                LinkedIn leads have a 34% higher conversion rate. AI recommends increasing LinkedIn outreach by 40%.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="text-blue-400 font-medium mb-2">⏰ Optimal Contact Time</h4>
              <p className="text-gray-300 text-sm">
                Leads contacted within 2 hours have 87% higher response rates. AI auto-prioritizes new leads.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="text-purple-400 font-medium mb-2">📧 Email Optimization</h4>
              <p className="text-gray-300 text-sm">
                AI-generated subject lines improve open rates by 156%. Personalized content increases clicks by 89%.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-yellow-400 font-medium mb-2">🚀 Growth Opportunity</h4>
              <p className="text-gray-300 text-sm">
                Enterprise inquiries show 45% higher lifetime value. AI suggests creating specialized enterprise workflows.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadAnalytics;
