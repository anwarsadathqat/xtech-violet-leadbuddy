
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
  const [originalHtmlContent, setOriginalHtmlContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);

  useEffect(() => {
    if (isOpen && lead && emailType) {
      generateEmailDraft();
    }
  }, [isOpen, lead, emailType]);

  const generateEmailDraft = async () => {
    if (!lead || !emailType) return;

    setIsGenerating(true);
    setHasBeenEdited(false);
    
    try {
      // Call the backend function to generate the email content
      const { data, error } = await supabase.functions.invoke('execute-lead-action', {
        body: {
          leadId: lead.id,
          action: getActionFromEmailType(emailType),
          leadData: lead,
          previewOnly: true
        }
      });

      if (error) throw error;

      console.log('Generated email data:', data);

      // Extract the content based on email type
      let content = '';
      if (emailType === 'welcome') {
        content = data.emailContent || '';
      } else if (emailType === 'follow_up') {
        content = data.emailContent || '';
      } else if (emailType === 'demo') {
        content = data.demoContent || '';
      }

      // Store the original HTML content
      setOriginalHtmlContent(content);
      
      const subject = extractSubjectFromEmailType(emailType, lead.name);
      
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
      setOriginalHtmlContent(draftData.content);
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
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6c22d8, #00bcd4); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to XTech Solutions!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${leadData.name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for your interest in XTech's IT services. We're excited to help optimize your technology infrastructure and drive your business forward.</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Based on your inquiry about "<strong>${leadData.inquiry || 'IT services'}</strong>", our technical team will review your requirements and get back to you within 24 hours.</p>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #6c22d8;">
            <h3 style="color: #6c22d8; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Our technical consultant will contact you shortly</li>
              <li>We'll schedule a brief consultation to understand your needs</li>
              <li>Receive a customized solution proposal</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">If you have any urgent questions, feel free to reply to this email or call us directly.</p>
          <p style="font-size: 16px; color: #333;">Best regards,<br><strong>XTech Solutions Team</strong></p>
        </div>
      </div>`
      },
      follow_up: {
        subject: `Following up on your XTech Solutions inquiry`,
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6c22d8, #00bcd4); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Following Up on Your IT Needs</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${leadData.name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">I wanted to follow up on your recent inquiry about "${leadData.inquiry || 'IT services'}" and see how we can help move your project forward.</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">At XTech, we understand that choosing the right IT partner is crucial for your business success. That's why we'd like to offer you a complimentary consultation to discuss your specific needs.</p>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #6c22d8; margin-top: 0;">How we can help:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Assess your current IT infrastructure</li>
              <li>Identify optimization opportunities</li>
              <li>Provide cost-effective solutions</li>
              <li>Ensure seamless implementation</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Would you be available for a brief 15-minute call this week? I'm happy to work around your schedule.</p>
          <p style="font-size: 16px; color: #333;">Best regards,<br><strong>XTech Solutions Team</strong></p>
        </div>
      </div>`
      },
      demo: {
        subject: `Your XTech Solutions Demo - Let's Show You What's Possible`,
        content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6c22d8, #00bcd4); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Your XTech Demo Awaits!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${leadData.name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We'd love to show you how XTech can transform your IT infrastructure with a personalized demo tailored to your needs.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: linear-gradient(135deg, #6c22d8, #00bcd4); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Schedule Your Demo</a>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #6c22d8; margin-top: 0;">What you'll see in your demo:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Live demonstration of our solutions</li>
              <li>Customized recommendations for your business</li>
              <li>Q&A with our technical experts</li>
              <li>ROI analysis and implementation timeline</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333;">Best regards,<br><strong>XTech Solutions Team</strong></p>
        </div>
      </div>`
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

  const handleContentChange = (newContent: string) => {
    setEmailData({ ...emailData, content: newContent });
    setHasBeenEdited(true);
  };

  const getDialogTitle = () => {
    const titles = {
      welcome: 'Welcome Email Draft',
      follow_up: 'Follow-up Email Draft',
      demo: 'Demo Email Draft'
    };
    return emailType ? titles[emailType] : 'Email Draft';
  };

  // Function to strip HTML and show plain text
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Function to detect if content is HTML
  const isHtmlContent = (content: string) => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  // Determine what content to show in preview
  const getPreviewContent = () => {
    if (hasBeenEdited || !isHtmlContent(emailData.content)) {
      return emailData.content;
    }
    return originalHtmlContent || emailData.content;
  };

  // Determine what content to show in textarea
  const getEditableContent = () => {
    if (isHtmlContent(emailData.content) && !hasBeenEdited) {
      return stripHtml(emailData.content);
    }
    return emailData.content;
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
                {isHtmlContent(originalHtmlContent) && !hasBeenEdited && (
                  <span className="text-xs text-blue-400">(HTML email - editing will convert to plain text)</span>
                )}
              </Label>
              <Textarea
                id="content"
                value={getEditableContent()}
                onChange={(e) => handleContentChange(e.target.value)}
                className="bg-white/10 border-white/20 text-white min-h-[400px]"
                placeholder="Enter email content..."
              />
            </div>

            {/* HTML Preview for original HTML emails */}
            {isHtmlContent(originalHtmlContent) && !hasBeenEdited && (
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Original HTML Email Preview
                </Label>
                <div 
                  className="bg-white/5 border border-white/10 rounded-md p-4 max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                />
              </div>
            )}

            {/* Preview Note */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-blue-400 text-sm">
                💡 <strong>Tip:</strong> You can edit the subject and content above. The email will be sent exactly as shown.
                {isHtmlContent(originalHtmlContent) && !hasBeenEdited && " This email contains HTML formatting - see preview above. Editing will convert to plain text."}
                {hasBeenEdited && " Your edits will be sent as plain text."}
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
