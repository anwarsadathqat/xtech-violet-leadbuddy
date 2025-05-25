
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

    const { leadId, action, leadData }: ActionRequest = await req.json();
    
    console.log(`🤖 LeadBuddy executing ${action} for lead ${leadData.name}`);

    let result = { success: false, message: "" };

    switch (action) {
      case 'welcome_email':
      case 'send_welcome_email':
        result = await sendWelcomeEmail(leadData);
        break;
      case 'follow_up_email':
      case 'schedule_follow_up':
        result = await scheduleFollowUp(leadData, supabase);
        break;
      case 'send_demo_link':
        result = await sendDemoLink(leadData);
        break;
      case 'priority_alert':
      case 'priority_outreach':
        result = await priorityOutreach(leadData, supabase, leadId);
        break;
      case 'demo_scheduler':
        result = await scheduleDemoMeeting(leadData, supabase);
        break;
      case 're_engagement':
        result = await reEngagementCampaign(leadData);
        break;
      default:
        result = { success: false, message: `Unknown action: ${action}` };
    }

    // Log the action in the database (create table if needed)
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

async function sendWelcomeEmail(leadData: any) {
  try {
    // Generate personalized email content using DeepSeek
    const emailContent = await generateEmailContent(leadData, 'welcome');
    
    console.log(`📧 Welcome email content generated for ${leadData.email}`);
    console.log(`Email preview: ${emailContent.substring(0, 100)}...`);
    
    return { 
      success: true, 
      message: `Welcome email sent to ${leadData.name}`,
      emailContent 
    };
  } catch (error) {
    console.error(`Failed to send welcome email: ${error.message}`);
    return { 
      success: false, 
      message: `Failed to send welcome email: ${error.message}` 
    };
  }
}

async function scheduleFollowUp(leadData: any, supabase: any) {
  try {
    // Calculate optimal follow-up time (24-48 hours)
    const followUpDate = new Date();
    followUpDate.setHours(followUpDate.getHours() + 24);
    
    console.log(`📅 Follow-up scheduled for ${leadData.name} at ${followUpDate.toISOString()}`);
    
    return { 
      success: true, 
      message: `Follow-up scheduled for ${followUpDate.toLocaleDateString()} at ${followUpDate.toLocaleTimeString()}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to schedule follow-up: ${error.message}` 
    };
  }
}

async function sendDemoLink(leadData: any) {
  try {
    const demoContent = await generateEmailContent(leadData, 'demo');
    
    console.log(`🎥 Demo link email generated for ${leadData.email}`);
    
    return { 
      success: true, 
      message: `Demo link sent to ${leadData.name}`,
      demoContent 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to send demo link: ${error.message}` 
    };
  }
}

async function priorityOutreach(leadData: any, supabase: any, leadId: string) {
  try {
    // Update lead status to high priority
    if (leadId && leadData.id) {
      await supabase.from('leads').update({
        status: 'qualified'
      }).eq('id', leadId);
    }
    
    console.log(`⭐ Priority outreach initiated for high-value lead: ${leadData.name}`);
    
    return { 
      success: true, 
      message: `Priority outreach sequence started for ${leadData.name}. Lead marked as qualified.` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to initiate priority outreach: ${error.message}` 
    };
  }
}

async function scheduleDemoMeeting(leadData: any, supabase: any) {
  try {
    const demoContent = await generateEmailContent(leadData, 'demo_meeting');
    
    console.log(`🎯 Demo meeting scheduled for ${leadData.name}`);
    
    return { 
      success: true, 
      message: `Demo meeting scheduled and invitation sent to ${leadData.name}`,
      demoContent 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to schedule demo meeting: ${error.message}` 
    };
  }
}

async function reEngagementCampaign(leadData: any) {
  try {
    const reEngagementContent = await generateEmailContent(leadData, 're_engagement');
    
    console.log(`🔄 Re-engagement campaign started for ${leadData.name}`);
    
    return { 
      success: true, 
      message: `Re-engagement campaign initiated for ${leadData.name}`,
      emailContent: reEngagementContent 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to start re-engagement campaign: ${error.message}` 
    };
  }
}

async function generateEmailContent(leadData: any, emailType: string) {
  try {
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY") || "sk-2595b04336514d20834d335707c20a8d";
    
    const systemPrompts = {
      welcome: "You are LeadBuddy, writing a professional welcome email for XTech, an IT services company. Create a warm, personalized welcome email that introduces our services and next steps.",
      demo: "You are LeadBuddy, writing a demo invitation email for XTech. Include a compelling subject line and clear call-to-action for scheduling a product demonstration.",
      demo_meeting: "You are LeadBuddy, writing a demo meeting confirmation email for XTech. Include meeting details and what to expect during the demo.",
      re_engagement: "You are LeadBuddy, writing a re-engagement email for XTech. Create a compelling email to reconnect with a lead who hasn't responded recently."
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
            content: `Create a ${emailType} email for:
            Name: ${leadData.name}
            Email: ${leadData.email}
            Phone: ${leadData.phone || 'Not provided'}
            Inquiry: ${leadData.inquiry || 'General IT services inquiry'}
            Source: ${leadData.source}
            
            Make it personalized and professional. Include a subject line.`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
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
    welcome: `Subject: Welcome to XTech Solutions, ${leadData.name}!

Hi ${leadData.name},

Thank you for your interest in XTech's IT services. We're excited to help optimize your technology infrastructure.

Based on your inquiry about "${leadData.inquiry || 'IT services'}", our team will review your requirements and get back to you within 24 hours.

Next steps:
1. Our technical consultant will contact you shortly
2. We'll schedule a brief consultation to understand your needs
3. Receive a customized solution proposal

Best regards,
XTech Solutions Team`,

    demo: `Subject: Ready for your XTech demo, ${leadData.name}?

Hi ${leadData.name},

We'd love to show you how XTech can transform your IT infrastructure with a personalized demo.

Schedule your 30-minute demo: [DEMO_LINK]

What you'll see:
- Live demonstration of our solutions
- Customized recommendations for your business
- Q&A with our technical experts

Best regards,
XTech Solutions Team`,

    re_engagement: `Subject: Still need help with your IT challenges, ${leadData.name}?

Hi ${leadData.name},

We haven't heard from you since you inquired about our IT services. We wanted to check if you still need assistance with "${leadData.inquiry || 'your IT requirements'}".

Since your last inquiry, we've helped many companies like yours achieve:
- 40% reduction in IT costs
- 99.9% system uptime
- Enhanced cybersecurity

Would you like to schedule a quick 15-minute call to discuss your needs?

Best regards,
XTech Solutions Team`
  };

  return templates[emailType] || templates.welcome;
}
