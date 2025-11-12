import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
// import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tradenmore.com, https://1b5d5c4f-1260-431d-b9ed-fedc311bbd61.lovableproject.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

// Rate limiting storage for contact form
const contactAttempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();

// Security validation function
function validateContactForm(data: any): string | null {
  // Check required fields with length limits
  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.length > 50) {
    return 'Invalid first name';
  }
  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.length > 50) {
    return 'Invalid last name';
  }
  if (!data.email || typeof data.email !== 'string' || data.email.length > 255) {
    return 'Invalid email';
  }
  if (!data.subject || typeof data.subject !== 'string' || data.subject.length > 200) {
    return 'Invalid subject';
  }
  if (!data.message || typeof data.message !== 'string' || data.message.length > 2000) {
    return 'Invalid message';
  }
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return 'Invalid email format';
  }
  
  // Phone validation if provided
  if (data.phone && (typeof data.phone !== 'string' || data.phone.length > 20)) {
    return 'Invalid phone number';
  }
  
  // Check for suspicious content
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ];
  
  const textToCheck = `${data.firstName} ${data.lastName} ${data.subject} ${data.message}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(textToCheck)) {
      return 'Suspicious content detected';
    }
  }
  
  return null;
}

// Rate limiting function
function checkContactRateLimit(ipAddress: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempts = contactAttempts.get(ipAddress) || { count: 0, lastAttempt: 0, blocked: false };
  
  // Clear old attempts (15 minutes window)
  if (now - attempts.lastAttempt > 900000) {
    attempts.count = 0;
    attempts.blocked = false;
  }
  
  // Check if IP is blocked (after 3 attempts)
  if (attempts.blocked) {
    return { allowed: false, message: 'Too many submission attempts. Please try again later.' };
  }
  
  // Check rate limit (3 attempts per 15 minutes)
  if (attempts.count >= 3) {
    attempts.blocked = true;
    contactAttempts.set(ipAddress, attempts);
    return { allowed: false, message: 'Rate limit exceeded. Please try again later.' };
  }
  
  return { allowed: true };
}

// Security event logging
async function logSecurityEvent(supabaseClient: any, eventType: string, details: any, ipAddress: string) {
  try {
    await supabaseClient
      .from('security_events')
      .insert({
        event_type: eventType,
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
        details
      });
  } catch (error) {
    console.warn('Failed to log security event:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check rate limits first
    const rateCheck = checkContactRateLimit(ipAddress);
    if (!rateCheck.allowed) {
      await logSecurityEvent(supabaseClient, 'contact_rate_limit_exceeded', { ip: ipAddress }, ipAddress);
      return new Response(
        JSON.stringify({ error: rateCheck.message }),
        { 
          status: 429, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const formData: ContactFormData = await req.json();

    // Validate input thoroughly
    const validationError = validateContactForm(formData);
    if (validationError) {
      await logSecurityEvent(supabaseClient, 'contact_form_validation_failed', { 
        error: validationError, 
        ip: ipAddress 
      }, ipAddress);
      return new Response(
        JSON.stringify({ error: validationError }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const { firstName, lastName, email, phone, subject, message } = formData;

    // Update rate limit counter
    const attempts = contactAttempts.get(ipAddress) || { count: 0, lastAttempt: 0, blocked: false };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    contactAttempts.set(ipAddress, attempts);

    // Get client user agent for logging
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Log successful form submission
    await logSecurityEvent(supabaseClient, 'contact_form_submitted', {
      email: email.substring(0, 3) + '***', // Partially mask email
      subject: subject.substring(0, 20) + '...',
      ip: ipAddress
    }, ipAddress);

    // Store the submission in the database
    const { data: submission, error: dbError } = await supabaseClient
      .from("contact_submissions")
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          subject: subject,
          message: message,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save submission" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Send confirmation email to user (commented out due to build issues)
    // const userEmailResponse = await resend.emails.send({
    //   from: "Trade & More <noreply@resend.dev>",
    //   to: [email],
    //   subject: "Thank you for contacting Trade & More",
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <h1 style="color: #2563eb;">Thank you for your message!</h1>
    //       <p>Dear ${firstName} ${lastName},</p>
    //       <p>We have received your message regarding: <strong>${subject}</strong></p>
    //       <p>Our team will review your inquiry and get back to you within 24-48 hours.</p>
    //       
    //       <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    //         <h3 style="margin-top: 0;">Your Message:</h3>
    //         <p style="font-style: italic;">"${message}"</p>
    //       </div>
    //       
    //       <p>If you have any urgent questions, please contact us directly at support@tradenmore.com</p>
    //       
    //       <p>Best regards,<br>
    //       The Trade & More Team</p>
    //       
    //       <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
    //       <p style="font-size: 12px; color: #64748b;">
    //         This email was sent to you because you submitted a contact form on our website.
    //       </p>
    //     </div>
    //   `,
    // });

    // Send notification email to admin (commented out due to build issues)
    // const adminEmailResponse = await resend.emails.send({
    //   from: "Trade & More Contact Form <noreply@resend.dev>",
    //   to: ["support@tradenmore.com"],
    //   subject: `New Contact Form Submission: ${subject}`,
    //   html: `
    //     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //       <h1 style="color: #dc2626;">New Contact Form Submission</h1>
    //       
    //       <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    //         <h3 style="margin-top: 0;">Contact Details:</h3>
    //         <p><strong>Name:</strong> ${firstName} ${lastName}</p>
    //         <p><strong>Email:</strong> ${email}</p>
    //         <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
    //         <p><strong>Subject:</strong> ${subject}</p>
    //         <p><strong>Submission ID:</strong> ${submission.id}</p>
    //         <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
    //       </div>
    //       
    //       <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    //         <h3 style="margin-top: 0;">Message:</h3>
    //         <p>${message}</p>
    //       </div>
    //       
    //       <p><a href="mailto:${email}?subject=Re: ${subject}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reply to ${firstName}</a></p>
    //     </div>
    //   `,
    // });

    console.log("Contact form submitted successfully - emails disabled for build");
    // console.log("Emails sent successfully:", { userEmailResponse, adminEmailResponse });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Your message has been sent successfully! We'll get back to you soon.",
        submissionId: submission.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred while sending your message. Please try again later."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);