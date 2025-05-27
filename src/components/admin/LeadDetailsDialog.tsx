
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Brain,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

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

interface LeadDetailsDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (lead: Lead, type: 'welcome' | 'follow_up' | 'demo') => void;
}

const LeadDetailsDialog: React.FC<LeadDetailsDialogProps> = ({
  lead,
  isOpen,
  onClose,
  onSendEmail
}) => {
  if (!lead) return null;

  // Calculate AI insights
  const getAIInsights = (lead: Lead) => {
    const insights = [];
    
    if (lead.inquiry) {
      const inquiryLower = lead.inquiry.toLowerCase();
      
      if (inquiryLower.includes('enterprise') || inquiryLower.includes('scale')) {
        insights.push({
          type: 'high-value',
          message: 'High-value opportunity detected - mentions enterprise/scaling needs',
          icon: TrendingUp,
          color: 'text-green-400'
        });
      }
      
      if (inquiryLower.includes('urgent') || inquiryLower.includes('asap')) {
        insights.push({
          type: 'urgent',
          message: 'Urgent inquiry - quick response recommended',
          icon: AlertCircle,
          color: 'text-red-400'
        });
      }
      
      if (inquiryLower.includes('budget')) {
        insights.push({
          type: 'budget-ready',
          message: 'Budget discussion mentioned - good conversion potential',
          icon: CheckCircle,
          color: 'text-blue-400'
        });
      }
    }
    
    if (lead.source === 'referral') {
      insights.push({
        type: 'referral',
        message: 'Referral lead - higher conversion probability',
        icon: TrendingUp,
        color: 'text-green-400'
      });
    }
    
    if (!insights.length) {
      insights.push({
        type: 'standard',
        message: 'Standard lead - follow up within 24 hours',
        icon: Clock,
        color: 'text-gray-400'
      });
    }
    
    return insights;
  };

  const insights = getAIInsights(lead);
  const timeAgo = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true });
  const fullDate = format(new Date(lead.created_at), 'PPP at p');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-xtech-dark-purple border border-white/10 text-white max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            Lead Details: {lead.name}
            <Badge variant="secondary" className="bg-white/10 text-gray-300">
              {lead.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-xtech-blue" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{lead.email}</span>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{lead.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Source: {lead.source}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-xtech-blue" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Submitted {timeAgo}</span>
                </div>
                <div className="text-xs text-gray-500">{fullDate}</div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Inquiry Details */}
            {lead.inquiry && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Inquiry Details</h3>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-gray-300 leading-relaxed">{lead.inquiry}</p>
                  </div>
                </div>

                <Separator className="bg-white/10" />
              </>
            )}

            {/* AI Insights */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-xtech-blue" />
                AI Insights & Recommendations
              </h3>
              <div className="space-y-3">
                {insights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <IconComponent className={`w-5 h-5 mt-0.5 ${insight.color}`} />
                      <div>
                        <p className="text-sm text-gray-300">{insight.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => onSendEmail(lead, 'welcome')}
                  className="bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Welcome Email
                </Button>
                
                <Button
                  onClick={() => onSendEmail(lead, 'follow_up')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Follow-up Email
                </Button>
                
                <Button
                  onClick={() => onSendEmail(lead, 'demo')}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Demo Email
                </Button>
                
                {lead.phone && (
                  <Button
                    onClick={() => window.open(`tel:${lead.phone}`)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsDialog;
