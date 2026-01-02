const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const getSupportEmailTemplate = (title: string, messageHtml: string, targetPath?: string) => {
  const cleanBaseUrl = BASE_URL.replace(/\/$/, "");
  const finalLink = targetPath 
    ? (targetPath.startsWith("http") ? targetPath : `${cleanBaseUrl}${targetPath}`)
    : `${cleanBaseUrl}/tickets`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5; 
      color: #18181b;
    }
    
    a { text-decoration: none; }
    
    /* Tombol Hover Effect */
    .btn-primary:hover { 
      background-color: #1d4ed8 !important; 
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2) !important;
    }

    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content-wrap { padding: 24px !important; }
      .message-box { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025); border: 1px solid #e4e4e7;">
          
          <tr>
            <td align="center" style="padding: 40px 0 20px 0; background-color: #ffffff;">
              <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 12px;">
                <img src="https://img.icons8.com/fluency/96/bell.png" alt="Notification" width="48" height="48" style="display: block; border: 0;" />
              </div>
            </td>
          </tr>

          <tr>
            <td class="content-wrap" style="padding: 0 48px 48px 48px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <span style="font-size: 13px; font-weight: 500; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
                      TAKON AI SUPPORT
                    </span>
                  </td>
                </tr>

                <tr>
                  <td align="left" style="padding-bottom: 32px;">
                    <div class="message-box" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 24px; text-align: left;">
                      <div style="font-size: 15px; color: #3f3f46; line-height: 1.6; font-weight: 400;">
                        ${messageHtml}
                      </div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="${finalLink}" target="_blank" class="btn-primary" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 50px; transition: all 0.2s ease;">
                      Lihat Detail Tiket
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="border-top: 1px solid #f4f4f5; padding-bottom: 24px;"></td>
                </tr>

                <tr>
                  <td align="center" style="font-size: 12px; color: #a1a1aa; line-height: 1.5;">
                    <p style="margin: 0;">
                      Tombol tidak berfungsi? Salin tautan berikut ke browser Anda:<br>
                      <a href="${finalLink}" style="color: #2563eb; text-decoration: underline;">${finalLink}</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; font-weight: 500;">
                &copy; ${new Date().getFullYear()} Takon AI Inc. <br>
                Pemalang, Indonesia.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
};