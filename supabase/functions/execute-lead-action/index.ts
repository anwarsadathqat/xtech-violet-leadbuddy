import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionRequest {
  leadId: string;
  action: string;
  leadData: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    inquiry?: string;
    source: string;
  };
  previewOnly?: boolean;
  // Add emailData for when sending actual emails with edited content
  emailData?: {
    subject: string;
    content: string;
    recipientEmail: string;
    recipientName: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { leadId, action, leadData, previewOnly, emailData }: ActionRequest = await req.json();
    
    console.log(`🤖 LeadBuddy ${previewOnly ? 'previewing' : 'executing'} ${action} for lead ${leadData.name}`);
    console.log(`📧 Email data provided:`, emailData ? 'Yes' : 'No');

    let result = { success: false, message: "" };

    switch (action) {
      case 'welcome_email':
      case 'send_welcome_email':
        result = await sendWelcomeEmail(leadData, previewOnly, emailData);
        break;
      case 'follow_up_email':
      case 'schedule_follow_up':
        result = await scheduleFollowUp(leadData, supabase, previewOnly, emailData);
        break;
      case 'send_demo_link':
        result = await sendDemoLink(leadData, previewOnly, emailData);
        break;
      case 'priority_alert':
      case 'priority_outreach':
        result = await priorityOutreach(leadData, supabase, leadId, previewOnly, emailData);
        break;
      case 'demo_scheduler':
        result = await scheduleDemoMeeting(leadData, supabase, previewOnly, emailData);
        break;
      case 're_engagement':
        result = await reEngagementCampaign(leadData, previewOnly, emailData);
        break;
      default:
        result = { success: false, message: `Unknown action: ${action}` };
    }

    // Only log the action in the database if it's not a preview
    if (!previewOnly) {
      try {
        await supabase.from('lead_actions').insert({
          lead_id: leadId,
          action: action,
          result: result.success ? 'success' : 'failed',
          details: result.message,
          executed_at: new Date().toISOString()
        });
      } catch (logError) {
        console.log('Note: lead_actions table not found, action will not be logged');
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in execute-lead-action:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Gmail API functions
async function refreshGmailAccessToken() {
  console.log("Refreshing Gmail access token...");
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  
  console.log("Gmail credentials available:", {
    clientId: CLIENT_ID ? "✓" : "✗",
    clientSecret: CLIENT_SECRET ? "✓" : "✗",
    refreshToken: REFRESH_TOKEN ? "✓" : "✗"
  });

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Missing Gmail API credentials. Check environment variables.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token"
    }).toString()
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Failed to refresh access token:", data);
    throw new Error(`Failed to refresh access token: ${JSON.stringify(data)}`);
  }

  console.log("Gmail access token refreshed successfully");
  return data.access_token;
}

async function sendRealEmail(to: string, subject: string, htmlContent: string) {
  try {
    console.log(`📧 Sending real email to: ${to}`);
    
    // Get fresh access token
    const accessToken = await refreshGmailAccessToken();
    
    // Create email with HTML content
    const email = [
      `To: ${to}`,
      `From: "XTech Consulting" <XtechInfoQat@gmail.com>`,
      'Content-Type: text/html; charset="UTF-8"',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      htmlContent
    ].join('\n');

    // Encode the email for Gmail API
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log("Email content prepared and encoded");

    // Send the email via Gmail API
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Failed to send email:", data);
      throw new Error(`Gmail API error: ${JSON.stringify(data)}`);
    }

    console.log("✅ Email sent successfully via Gmail API:", data.id);
    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error("❌ Error sending real email:", error.message);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email"
    };
  }
}

async function sendWelcomeEmail(leadData: any, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 'welcome');
      subject = `Welcome to XTech Solutions, ${leadData.name}!`;
    }
    
    console.log(`📧 Welcome email content prepared for ${leadData.email}`);
    console.log(`Email preview: ${emailContent.substring(0, 100)}...`);
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Welcome email content generated for preview`,
        emailContent
      };
    }
    
    // Send real email with the prepared content
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      return { 
        success: true, 
        message: `✅ Welcome email sent successfully to ${leadData.name} at ${leadData.email}`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    console.error(`Failed to send welcome email: ${error.message}`);
    return { 
      success: false, 
      message: `❌ Failed to send welcome email: ${error.message}` 
    };
  }
}

async function scheduleFollowUp(leadData: any, supabase: any, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 'follow_up');
      subject = `Following up on your XTech inquiry, ${leadData.name}`;
    }
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Follow-up email content generated for preview`,
        emailContent
      };
    }
    
    // Send real follow-up email
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      console.log(`📅 Follow-up email sent to ${leadData.name}`);
      return { 
        success: true, 
        message: `✅ Follow-up email sent to ${leadData.name}`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Failed to send follow-up email: ${error.message}` 
    };
  }
}

async function sendDemoLink(leadData: any, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 'demo');
      subject = `Your XTech Demo is Ready, ${leadData.name}!`;
    }
    
    console.log(`🎥 Demo link email prepared for ${leadData.email}`);
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Demo email content generated for preview`,
        emailContent
      };
    }
    
    // Send real demo email
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      return { 
        success: true, 
        message: `✅ Demo link sent successfully to ${leadData.name} at ${leadData.email}`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Failed to send demo link: ${error.message}` 
    };
  }
}

async function priorityOutreach(leadData: any, supabase: any, leadId: string, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 'priority_outreach');
      subject = `Priority Response: Your XTech Consultation, ${leadData.name}`;
    }
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Priority outreach email content generated for preview`,
        emailContent
      };
    }
    
    // Update lead status to high priority
    if (leadId && leadData.id) {
      await supabase.from('leads').update({
        status: 'qualified'
      }).eq('id', leadId);
    }
    
    // Send real priority email
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      console.log(`⭐ Priority outreach email sent to high-value lead: ${leadData.name}`);
      return { 
        success: true, 
        message: `✅ Priority outreach email sent to ${leadData.name}. Lead marked as qualified.`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Failed to send priority outreach: ${error.message}` 
    };
  }
}

async function scheduleDemoMeeting(leadData: any, supabase: any, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 'demo_meeting');
      subject = `Demo Meeting Scheduled: ${leadData.name}`;
    }
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Demo meeting email content generated for preview`,
        emailContent
      };
    }
    
    // Send real demo meeting email
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      console.log(`🎯 Demo meeting email sent to ${leadData.name}`);
      return { 
        success: true, 
        message: `✅ Demo meeting scheduled and invitation sent to ${leadData.name}`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Failed to schedule demo meeting: ${error.message}` 
    };
  }
}

async function reEngagementCampaign(leadData: any, previewOnly = false, emailData?: any) {
  try {
    let emailContent, subject;
    
    // If emailData is provided (from edited content), use it
    if (emailData && !previewOnly) {
      console.log('📧 Using provided email content from dialog');
      emailContent = emailData.content;
      subject = emailData.subject;
    } else {
      // Generate new content for preview or when no email data provided
      console.log('📧 Generating new email content via AI');
      emailContent = await generateEmailContent(leadData, 're_engagement');
      subject = `We miss you! ${leadData.name}, let's reconnect`;
    }
    
    // If it's preview only, just return the content
    if (previewOnly) {
      return { 
        success: true, 
        message: `✅ Re-engagement email content generated for preview`,
        emailContent
      };
    }
    
    // Send real re-engagement email
    const emailResult = await sendRealEmail(
      leadData.email,
      subject,
      emailContent
    );
    
    if (emailResult.success) {
      console.log(`🔄 Re-engagement email sent to ${leadData.name}`);
      return { 
        success: true, 
        message: `✅ Re-engagement email sent to ${leadData.name}`,
        emailContent,
        messageId: emailResult.messageId
      };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    return { 
      success: false, 
      message: `❌ Failed to start re-engagement campaign: ${error.message}` 
    };
  }
}

async function generateEmailContent(leadData: any, emailType: string) {
  try {
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY") || "sk-2595b04336514d20834d335707c20a8d";
    
    const systemPrompts = {
      welcome: "You are LeadBuddy, writing a professional welcome email for XTech, an IT services company. Create a warm, personalized welcome email that introduces our services and next steps. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email.",
      demo: "You are LeadBuddy, writing a demo invitation email for XTech. Include a compelling subject line and clear call-to-action for scheduling a product demonstration. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email.",
      demo_meeting: "You are LeadBuddy, writing a demo meeting confirmation email for XTech. Include meeting details and what to expect during the demo. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email.",
      re_engagement: "You are LeadBuddy, writing a re-engagement email for XTech. Create a compelling email to reconnect with a lead who hasn't responded recently. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email.",
      follow_up: "You are LeadBuddy, writing a professional follow-up email for XTech. Check in on their IT needs and offer assistance. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email.",
      priority_outreach: "You are LeadBuddy, writing a priority outreach email for XTech for a high-value lead. Express urgency and offer immediate consultation. Format as HTML email with proper structure and complete content. IMPORTANT: Always include a complete conclusion and call-to-action. Do not truncate the email."
    };
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${deepseekApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompts[emailType] || systemPrompts.welcome
          },
          {
            role: "user",
            content: `Create a complete ${emailType} email for:
            Name: ${leadData.name}
            Email: ${leadData.email}
            Phone: ${leadData.phone || 'Not provided'}
            Inquiry: ${leadData.inquiry || 'General IT services inquiry'}
            Source: ${leadData.source}
            
            Make it personalized, professional, and formatted as HTML. Include proper styling and ensure the email is COMPLETE with proper conclusion and call-to-action. Do not truncate or cut off the content.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500 // Increased from 1000 to 1500
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log(`✅ Generated complete email content (${content.length} characters)`);
      return content;
    } else {
      console.error(`DeepSeek API failed for ${emailType} email generation`);
      // Fallback template
      return generateFallbackEmail(leadData, emailType);
    }
  } catch (error) {
    console.error(`Error generating ${emailType} email:`, error);
    return generateFallbackEmail(leadData, emailType);
  }
}

function generateFallbackEmail(leadData: any, emailType: string) {
  const templates = {
    welcome: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
      </div>`,

    demo: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
      </div>`,

    follow_up: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
      </div>`,

    re_engagement: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6c22d8, #00bcd4); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">We Miss You, ${leadData.name}!</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hi ${leadData.name},</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We haven't heard from you since you inquired about our IT services, and we wanted to check if you still need assistance with "${leadData.inquiry || 'your IT requirements'}".</p>
          
          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #6c22d8; margin-top: 0;">Since your last inquiry, we've helped companies achieve:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>40% reduction in IT operational costs</li>
              <li>99.9% system uptime and reliability</li>
              <li>Enhanced cybersecurity and data protection</li>
              <li>Streamlined business processes</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We'd love to show you how we can help your business achieve similar results. Would you like to schedule a quick 15-minute call to discuss your current challenges?</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: linear-gradient(135deg, #6c22d8, #00bcd4); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">Let's Reconnect</a>
          </div>
          
          <p style="font-size: 16px; color: #333;">Best regards,<br><strong>XTech Solutions Team</strong></p>
        </div>
      </div>`
  };

  return templates[emailType] || templates.welcome;
}
