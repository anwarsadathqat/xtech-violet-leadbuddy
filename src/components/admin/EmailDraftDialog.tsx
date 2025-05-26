
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Edit, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface EmailDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (emailData: EmailData) => Promise<void>;
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    inquiry?: string;
    source: string;
  } | null;
  emailType: 'welcome' | 'follow_up' | 'demo' | null;
}

interface EmailData {
  subject: string;
  content: string;
  recipientEmail: string;
  recipientName: string;
}

const EmailDraftDialog: React.FC<EmailDraftDialogProps> = ({
  isOpen,
  onClose,
  onSend,
  lead,
  emailType,
}) => {
  const [emailData, setEmailData] = useState<EmailData>({
    subject: '',
    content: '',
    recipientEmail: '',
    recipientName: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && lead && emailType) {
      generateEmailDraft();
    }
  }, [isOpen, lead, emailType]);

  const generateEmailDraft = async () => {
    if (!lead || !emailType) return;

    setIsGenerating(true);
    
    try {
      // Call the actual backend function to generate the email content
      const { data, error } = await supabase.functions.invoke('execute-lead-action', {
        body: {
          leadId: lead.id,
          action: getActionFromEmailType(emailType),
          leadData: lead,
          previewOnly: true // Add a flag to indicate this is just for preview
        }
      });

      if (error) throw error;

      // Extract subject and content from the generated email
      const subject = extractSubjectFromEmailType(emailType, lead.name);
      const content = data.emailContent || data.demoContent || data.reEngagementContent || '';
      
      setEmailData({
        subject: subject,
        content: content,
        recipientEmail: lead.email,
        recipientName: lead.name,
      });
    } catch (error) {
      console.error('Error generating email draft:', error);
      // Fallback to local generation if backend fails
      const draftData = generateLocalEmailContent(emailType, lead);
      setEmailData({
        subject: draftData.subject,
        content: draftData.content,
        recipientEmail: lead.email,
        recipientName: lead.name,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getActionFromEmailType = (type: string) => {
    const actionMap = {
      welcome: 'send_welcome_email',
      follow_up: 'follow_up_email',
      demo: 'send_demo_link'
    };
    return actionMap[type as keyof typeof actionMap] || 'send_welcome_email';
  };

  const extractSubjectFromEmailType = (type: string, name: string) => {
    const subjects = {
      welcome: `Welcome to XTech Solutions, ${name}!`,
      follow_up: `Following up on your XTech inquiry, ${name}`,
      demo: `Your XTech Demo is Ready, ${name}!`
    };
    return subjects[type as keyof typeof subjects] || `Message from XTech Solutions, ${name}`;
  };

  const generateLocalEmailContent = (type: string, leadData: any) => {
    const templates = {
      welcome: {
        subject: `Welcome to XTech Solutions, ${leadData.name}!`,
        content: `Dear ${leadData.name},

Thank you for your interest in XTech Solutions! We're excited to help you transform your business with our cutting-edge technology solutions.

We received your inquiry about: ${leadData.inquiry || 'our services'}

Our team specializes in delivering innovative solutions that drive real results. Based on your inquiry, we believe we can help you achieve your goals.

Next Steps:
• A member of our team will reach out within 24 hours
• We'll schedule a consultation to understand your specific needs
• You'll receive a customized proposal tailored to your requirements

In the meantime, feel free to explore our case studies and success stories on our website.

Best regards,
The XTech Solutions Team

P.S. If you have any immediate questions, don't hesitate to reply to this email or call us directly.`
      },
      follow_up: {
        subject: `Following up on your XTech Solutions inquiry`,
        content: `Dear ${leadData.name},

I hope this email finds you well. I wanted to follow up on your recent inquiry about our services.

Your Original Inquiry: ${leadData.inquiry || 'General inquiry about our services'}

We understand that choosing the right technology partner is a crucial decision for your business. That's why we'd love to schedule a brief consultation to:

• Understand your specific challenges and goals
• Show you how our solutions can address your needs
• Provide you with a customized approach for your business

Would you be available for a 30-minute call this week? I have availability on:
• Tuesday at 2:00 PM or 4:00 PM
• Wednesday at 10:00 AM or 3:00 PM
• Thursday at 1:00 PM or 5:00 PM

Please let me know what works best for your schedule, and I'll send you a calendar invite.

Looking forward to speaking with you soon!

Best regards,
The XTech Solutions Team`
      },
      demo: {
        subject: `Your XTech Solutions Demo - Let's Show You What's Possible`,
        content: `Dear ${leadData.name},

Great news! We'd love to show you exactly how XTech Solutions can transform your business operations.

Based on your inquiry about: ${leadData.inquiry || 'our services'}

We've prepared a personalized demo that will showcase:
✓ Solutions specifically relevant to your industry
✓ Real-world case studies from similar businesses
✓ Live demonstration of key features
✓ ROI projections based on your business size

🎥 Schedule Your Demo:
Click here to book a time that works for you: [Demo Booking Link]

Available Time Slots:
• 30-minute focused demo
• 60-minute comprehensive walkthrough
• Custom timing to fit your schedule

What to Expect:
• Screen-sharing demonstration
• Interactive Q&A session
• Customized recommendations
• Next steps discussion

We're confident that after seeing our solutions in action, you'll understand why businesses choose XTech Solutions to drive their digital transformation.

Ready to see the future of your business operations?

Best regards,
The XTech Solutions Team

P.S. Can't find a suitable time? Reply to this email, and we'll work around your schedule.`
      }
    };

    return templates[type as keyof typeof templates] || templates.welcome;
  };

  const handleSend = async () => {
    if (!lead || !emailType) return;

    setIsSending(true);
    try {
      await onSend(emailData);
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getDialogTitle = () => {
    const titles = {
      welcome: 'Welcome Email Draft',
      follow_up: 'Follow-up Email Draft',
      demo: 'Demo Email Draft'
    };
    return emailType ? titles[emailType] : 'Email Draft';
  };

  // Function to strip HTML and show plain text preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Function to detect if content is HTML
  const isHtmlContent = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-xtech-dark-purple border border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            <Mail className="w-5 h-5" />
            {getDialogTitle()}
            {lead && (
              <span className="text-sm text-gray-400 font-normal">
                to {lead.name} ({lead.email})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-xtech-blue" />
              <span className="text-gray-300">Generating email draft...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recipientName" className="text-gray-300">
                  Recipient Name
                </Label>
                <Input
                  id="recipientName"
                  value={emailData.recipientName}
                  onChange={(e) => setEmailData({ ...emailData, recipientName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="recipientEmail" className="text-gray-300">
                  Recipient Email
                </Label>
                <Input
                  id="recipientEmail"
                  value={emailData.recipientEmail}
                  onChange={(e) => setEmailData({ ...emailData, recipientEmail: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  disabled
                />
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <Label htmlFor="subject" className="text-gray-300 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Subject Line
              </Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter email subject..."
              />
            </div>

            {/* Email Content */}
            <div>
              <Label htmlFor="content" className="text-gray-300 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Email Content
                {isHtmlContent(emailData.content) && (
                  <span className="text-xs text-blue-400">(HTML email - editing will convert to plain text)</span>
                )}
              </Label>
              <Textarea
                id="content"
                value={isHtmlContent(emailData.content) ? stripHtml(emailData.content) : emailData.content}
                onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                className="bg-white/10 border-white/20 text-white min-h-[400px]"
                placeholder="Enter email content..."
              />
            </div>

            {/* HTML Preview for HTML emails */}
            {isHtmlContent(emailData.content) && (
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  HTML Email Preview
                </Label>
                <div 
                  className="bg-white/5 border border-white/10 rounded-md p-4 max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: emailData.content }}
                />
              </div>
            )}

            {/* Preview Note */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-blue-400 text-sm">
                💡 <strong>Tip:</strong> You can edit the subject and content above. The email will be sent exactly as shown here.
                {isHtmlContent(emailData.content) && " This email contains HTML formatting - see preview above."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={generateEmailDraft}
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-white"
              disabled={isGenerating || !lead}
            >
              <Edit className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            
            <Button
              onClick={handleSend}
              className="bg-gradient-to-r from-xtech-purple to-xtech-blue hover:from-xtech-blue hover:to-xtech-purple"
              disabled={isSending || isGenerating || !emailData.subject.trim() || !emailData.content.trim()}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDraftDialog;
