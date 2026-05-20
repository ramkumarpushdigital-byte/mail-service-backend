import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const mail_service = async (req, res) => {

  // Safe fallback: prevents crash if req.body is undefined
  const { name, email, phone, message } = req.body || {};

  // Validate BEFORE doing anything else
  if (!name || !email || !phone || !message) {
    return res.status(400).json({ error: 'All fields (name, email, phone, message) are required' });
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'enqueryservice.pushdigital@gmail.com',
      pass: 'mfgr uipv fgmq wejc'
    }

  });

  const subject = "Business query from " + name;


  const mailOptions = {
    from: 'enqueryservice.pushdigital@gmail.com',
    to: 'ramkumar.pushdigital@gmail.com',
    subject: subject,

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
                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#888;
                    width:120px;
                  "
                >
                  Name
                </td>

                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#333;
                  "
                >
                  ${name}
                </td>
              </tr>

              <tr>
                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#888;
                  "
                >
                  Email
                </td>

                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#333;
                  "
                >
                  ${email}
                </td>
              </tr>

              <tr>
                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#888;
                  "
                >
                  Phone
                </td>

                <td 
                  style="
                    padding:10px;
                    border-bottom:1px solid #eee;
                    color:#333;
                  "
                >
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
              style="
                background:#f1fff1;
                border-left:4px solid #43EB01;
                border-radius:5px;
                margin-top:20px;
              "
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

            <span style="color:#43EB01; font-weight:bold;">
              Push Digital
            </span>

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
    const info = await transporter.sendMail(mailOptions);

    if (info.response.includes('250')) {
      console.log(`Email sent: ${info.response}`);
      return res.status(200).json({ message: 'Email sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    // Fix #3: Always send a response in catch so the client never hangs
    console.error(`Error sending email: ${error}`);
    return res.status(500).json({ error: 'An error occurred while sending the email' });
  }




}

export default mail_service;
