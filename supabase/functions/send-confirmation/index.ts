
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { google } from "npm:googleapis@126.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  name: string;
  email: string;
  date: string;
  timeSlot: string;
  service: string;
  phone: string;
  notes?: string;
}

// Initialize OAuth2 client for Gmail API
const createOAuth2Client = () => {
  console.log("Setting up OAuth2 client for Gmail API");
  
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  const REDIRECT_URI = "https://developers.google.com/oauthplayground";
  
  console.log("Credentials available:", {
    clientId: CLIENT_ID ? "✓" : "✗",
    clientSecret: CLIENT_SECRET ? "✓" : "✗",
    refreshToken: REFRESH_TOKEN ? "✓" : "✗"
  });
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Missing Gmail API credentials. Check environment variables.");
  }
  
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oAuth2Client;
};

// Send email using Gmail API
const sendGmailEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    console.log(`Attempting to send email to: ${to}`);
    const oAuth2Client = createOAuth2Client();
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    
    // Create email with both plain text and HTML parts
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
    
    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail }
    });
    
    console.log("Gmail API response:", JSON.stringify(response.data));
    return { 
      success: true, 
      messageId: response.data.id 
    };
  } catch (error: any) {
    console.error("Error sending Gmail email:", error);
    
    if (error.response) {
      console.error("API Error details:", JSON.stringify(error.response.data));
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error sending email" 
    };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Booking confirmation request received");
  console.log("Request method:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    
    const { name, email, date, timeSlot, service, phone, notes }: BookingConfirmationRequest = requestBody;
    console.log(`Processing booking confirmation for ${name} (${email}) - ${date} at ${timeSlot}`);
    
    // Format email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #6c22d8; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Booking Confirmation</h1>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${name},</p>
          <p>Thank you for scheduling a consultation with XTech Consulting. Your appointment has been confirmed:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${timeSlot}</p>
          </div>
          
          <p>We've saved your contact information:</p>
          <ul>
            <li>Email: ${email}</li>
            <li>Phone: ${phone}</li>
            ${notes ? `<li>Notes: ${notes}</li>` : ''}
          </ul>
          
          <p>If you need to reschedule or have any questions, please contact our support team at XtechInfoQat@gmail.com.</p>
          
          <p>We look forward to speaking with you!</p>
          
          <p>Best regards,<br>XTech Consulting Team</p>
        </div>
        
        <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
          <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
        </div>
      </div>
    `;
    
    console.log("Email HTML content prepared");
    
    try {
      console.log("Sending email via Gmail API...");
      
      // Send email with Gmail API
      const emailResult = await sendGmailEmail(
        email,
        `Your ${service} Consultation is Confirmed`,
        html
      );
      
      console.log("Gmail API result:", JSON.stringify(emailResult));
      
      if (!emailResult.success) {
        throw new Error(`Gmail API error: ${emailResult.error}`);
      }
      
      console.log("Email successfully sent!");
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: true,
          message: "Email confirmation sent successfully",
          data: { messageId: emailResult.messageId }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (sendError: any) {
      // Detailed error logging for email sending failures
      console.error("Error sending email via Gmail API:", sendError);
      
      // Return a response indicating booking success but email failure
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false,
          message: "Booking confirmed but email could not be sent",
          error: sendError.message || "Unknown error sending email"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error("General error in booking confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        emailSent: false,
        error: error instanceof Error ? error.message : "Unknown error in processing request" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
