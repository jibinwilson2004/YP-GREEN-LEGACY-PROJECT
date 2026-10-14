import tls from 'node:tls'
import { config } from '../config'

function sendSmtpMessage(to: string, subject: string, plain: string, html: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!config.smtp.user || !config.smtp.pass) {
      console.log(`[SMTP (Dev Simulation)] To: ${to} | Subject: ${subject}\n${plain}`)
      return resolve(true)
    }

    const socket = tls.connect(465, 'smtp.gmail.com', { rejectUnauthorized: false }, () => {
      let step = 0

      const send = (cmd: string) => {
        socket.write(`${cmd}\r\n`)
      }

      socket.on('data', (data) => {
        const response = data.toString()
        const code = response.slice(0, 3)

        if (code.startsWith('4') || code.startsWith('5')) {
          console.warn('[SMTP Error]', response.trim())
          socket.end()
          return resolve(false)
        }

        if (step === 0 && code === '220') {
          step = 1
          send(`EHLO localhost`)
        } else if (step === 1 && code === '250') {
          step = 2
          send(`AUTH LOGIN`)
        } else if (step === 2 && code === '334') {
          step = 3
          send(Buffer.from(config.smtp.user).toString('base64'))
        } else if (step === 3 && code === '334') {
          step = 4
          send(Buffer.from(config.smtp.pass).toString('base64'))
        } else if (step === 4 && code === '235') {
          step = 5
          send(`MAIL FROM:<${config.smtp.user}>`)
        } else if (step === 5 && code === '250') {
          step = 6
          send(`RCPT TO:<${to}>`)
        } else if (step === 6 && code === '250') {
          step = 7
          send(`DATA`)
        } else if (step === 7 && code === '354') {
          step = 8
          const boundary = '=============_NextPart_001_============='
          const mimeMsg = [
            `From: "IEEE YP Green Legacy" <${config.smtp.user}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/alternative; boundary="${boundary}"`,
            ``,
            `--${boundary}`,
            `Content-Type: text/plain; charset=utf-8`,
            ``,
            plain,
            ``,
            `--${boundary}`,
            `Content-Type: text/html; charset=utf-8`,
            ``,
            html,
            ``,
            `--${boundary}--`,
            `.`,
          ].join('\r\n')
          socket.write(`${mimeMsg}\r\n`)
        } else if (step === 8 && code === '250') {
          socket.end()
          resolve(true)
        }
      })

      socket.on('error', (err) => {
        console.warn('[SMTP Socket Error]', err.message)
        resolve(false)
      })
    })

    socket.setTimeout(12000, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export const emailService = {
  async sendOtp(toEmail: string, recipientName: string, otpCode: string): Promise<boolean> {
    const subject = `Verification Code: ${otpCode} — IEEE YP Green Legacy Project`
    const plain = `Hello ${recipientName},\n\nYour verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\n— IEEE Young Professionals CSTF`
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family:sans-serif; background-color:#f4fbf4; padding:24px;">
        <div style="max-width:540px; margin:0 auto; background:#ffffff; border-radius:16px; border:1px solid #c1c8c3; overflow:hidden;">
          <div style="background:#0a2118; padding:28px; text-align:center; color:#ffffff;">
            <h1 style="margin:0; font-size:22px;">IEEE YP Green Legacy Project</h1>
            <p style="margin:6px 0 0; font-size:13px; color:#a2f0cc;">Biometric Forest Telemetry &amp; GIS Verification</p>
          </div>
          <div style="padding:32px 28px;">
            <div style="font-size:16px; font-weight:600; color:#004d36;">Welcome, ${recipientName}!</div>
            <p style="font-size:14px; line-height:1.6; color:#414845;">Please use the One-Time Password (OTP) below to authenticate your email address:</p>
            <div style="background:#e8f5e9; border:2px dashed #2e7d32; border-radius:12px; padding:18px; text-align:center; margin:24px 0;">
              <div style="font-size:34px; font-family:monospace; font-weight:800; letter-spacing:8px; color:#1b5e20;">${otpCode}</div>
              <div style="font-size:12px; color:#558b2f; margin-top:6px;">Valid for 10 minutes</div>
            </div>
          </div>
          <div style="background:#f0f7f2; padding:18px; text-align:center; font-size:12px; color:#717975;">
            &copy; IEEE Young Professionals Climate &amp; Sustainability Taskforce
          </div>
        </div>
      </body>
      </html>
    `
    return sendSmtpMessage(toEmail, subject, plain, html)
  },

  async notifyAdminNewTreeTag(treeId: string, species: string, planter: string, lat: number, lng: number): Promise<boolean> {
    const subject = `Action Required: New Tree Tag Request #${treeId} by ${planter}`
    const plain = `New Tree Tag Pending Verification\nTree ID: ${treeId}\nSpecies: ${species}\nPlanter: ${planter}\nLocation: ${lat}, ${lng}\n\nLog in to the Admin Dashboard to review.`
    const html = `
      <div style="font-family:sans-serif; padding:20px; background:#f4fbf4;">
        <h2>Action Required: New Tree Tag Submitted</h2>
        <p><strong>Tree ID:</strong> #${treeId}</p>
        <p><strong>Species:</strong> ${species}</p>
        <p><strong>Planter:</strong> ${planter}</p>
        <p><strong>Coordinates:</strong> ${lat}, ${lng}</p>
        <p>Please log in to the Admin Console to review and approve this record.</p>
      </div>
    `
    return sendSmtpMessage(config.smtp.adminRecipient, subject, plain, html)
  },

  async sendPartnerRequest(data: { orgName: string; contactName: string; email: string; phone: string; orgType: string; message: string }): Promise<boolean> {
    const subject = `New Partner Request — ${data.orgName} | IEEE YP Green Legacy`
    const plain = `New Partnership Enquiry\nOrg: ${data.orgName}\nContact: ${data.contactName}\nEmail: ${data.email}\nPhone: ${data.phone}\nType: ${data.orgType}\n\nMessage:\n${data.message}`
    const html = `
      <div style="font-family:sans-serif; padding:20px; background:#f4fbf4;">
        <h2>New Partner Request</h2>
        <p><strong>Organisation:</strong> ${data.orgName} (${data.orgType})</p>
        <p><strong>Contact:</strong> ${data.contactName} &lt;${data.email}&gt; | ${data.phone}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${data.message || 'No message provided'}</blockquote>
      </div>
    `
    return sendSmtpMessage(config.smtp.adminRecipient, subject, plain, html)
  },
}
