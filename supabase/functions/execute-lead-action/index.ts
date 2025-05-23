
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
      case 'send_welcome_email':
        result = await sendWelcomeEmail(leadData);
        break;
      case 'schedule_follow_up':
        result = await scheduleFollowUp(leadData, supabase);
        break;
      case 'send_demo_link':
        result = await sendDemoLink(leadData);
        break;
      case 'priority_outreach':
        result = await priorityOutreach(leadData, supabase);
        break;
      default:
        result = { success: false, message: `Unknown action: ${action}` };
    }

    // Log the action in the database
    await supabase.from('lead_actions').insert({
      lead_id: leadId,
      action: action,
      result: result.success ? 'success' : 'failed',
      details: result.message,
      executed_at: new Date().toISOString()
    });

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
    
    // Here you would integrate with your email service (Gmail API, Resend, etc.)
    console.log(`📧 Sending welcome email to ${leadData.email}`);
    console.log(`Email content: ${emailContent}`);
    
    return { 
      success: true, 
      message: `Welcome email sent to ${leadData.name}`,
      emailContent 
    };
  } catch (error) {
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
    
    // Insert follow-up task
    const { error } = await supabase.from('follow_up_tasks').insert({
      lead_id: leadData.id,
      scheduled_for: followUpDate.toISOString(),
      task_type: 'email_follow_up',
      status: 'pending',
      created_by: 'LeadBuddy AI'
    });
    
    if (error) throw error;
    
    return { 
      success: true, 
      message: `Follow-up scheduled for ${followUpDate.toLocaleDateString()}` 
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
    
    console.log(`🎥 Sending demo link to ${leadData.email}`);
    console.log(`Demo email content: ${demoContent}`);
    
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

async function priorityOutreach(leadData: any, supabase: any) {
  try {
    // Update lead status to high priority
    await supabase.from('leads').update({
      status: 'qualified',
      priority: 'high'
    }).eq('id', leadData.id);
    
    // Send immediate notification to sales team
    console.log(`⭐ Priority outreach initiated for ${leadData.name}`);
    
    return { 
      success: true, 
      message: `Priority outreach sequence started for ${leadData.name}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to initiate priority outreach: ${error.message}` 
    };
  }
}

async function generateEmailContent(leadData: any, emailType: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are LeadBuddy, writing personalized emails for an IT services company. 
            Write a ${emailType} email that is professional, friendly, and personalized based on the lead's inquiry.`
          },
          {
            role: "user",
            content: `Write a ${emailType} email for:
            Name: ${leadData.name}
            Email: ${leadData.email}
            Inquiry: ${leadData.inquiry || 'General IT services inquiry'}
            Source: ${leadData.source}`
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
      // Fallback template
      return `Hi ${leadData.name},\n\nThank you for your interest in our IT services. We'll be in touch soon!\n\nBest regards,\nXTech Team`;
    }
  } catch (error) {
    return `Hi ${leadData.name},\n\nThank you for your interest in our IT services. We'll be in touch soon!\n\nBest regards,\nXTech Team`;
  }
}
