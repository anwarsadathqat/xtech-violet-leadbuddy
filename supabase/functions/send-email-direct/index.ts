
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DirectEmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  recipientName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, htmlContent, recipientName }: DirectEmailRequest = await req.json();
    
    console.log(`📧 Sending direct email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content length: ${htmlContent.length} characters`);
    
    // Send real email using Gmail API
    const emailResult = await sendRealEmail(to, subject, htmlContent);
    
    if (emailResult.success) {
      console.log(`✅ Direct email sent successfully to ${recipientName} at ${to}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent successfully to ${recipientName}`,
          messageId: emailResult.messageId
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    console.error("Error in send-email-direct:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function refreshGmailAccessToken() {
  console.log("Refreshing Gmail access token...");
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  
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
