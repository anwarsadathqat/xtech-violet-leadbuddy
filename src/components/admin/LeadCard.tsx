
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Eye, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

interface LeadCardProps {
  lead: Lead;
  onViewDetails: (lead: Lead) => void;
  onSendEmail: (lead: Lead, type: 'welcome' | 'follow_up' | 'demo') => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onViewDetails, onSendEmail }) => {
  // Calculate AI score based on inquiry keywords and completeness
  const calculateLeadScore = (lead: Lead) => {
    let score = 0;
    
    // Contact completeness
    if (lead.email) score += 20;
    if (lead.phone) score += 15;
    if (lead.name) score += 10;
    
    // Source quality
    if (lead.source === 'referral') score += 25;
    else if (lead.source === 'website') score += 15;
    else if (lead.source === 'social') score += 10;
    
    // Inquiry quality
    if (lead.inquiry) {
      const highValueKeywords = ['enterprise', 'budget', 'urgent', 'project', 'team', 'migrate', 'scale'];
      const inquiryLower = lead.inquiry.toLowerCase();
      const keywordMatches = highValueKeywords.filter(keyword => inquiryLower.includes(keyword));
      score += keywordMatches.length * 5;
      
      if (lead.inquiry.length > 50) score += 10;
    }
    
    return Math.min(score, 100);
  };

  // Determine priority based on score and other factors
  const getPriority = (score: number, source: string, inquiry?: string) => {
    if (score >= 70 || source === 'referral') return 'high';
    if (score >= 40 || (inquiry && inquiry.length > 100)) return 'medium';
    return 'low';
  };

  const score = calculateLeadScore(lead);
  const priority = getPriority(score, lead.source, lead.inquiry);
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card 
      className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails(lead)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white group-hover:text-xtech-blue transition-colors">
                {lead.name}
              </h3>
              <Badge className={`border ${getPriorityColor(priority)}`}>
                {priority.toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-400 text-sm">{lead.email}</p>
            {lead.phone && (
              <p className="text-gray-400 text-sm">{lead.phone}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className={`font-bold ${getScoreColor(score)}`}>{score}</span>
              </div>
              <p className="text-xs text-gray-500">AI Score</p>
            </div>
            
            <Badge variant="secondary" className="bg-white/10 text-gray-300">
              {lead.status}
            </Badge>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{timeAgo}</span>
            <span className="text-xs text-gray-500">• {lead.source}</span>
          </div>
          
          {lead.inquiry && (
            <p className="text-sm text-gray-300 line-clamp-2">
              {lead.inquiry.length > 100 ? `${lead.inquiry.substring(0, 100)}...` : lead.inquiry}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                onSendEmail(lead, 'welcome');
              }}
            >
              <Mail className="w-3 h-3 mr-1" />
              Email
            </Button>
            
            {lead.phone && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${lead.phone}`);
                }}
              >
                <Phone className="w-3 h-3 mr-1" />
                Call
              </Button>
            )}
          </div>
          
          <Button
            size="sm"
            className="bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(lead);
            }}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadCard;
