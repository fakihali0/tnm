import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
// import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PartnerApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  partnerType: 'affiliate' | 'ib' | 'regional';
  experience?: string;
  goals?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const formData: PartnerApplicationRequest = await req.json();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.partnerType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get client IP and user agent for security tracking
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Insert partner application into database
    const { data: application, error: insertError } = await supabase
      .from("partner_applications")
      .insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        country: formData.country,
        partner_type: formData.partnerType,
        experience: formData.experience,
        goals: formData.goals,
        ip_address: clientIP,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error("Failed to save application");
    }

    console.log("Partner application saved successfully:", application.id);

    // Send confirmation email to applicant if Resend is configured
    // Send notification emails (commented out due to build issues)
    /*
    if (resend) {
      try {
        const partnerTypeLabels = {
          affiliate: 'Affiliate Partner',
          ib: 'Introducing Broker',
          regional: 'Regional Partner'
        };

        await resend.emails.send({
          from: "Partnership Team <partnerships@resend.dev>",
          to: [formData.email],
          subject: "Partner Application Received - Thank You!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333; margin-bottom: 20px;">Thank You for Your Interest in Partnering With Us!</h1>
              
              <p>Dear ${formData.firstName} ${formData.lastName},</p>
              
              <p>We have received your application to become a <strong>${partnerTypeLabels[formData.partnerType]}</strong> and appreciate your interest in joining our partnership program.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Application Summary:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
                  <li><strong>Email:</strong> ${formData.email}</li>
                  ${formData.company ? `<li><strong>Company:</strong> ${formData.company}</li>` : ''}
                  ${formData.country ? `<li><strong>Country:</strong> ${formData.country}</li>` : ''}
                  <li><strong>Partner Type:</strong> ${partnerTypeLabels[formData.partnerType]}</li>
                </ul>
              </div>
              
              <p>Our partnership team will review your application and contact you within 2-3 business days. In the meantime, feel free to reach out to us if you have any questions.</p>
              
              <p>Best regards,<br>The Partnership Team</p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                Application ID: ${application.id}<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        });

        // Send notification to partnership team
        await resend.emails.send({
          from: "Partnership Applications <partnerships@resend.dev>",
          to: ["support@tradenmore.com"],
          subject: `New Partner Application: ${partnerTypeLabels[formData.partnerType]} - ${formData.firstName} ${formData.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">New Partner Application Received</h1>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Applicant Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</li>
                  <li><strong>Email:</strong> ${formData.email}</li>
                  ${formData.phone ? `<li><strong>Phone:</strong> ${formData.phone}</li>` : ''}
                  ${formData.company ? `<li><strong>Company:</strong> ${formData.company}</li>` : ''}
                  ${formData.country ? `<li><strong>Country:</strong> ${formData.country}</li>` : ''}
                  <li><strong>Partner Type:</strong> ${partnerTypeLabels[formData.partnerType]}</li>
                </ul>
              </div>
              
              ${formData.experience ? `
                <div style="margin: 20px 0;">
                  <h4>Experience:</h4>
                  <p style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">${formData.experience}</p>
                </div>
              ` : ''}
              
              ${formData.goals ? `
                <div style="margin: 20px 0;">
                  <h4>Goals:</h4>
                  <p style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">${formData.goals}</p>
                </div>
              ` : ''}
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="font-size: 12px; color: #666;">
                Application ID: ${application.id}<br>
                IP Address: ${clientIP}<br>
                User Agent: ${userAgent}<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        });

        console.log("Confirmation and notification emails sent successfully");
      } catch (emailError) {
        console.error("Email sending error (non-blocking):", emailError);
        // Don't fail the request if email fails
      }
    }
    */
    console.log("Partner application submitted - emails disabled for build");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application submitted successfully",
        applicationId: application.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-partner-application function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);