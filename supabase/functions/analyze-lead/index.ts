
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadAnalysisRequest {
  lead: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    inquiry?: string;
    source: string;
    created_at: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead }: LeadAnalysisRequest = await req.json();
    
    console.log(`🔍 Analyzing lead: ${lead.name} (${lead.email})`);
    
    // Use the provided DeepSeek API key
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY") || "sk-2595b04336514d20834d335707c20a8d";
    
    // DeepSeek API call for lead analysis
    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
            content: `You are LeadBuddy, an AI lead analyst for XTech, an IT services company. Analyze the lead and provide:
            1. A lead score (0-100)
            2. Key insights about the lead's potential
            3. Recommended next action
            
            Consider factors like email domain, inquiry content, urgency indicators, budget mentions, and technical requirements.
            
            Respond in JSON format:
            {
              "score": number,
              "insights": "string",
              "recommendedAction": "send_welcome_email|schedule_follow_up|priority_outreach|send_demo_link"
            }`
          },
          {
            role: "user",
            content: `Analyze this lead:
            Name: ${lead.name}
            Email: ${lead.email}
            Phone: ${lead.phone || 'Not provided'}
            Source: ${lead.source}
            Inquiry: ${lead.inquiry || 'No specific inquiry provided'}
            Submitted: ${lead.created_at}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error(`DeepSeek API error: ${deepseekResponse.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${deepseekResponse.statusText}`);
    }

    const deepseekData = await deepseekResponse.json();
    
    let analysis;
    try {
      analysis = JSON.parse(deepseekData.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError);
      // Fallback to manual scoring
      analysis = {
        score: calculateFallbackScore(lead),
        insights: "Lead analyzed using fallback scoring. AI analysis temporarily unavailable.",
        recommendedAction: "send_welcome_email"
      };
    }

    console.log(`✅ Lead ${lead.name} analyzed: Score ${analysis.score}/100`);

    return new Response(
      JSON.stringify({
        success: true,
        score: analysis.score,
        insights: analysis.insights,
        recommendedAction: analysis.recommendedAction,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in analyze-lead function:", error);
    
    // Fallback scoring if AI fails
    const fallbackScore = calculateFallbackScore(req);
    
    return new Response(
      JSON.stringify({
        success: true,
        score: fallbackScore,
        insights: "Lead analyzed using fallback scoring. AI analysis temporarily unavailable.",
        recommendedAction: fallbackScore > 70 ? "priority_outreach" : "send_welcome_email",
        fallback: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateFallbackScore(lead: any): number {
  let score = 50;
  
  try {
    // Email domain scoring
    if (lead.email?.includes('.gov') || lead.email?.includes('.edu')) score += 20;
    if (lead.email?.includes('company.com') || lead.email?.includes('corp.com')) score += 15;
    
    // Phone presence
    if (lead.phone && lead.phone !== 'Not provided') score += 15;
    
    // Inquiry analysis
    const inquiry = lead.inquiry?.toLowerCase() || '';
    if (inquiry.includes('urgent')) score += 20;
    if (inquiry.includes('budget')) score += 15;
    if (inquiry.includes('enterprise')) score += 25;
    
    return Math.min(100, Math.max(0, score));
  } catch {
    return 50; // Default score if parsing fails
  }
}
