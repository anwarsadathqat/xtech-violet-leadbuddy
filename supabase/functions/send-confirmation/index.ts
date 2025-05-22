
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
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Gmail API credentials are not configured properly");
  }

  // Log the exact values to verify they're loaded correctly (be careful with secrets)
  console.log("Client ID is loaded and has length:", CLIENT_ID.length);
  console.log("Client Secret is loaded and has length:", CLIENT_SECRET.length);
  console.log("Refresh Token is loaded and has length:", REFRESH_TOKEN.length);

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URI
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  } catch (error) {
    console.error("Error setting up Gmail client:", error);
    throw error;
  }
};

// Create email content in base64 encoded format that's URL-safe with improved implementation
const createEmail = (to: string, subject: string, html: string): string => {
  try {
    console.log("Creating email to:", to);
    console.log("Email subject:", subject);
    
    const emailLines = [
      `To: ${to}`,
      'From: XTech Consulting <XtechInfoQat@gmail.com>',
      'Content-Type: text/html; charset=utf-8',
      `Subject: ${subject}`,
      '',
      html
    ];
    
    const emailContent = emailLines.join('\r\n');
    console.log("Email content created, length:", emailContent.length);

    // For Deno environment, use TextEncoder and btoa
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received booking confirmation request");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { name, email, date, timeSlot, service, phone, notes }: BookingConfirmationRequest = requestBody;
    console.log(`Processing booking for ${name} at ${email} for ${date} ${timeSlot}`);
    
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
    
    try {
      // Set up Gmail client with more robust error handling
      console.log("Setting up Gmail client...");
      let gmail;
      try {
        gmail = setupGmailClient();
        console.log("Gmail client initialized successfully");
      } catch (clientError) {
        console.error("Failed to initialize Gmail client:", clientError);
        throw clientError;
      }
      
      // Create the email content
      console.log("Creating email content...");
      let rawEmail;
      try {
        rawEmail = createEmail(
          email, 
          `Your ${service} Consultation is Confirmed`, 
          html
        );
        console.log("Email content created successfully");
      } catch (contentError) {
        console.error("Failed to create email content:", contentError);
        throw contentError;
      }
      
      console.log(`Sending email to: ${email} via Gmail API`);
      
      // Send email via Gmail API with detailed error handling
      try {
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: rawEmail
          }
        });
        
        console.log("Email API response status:", response.status);
        console.log("Email confirmation sent successfully:", JSON.stringify(response.data));
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: response.data,
          message: "Email sent successfully via Gmail API" 
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (sendError: any) {
        console.error("Error sending email via Gmail API:", sendError);
        
        // Add more detailed error logging specific to Gmail API
        if (sendError.response) {
          console.error("Gmail API response error:", {
            status: sendError.response.status,
            statusText: sendError.response.statusText,
            data: JSON.stringify(sendError.response.data)
          });
        } 
        
        if (sendError.message) {
          console.error("Error details:", sendError.message);
        }
        
        if (sendError.stack) {
          console.error("Error stack:", sendError.stack);
        }
        
        // Return a success response to the client even if email fails
        // This way the booking is still confirmed in the system
        return new Response(
          JSON.stringify({ 
            success: true, 
            emailSent: false,
            message: "Booking confirmed but email could not be sent. Please contact support.",
            error: sendError.message || "Unknown error sending email"
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } catch (emailError: any) {
      console.error("Error in email sending process:", emailError);
      
      // Return a success response to the client even if email fails
      // This way the booking is still confirmed in the system
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailSent: false,
          message: "Booking confirmed but email could not be sent. Please contact support.",
          error: emailError.message
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in booking confirmation function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
