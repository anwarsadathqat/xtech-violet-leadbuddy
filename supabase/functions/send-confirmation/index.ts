import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Function to refresh the access token using the refresh token
const refreshAccessToken = async ()=>{
  console.log("Refreshing access token...");
  const CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
  const REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");
  console.log("Credentials available:", {
    clientId: CLIENT_ID ? "✓" : "✗",
    clientSecret: CLIENT_SECRET ? "✓" : "✗",
    refreshToken: REFRESH_TOKEN ? "✓" : "✗"
  });
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
  console.log("Access token refreshed:", data.access_token);
  return data.access_token;
};
// Send email using Gmail API via raw HTTP request
const sendGmailEmail = async (to, subject, htmlContent)=>{
  try {
    console.log(`Attempting to send email to: ${to}`);
    // Refresh the access token
    const accessToken = await refreshAccessToken();
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
    const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
    console.log("Gmail API response:", JSON.stringify(data));
    return {
      success: true,
      messageId: data.id
    };
  } catch (error) {
    console.error("Error sending Gmail email:", error.message);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email"
    };
  }
};
// Create booking confirmation email HTML template
const createBookingConfirmationEmail = (data)=>{
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #6c22d8; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Booking Confirmation</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${data.name},</p>
        <p>Thank you for scheduling a consultation with XTech Consulting. Your appointment has been confirmed:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Service:</strong> ${data.service}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.timeSlot}</p>
        </div>
        
        <p>We've saved your contact information:</p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Phone: ${data.phone}</li>
          ${data.notes ? `<li>Notes: ${data.notes}</li>` : ''}
        </ul>
        
        <p>If you need to reschedule or have any questions, please contact our support team at <a href="mailto:XtechInfoQat@gmail.com">XtechInfoQat@gmail.com</a>.</p>
        
        <p>We look forward to speaking with you!</p>
        
        <p>Best regards,<br>XTech Consulting Team</p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
        <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
      </div>
    </div>
  `;
};
// Create contact form notification email HTML template
const createContactFormEmail = (data)=>{
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #6c22d8; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">New Message Received</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello XTech Team,</p>
        <p>You have received a new message from your website contact form:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Service Needed:</strong> ${data.service}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <p>Please respond to the inquiry at your earliest convenience.</p>
        
        <p>Best regards,<br>XTech Website Notification System</p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
        <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
      </div>
    </div>
  `;
};
// Create acknowledgement email for contact form submissions
const createContactAcknowledgementEmail = (data)=>{
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="background-color: #6c22d8; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Message Received</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
        <p>Hello ${data.name},</p>
        <p>Thank you for contacting XTech Consulting. We have received your message regarding ${data.service}.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Your message:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        
        <p>A member of our team will review your inquiry and get back to you shortly.</p>
        
        <p>For urgent matters, please contact us directly at:</p>
        <ul>
          <li>Email: <a href="mailto:XtechInfoQat@gmail.com">XtechInfoQat@gmail.com</a></li>
          <li>Phone: +974 1234 5678</li>
        </ul>
        
        <p>Best regards,<br>XTech Consulting Team</p>
      </div>
      
      <div style="text-align: center; padding-top: 20px; color: #777; font-size: 12px;">
        <p>© ${new Date().getFullYear()} XTech Consulting. All rights reserved.</p>
      </div>
    </div>
  `;
};
const handler = async (req)=>{
  console.log("Email request received");
  console.log("Request method:", req.method);
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log("Parsing request body...");
    const requestData = await req.json();
    console.log("Request body received:", JSON.stringify(requestData, null, 2));
    const data = requestData;
    // Determine email type and content based on isContactForm flag
    let emailSubject;
    let emailContent;
    let emailResult;
    let recipientEmail;
    if (data.isContactForm) {
      console.log("Processing contact form submission");
      // First send notification to admin
      emailSubject = `New Contact: ${data.service} Inquiry from ${data.name}`;
      emailContent = createContactFormEmail(data);
      recipientEmail = "XtechInfoQat@gmail.com"; // Admin email
      console.log("Sending admin notification email");
      emailResult = await sendGmailEmail(recipientEmail, emailSubject, emailContent);
      if (!emailResult.success) {
        console.error("Failed to send admin notification:", emailResult.error);
      // Continue to try sending customer acknowledgement
      }
      // Then send acknowledgement to customer
      emailSubject = `XTech Consulting: We've Received Your Message`;
      emailContent = createContactAcknowledgementEmail(data);
      recipientEmail = data.email;
      console.log("Sending customer acknowledgement email");
      emailResult = await sendGmailEmail(recipientEmail, emailSubject, emailContent);
    } else {
      console.log("Processing booking confirmation");
      emailSubject = `Your ${data.service} Consultation is Confirmed`;
      emailContent = createBookingConfirmationEmail(data);
      recipientEmail = data.email;
      console.log("Sending booking confirmation email");
      emailResult = await sendGmailEmail(recipientEmail, emailSubject, emailContent);
    }
    console.log("Gmail API result:", JSON.stringify(emailResult));
    if (!emailResult.success) {
      throw new Error(`Gmail API error: ${emailResult.error}`);
    }
    console.log("Email successfully sent!");
    return new Response(JSON.stringify({
      success: true,
      emailSent: true,
      message: "Email sent successfully",
      data: {
        messageId: emailResult.messageId
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in email sending function:", error);
    return new Response(JSON.stringify({
      success: false,
      emailSent: false,
      error: error instanceof Error ? error.message : "Unknown error in processing request"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
