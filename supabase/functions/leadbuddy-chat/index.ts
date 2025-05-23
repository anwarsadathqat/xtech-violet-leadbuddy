
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{
    sender: string;
    content: string;
    timestamp: string;
  }>;
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

    const { message, conversationHistory }: ChatRequest = await req.json();
    
    // Get recent leads data for context
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
    }

    // Prepare context for AI
    const leadsContext = leads ? JSON.stringify(leads.map(lead => ({
      name: lead.name,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      inquiry: lead.inquiry?.substring(0, 100), // Truncate for context
      created_at: lead.created_at
    }))) : 'No leads data available';

    // Build conversation context
    const conversationContext = conversationHistory ? 
      conversationHistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n') : '';

    // Call DeepSeek API
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
            content: `You are LeadBuddy, an expert AI assistant for lead management at an IT services company. You are friendly, professional, and helpful.

            CAPABILITIES:
            - Analyze lead quality and provide scoring insights
            - Draft personalized follow-up emails
            - Provide pipeline analytics and trends
            - Suggest optimization strategies
            - Schedule meetings and follow-ups
            - Generate reports and insights

            CURRENT LEADS DATA: ${leadsContext}

            CONVERSATION HISTORY: ${conversationContext}

            Always be helpful, provide actionable insights, and maintain a professional yet friendly tone. Use emojis sparingly for clarity. Focus on practical, implementable advice.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log(`🤖 LeadBuddy responded to: ${message.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        content: aiResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in leadbuddy-chat function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        content: "I'm experiencing some technical difficulties. Please try again or use the fallback responses in the interface."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
