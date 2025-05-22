
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LeadRequest {
  name: string;
  email: string;
  phone: string;
  inquiry?: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the lead data from the request
    const leadData: LeadRequest = await req.json();
    
    // Validate required fields
    if (!leadData.name || !leadData.email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Set default phone value if empty
    const phone = leadData.phone || "Not provided";
    
    // Insert the lead into the database
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name: leadData.name,
          email: leadData.email,
          phone: phone,
          inquiry: leadData.inquiry || "",
          source: leadData.source || "website",
          status: "new",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error storing lead:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store lead" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead stored successfully",
        data 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
