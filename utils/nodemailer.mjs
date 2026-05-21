import nodemailer from 'nodemailer';

// ─── Timeout config ────────────────────────────────────────────────────────────
// Read from env so it can be tuned per environment without code changes.
const TIMEOUT_MS = parseInt(process.env.SMTP_TIMEOUT_MS || '10000', 10);

// ─── Transporter (module-level singleton) ─────────────────────────────────────
// Created once at startup — not inside each request — so the TCP connection
// pool is reused.
//
// ⚠️  Gmail SMTP is intentionally NOT used here.
//     Google blocks SMTP connections originating from cloud provider IPs
//     (Render, Railway, Fly.io, etc.) for security reasons — auth will always
//     fail regardless of credentials.
//
// ✅  We use Brevo (formerly Sendinblue) SMTP instead:
//     • Free tier: 300 emails/day
//     • Port 587 (STARTTLS) — never blocked by Render
//     • Sign up: https://app.brevo.com → SMTP & API → Generate SMTP key
//     • Set BREVO_USER and BREVO_SMTP_KEY in your Render environment variables.
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,               // Port 2525 — alternative to 587, not blocked by Render egress filters
  secure: false,            // STARTTLS
  auth: {
    user: process.env.BREVO_USER,       // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,   // Brevo SMTP key (not your password)
  },
  // Layer 1 timeout: Nodemailer's own connection deadlines.
  connectionTimeout: TIMEOUT_MS,
  greetingTimeout:   TIMEOUT_MS,
  socketTimeout:     TIMEOUT_MS,
});

// ─── withTimeout ──────────────────────────────────────────────────────────────
// Layer 2 timeout: a hard Promise.race deadline.
// Acts as a safety net on cloud hosts where TCP connections may silently
// stall — guarantees the Promise always settles within `ms` milliseconds.
const withTimeout = (promise, ms) => {
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`SMTP timed out after ${ms}ms — Gmail may be blocking this host`)), ms)
  );
  return Promise.race([promise, deadline]);
};

// ─── verifyConnection ─────────────────────────────────────────────────────────
// Calls transporter.verify() with both timeout layers.
// Use at server startup and on the /api/health endpoint.
// Returns { success: true } or { success: false, error: string }.
// NEVER throws an unhandled error.
export const verifyConnection = async () => {
  try {
    await withTimeout(transporter.verify(), TIMEOUT_MS);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── sendEnquiryEmail ─────────────────────────────────────────────────────────
// Core email function. Decoupled from Express req/res so it can be tested
// independently and reused. Returns a result object — never throws.
export const sendEnquiryEmail = async ({ name, email, phone, message }) => {
  const mailOptions = {
    from:    process.env.EMAIL_FROM || '"Push Digital" <enqueryservice.pushdigital@gmail.com>',
    to:      process.env.ENQUIRY_RECIPIENT || 'ramkumarramar2237@gmail.com',
    subject: `Business query from ${name}`,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New Business Query</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f6f8">
  <tr>
    <td align="center">

      <!-- Main Container -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="margin:20px 0; border-radius:8px; overflow:hidden;">

        <!-- Banner -->
        <tr>
          <td style="background: linear-gradient(90deg, rgb(0, 68, 204) -44%, rgb(21, 184, 106) 92%); padding:20px; text-align:center;">
            
            <img 
              src="https://push.digital/images/logo-push-digital.png" 
              alt="Push Digital" 
              style="height:50px; width:auto;"
            >

            <h2 style="margin:15px 0 0; color:#ffffff; font-size:18px;">
              New Business Query
            </h2>

            <p style="margin:10px 0 0; color:#cccccc;">
              You have a new inquiry from ${name}
            </p>

          </td>
        </tr>

        <!-- Content Section -->
        <tr>
          <td style="padding:20px;">

            <p style="margin:0 0 15px; color:#333;">
              Hello, you received a new query with the following details:
            </p>

            <!-- Details Table -->
            <table 
              width="100%" 
              cellpadding="8" 
              cellspacing="0" 
              border="0" 
              style="border-collapse:collapse;"
            >

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#888; width:120px;">
                  Name
                </td>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#333;">
                  ${name}
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#888;">
                  Email
                </td>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#333;">
                  ${email}
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#888;">
                  Phone
                </td>
                <td style="padding:10px; border-bottom:1px solid #eee; color:#333;">
                  ${phone}
                </td>
              </tr>

            </table>

            <!-- Message Box -->
            <table 
              width="100%" 
              cellpadding="0" 
              cellspacing="0" 
              border="0" 
              style="background:#f1fff1; border-left:4px solid #43EB01; border-radius:5px; margin-top:20px;"
            >
              <tr>
                <td style="padding:15px; color:#333;">
                  <strong>Message:</strong>
                  <br><br>
                  ${message}
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Reply Button -->
        <tr>
          <td align="center" style="padding:20px;">
            <a 
              href="mailto:${email}" 
              style="
                background: linear-gradient(90deg, rgb(0, 68, 204) -44%, rgb(21, 184, 106) 92%);
                color:#0a0a0a;
                font-weight:bold;
                text-decoration:none;
                padding:12px 25px;
                border-radius:5px;
                display:inline-block;
              "
            >
              Reply to ${name}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td 
            style="
              background: linear-gradient(90deg, rgb(0, 68, 204) -44%, rgb(21, 184, 106) 92%);
              padding:15px;
              text-align:center;
              font-size:12px;
              color:#cccccc;
            "
          >
            <span style="color:#43EB01; font-weight:bold;">Push Digital</span>
            &mdash;
            This is an automated notification from your website contact form.
          </td>
        </tr>

      </table>
      <!-- End Container -->

    </td>
  </tr>
</table>

</body>
</html>`
  };

  try {
    console.log(`[emailService] Attempting to send email — from: ${mailOptions.from}, to: ${mailOptions.to}`);
    // withTimeout wraps sendMail as the second safety layer
    const info = await withTimeout(transporter.sendMail(mailOptions), TIMEOUT_MS);
    console.log(`[emailService] ✅ Email sent successfully. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[emailService] ❌ Failed to send email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─── mail_service (default export — backward-compatible route handler) ─────────
// Wraps sendEnquiryEmail for use as a direct Express route handler.
// Validates input, delegates to sendEnquiryEmail, and guarantees res.json()
// is called in ALL code paths.
const mail_service = async (req, res) => {
  // Safe fallback: prevents crash if body parsing failed (missing Content-Type header)
  const { name, email, phone, message } = req.body || {};

  // Validate BEFORE touching SMTP — returns 400 instantly
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Required fields missing: name, email, and message are required',
    });
  }

  try {
    const result = await sendEnquiryEmail({ name, email, phone, message });

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } else {
      // SMTP accepted the request but delivery failed (timeout, auth error, etc.)
      return res.status(502).json({ success: false, error: result.error });
    }
  } catch (error) {
    // Catch-all: sendEnquiryEmail should never throw, but this is the last safety net
    console.error(`[mail_service] Unexpected error: ${error.message}`);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export default mail_service;
