
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

// Configure Gmail API with improved error handling
const setupGmailClient = () => {
  try {
    console.log("Setting up Gmail client...");
    
    // Log environment variable availability (not their values)
    console.log("GMAIL_CLIENT_ID available:", !!Deno.env.get("GMAIL_CLIENT_ID"));
    console.log("GMAIL_CLIENT_SECRET available:", !!Deno.env.get("GMAIL_CLIENT_SECRET"));
    console.log("GMAIL_REFRESH_TOKEN available:", !!Deno.env.get("GMAIL_REFRESH_TOKEN"));
    
    const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
    const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
    
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      throw new Error("Gmail API credentials are not configured properly");
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URI
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN
    });

    // Test token by getting a new access token
    console.log("Testing OAuth token refresh...");
    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error("Error setting up Gmail client:", error);
    throw error;
  }
};

// Create email content in base64 encoded format
const createEmail = (to: string, subject: string, html: string): string => {
  try {
    console.log("Creating email to:", to);
    console.log("Email subject:", subject);
    console.log("Email content length:", html.length);
    
    const emailLines = [
      `To: ${to}`,
      'From: XTech Consulting <XtechInfoQat@gmail.com>',
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      html
    ];
    
    const emailContent = emailLines.join('\r\n');
    
    // For Deno environment
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(emailContent);
    
    // Convert Uint8Array to string
    let binaryString = '';
    uint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    
    // Base64 encode and make URL-safe
    let base64 = btoa(binaryString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    console.log("Email encoded successfully, base64 length:", base64.length);
    return base64;
  } catch (error) {
    console.error("Error creating email:", error);
    throw error;
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
      console.log("Initializing Gmail client...");
      const gmail = setupGmailClient();
      console.log("Gmail client setup complete");
      
      console.log("Creating email content...");
      const rawEmail = createEmail(
        email, 
        `Your ${service} Consultation is Confirmed`, 
        html
      );
      console.log("Email content created");
      
      console.log(`Attempting to send email to: ${email} via Gmail API`);
      try {
        const result = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: rawEmail
          }
        });
        
        console.log("Gmail API response status:", result.status);
        console.log("Gmail API response:", JSON.stringify(result.data, null, 2));
        
        if (result.status === 200) {
          console.log("Email successfully sent!");
          return new Response(JSON.stringify({ 
            success: true, 
            emailSent: true,
            message: "Email confirmation sent successfully",
            data: result.data
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } else {
          throw new Error(`Gmail API returned status: ${result.status}`);
        }
      } catch (sendError: any) {
        // Detailed error logging
        console.error("Error sending email via Gmail API:", sendError);
        
        if (sendError.response) {
          console.error("Gmail API error response:", {
            status: sendError.response.status,
            statusText: sendError.response.statusText,
            data: JSON.stringify(sendError.response.data)
          });
        }
        
        if (sendError.errors && sendError.errors.length > 0) {
          console.error("Gmail API errors:", JSON.stringify(sendError.errors));
        }
        
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
    } catch (emailError) {
      console.error("Email creation/setup error:", emailError);
      
      // Return a response indicating booking success but email failure
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false,
          message: "Booking confirmed but email could not be sent",
          error: emailError instanceof Error ? emailError.message : "Unknown email error"
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
