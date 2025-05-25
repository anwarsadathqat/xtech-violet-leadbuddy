
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
            content: `You are LeadBuddy, an AI lead analyst for XTech, an IT services company. Analyze the lead and provide ONLY a valid JSON response with no markdown formatting or code blocks.
            
            Respond with exactly this format:
            {"score": number, "insights": "string", "recommendedAction": "send_welcome_email|schedule_follow_up|priority_outreach|send_demo_link"}
            
            Consider factors like email domain, inquiry content, urgency indicators, budget mentions, and technical requirements.`
          },
          {
            role: "user",
            content: `Analyze this lead and respond with valid JSON only:
            Name: ${lead.name}
            Email: ${lead.email}
            Phone: ${lead.phone || 'Not provided'}
            Source: ${lead.source}
            Inquiry: ${lead.inquiry || 'No specific inquiry provided'}
            Submitted: ${lead.created_at}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error(`DeepSeek API error: ${deepseekResponse.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${deepseekResponse.statusText}`);
    }

    const deepseekData = await deepseekResponse.json();
    let responseContent = deepseekData.choices[0].message.content;
    
    // Clean up the response - remove markdown code blocks if present
    responseContent = responseContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError);
      console.error('Raw response:', responseContent);
      // Fallback to manual scoring
      analysis = {
        score: calculateFallbackScore(lead),
        insights: "AI analysis temporarily unavailable. Using fallback scoring based on lead characteristics.",
        recommendedAction: calculateFallbackScore(lead) > 70 ? "priority_outreach" : "send_welcome_email"
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
    const lead = (await req.json()).lead;
    const fallbackScore = calculateFallbackScore(lead);
    
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
    if (lead.email?.includes('gmail.com') || lead.email?.includes('yahoo.com')) score -= 5;
    
    // Phone presence
    if (lead.phone && lead.phone !== 'Not provided') score += 15;
    
    // Inquiry analysis
    const inquiry = lead.inquiry?.toLowerCase() || '';
    if (inquiry.includes('urgent') || inquiry.includes('asap')) score += 25;
    if (inquiry.includes('budget') || inquiry.includes('cost')) score += 20;
    if (inquiry.includes('enterprise') || inquiry.includes('large scale')) score += 25;
    if (inquiry.includes('demo') || inquiry.includes('meeting')) score += 20;
    if (inquiry.includes('timeline') || inquiry.includes('when')) score += 15;
    
    // Source scoring
    if (lead.source === 'referral') score += 30;
    if (lead.source === 'linkedin') score += 20;
    if (lead.source === 'website') score += 10;
    
    // Inquiry length (more detailed = higher intent)
    if (inquiry.length > 200) score += 15;
    if (inquiry.length > 500) score += 10;
    
    return Math.min(100, Math.max(0, score));
  } catch {
    return 50; // Default score if parsing fails
  }
}
