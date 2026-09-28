"""
IEEE YP Legacy Project - OTP Verification Backend Service
Sends email verification codes via Gmail SMTP using standard library smtplib.
"""

import http.server
import json
import os
import random
import smtplib
import socketserver
import time
from email.message import EmailMessage

# Configuration with fallback to provided user credentials
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "jibinwilson315@gmail.com").strip()
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "mgsa fudm uwus bdbn").strip()

PORT = int(os.environ.get("PORT", 5001))

# In-memory store for OTPs: { email.lower(): { "otp": "123456", "expires_at": float, "name": str } }
otp_storage = {}


def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = f"Verification Code: {otp_code} — IEEE YP Green Legacy Project"
    msg["From"] = f"IEEE YP Green Legacy <{GMAIL_ADDRESS}>"
    msg["To"] = to_email

    # Plaintext fallback
    plain_text = (
        f"Hello {recipient_name},\n\n"
        f"Thank you for signing up for the IEEE YP Green Legacy Project.\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n\n"
        f"If you did not request this, please ignore this email.\n\n"
        f"— IEEE Young Professionals Climate & Sustainability Taskforce"
    )
    msg.set_content(plain_text)

    # HTML rich email template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4fbf4; margin: 0; padding: 24px; color: #161d19; }}
        .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #c1c8c3; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }}
        .header {{ background: #0a2118; padding: 28px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0; font-size: 13px; color: #a2f0cc; font-weight: 500; }}
        .body {{ padding: 32px 28px; }}
        .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #004d36; }}
        .text {{ font-size: 14px; line-height: 1.6; color: #414845; margin-bottom: 24px; }}
        .otp-box {{ background: #e8f5e9; border: 2px dashed #2e7d32; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 34px; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 8px; color: #1b5e20; margin: 0; }}
        .otp-expiry {{ font-size: 12px; color: #558b2f; margin-top: 6px; font-weight: 600; }}
        .footer {{ background: #f0f7f2; padding: 18px 28px; text-align: center; font-size: 12px; color: #717975; border-top: 1px solid #e0e8e2; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>IEEE YP Green Legacy Project</h1>
          <p>Biometric Forest Telemetry &amp; GIS Verification</p>
        </div>
        <div class="body">
          <div class="greeting">Welcome, {recipient_name}!</div>
          <p class="text">
            You are registering for an account on the IEEE YP Green Legacy Project.
            Please use the secure One-Time Password (OTP) below to authenticate your email address.
          </p>
          <div class="otp-box">
            <div class="otp-code">{otp_code}</div>
            <div class="otp-expiry">Valid for 10 minutes</div>
          </div>
          <p class="text" style="font-size: 12px; color: #717975; margin-bottom: 0;">
            If you did not initiate this registration request, please disregard this email. Never share this code with anyone.
          </p>
        </div>
        <div class="footer">
          &copy; IEEE Young Professionals Climate &amp; Sustainability Taskforce (CSTF)
        </div>
      </div>
    </body>
    </html>
    """
    msg.add_alternative(html_content, subtype="html")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
        smtp.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        smtp.send_message(msg)


class OTPRequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _respond_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        if self.path in ("/api/health", "/"):
            self._respond_json(200, {
                "status": "online",
                "service": "IEEE YP Green Legacy OTP Verification Server",
                "smtp_configured": bool(GMAIL_ADDRESS and GMAIL_APP_PASSWORD)
            })
        else:
            self._respond_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path == "/api/send-otp":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._respond_json(400, {"success": False, "message": f"Invalid JSON payload: {str(e)}"})
                return

            email = str(data.get("email", "")).strip().lower()
            name = str(data.get("name", "Green Legacy Explorer")).strip() or "Green Legacy Explorer"

            if not email or "@" not in email:
                self._respond_json(400, {"success": False, "message": "A valid email address is required."})
                return

            # Generate 6-digit OTP
            otp_code = f"{random.randint(100000, 999999)}"
            expires_at = time.time() + 600  # 10 minutes

            # Store in memory
            otp_storage[email] = {
                "otp": otp_code,
                "expires_at": expires_at,
                "name": name
            }

            try:
                print(f"[OTP Server] Sending OTP {otp_code} to {email}...")
                send_otp_email(email, name, otp_code)
                print(f"[OTP Server] Email sent successfully to {email}!")
                self._respond_json(200, {
                    "success": True,
                    "message": f"Verification code successfully sent to {email}",
                    "expires_in": 600
                })
            except Exception as e:
                print(f"[OTP Server Error] Failed to send email: {e}")
                # In case SMTP throws error, still return descriptive error message
                self._respond_json(500, {
                    "success": False,
                    "message": f"Failed to send email via SMTP: {str(e)}"
                })

        elif self.path == "/api/verify-otp":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._respond_json(400, {"success": False, "message": f"Invalid JSON payload: {str(e)}"})
                return

            email = str(data.get("email", "")).strip().lower()
            entered_otp = str(data.get("otp", "")).strip().replace(" ", "").replace("-", "")

            if not email or not entered_otp:
                self._respond_json(400, {"success": False, "message": "Email and OTP code are required."})
                return

            record = otp_storage.get(email)
            if not record:
                self._respond_json(400, {"success": False, "message": "No verification request found for this email. Please request a new code."})
                return

            if time.time() > record["expires_at"]:
                del otp_storage[email]
                self._respond_json(400, {"success": False, "message": "Verification code has expired. Please request a new code."})
                return

            if record["otp"] != entered_otp:
                self._respond_json(400, {"success": False, "message": "Invalid verification code. Please check your email and try again."})
                return

            # Verification successful
            del otp_storage[email]
            print(f"[OTP Server] User {email} successfully verified!")
            self._respond_json(200, {
                "success": True,
                "message": "Email verified successfully!"
            })

        elif self.path == "/api/send-partner-request":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                data = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._respond_json(400, {"success": False, "message": f"Invalid JSON: {str(e)}"})
                return

            org_name    = str(data.get("orgName", "")).strip()
            contact     = str(data.get("contactName", "")).strip()
            email       = str(data.get("email", "")).strip()
            phone       = str(data.get("phone", "")).strip()
            org_type    = str(data.get("orgType", "")).strip()
            message     = str(data.get("message", "")).strip()

            if not org_name or not email or "@" not in email:
                self._respond_json(400, {"success": False, "message": "Organisation name and valid email are required."})
                return

            try:
                msg = EmailMessage()
                msg["Subject"] = f"New Partner Request — {org_name} | IEEE YP Green Legacy Project"
                msg["From"]    = f"IEEE YP Green Legacy <{GMAIL_ADDRESS}>"
                msg["To"]      = "jibinwilson315@gmail.com"
                msg["Reply-To"] = email

                plain = (
                    f"New Partnership Enquiry\n"
                    f"=======================\n"
                    f"Organisation : {org_name}\n"
                    f"Type         : {org_type}\n"
                    f"Contact      : {contact}\n"
                    f"Email        : {email}\n"
                    f"Phone        : {phone}\n\n"
                    f"Message:\n{message}\n\n"
                    f"— IEEE YP Green Legacy Project"
                )
                html = f"""<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4fbf4;padding:24px">
                <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #c1c8c3;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06)">
                  <div style="background:#0a2118;padding:24px;text-align:center;color:#fff">
                    <h1 style="margin:0;font-size:20px">New Partner Request</h1>
                    <p style="margin:4px 0 0;color:#a2f0cc;font-size:13px">IEEE YP Green Legacy Project</p>
                  </div>
                  <div style="padding:28px">
                    <table style="width:100%;border-collapse:collapse;font-size:14px">
                      <tr><td style="padding:6px 0;color:#555;width:140px">Organisation</td><td style="font-weight:700;color:#004d36">{org_name}</td></tr>
                      <tr><td style="padding:6px 0;color:#555">Type</td><td>{org_type}</td></tr>
                      <tr><td style="padding:6px 0;color:#555">Contact Person</td><td>{contact}</td></tr>
                      <tr><td style="padding:6px 0;color:#555">Email</td><td><a href="mailto:{email}">{email}</a></td></tr>
                      <tr><td style="padding:6px 0;color:#555">Phone</td><td>{phone}</td></tr>
                    </table>
                    <div style="margin-top:18px;padding:14px;background:#f0f7f2;border-radius:10px;font-size:14px;color:#333">
                      <strong>Message:</strong><br>{message if message else "<em>None provided</em>"}
                    </div>
                  </div>
                  <div style="background:#f0f7f2;padding:14px 28px;text-align:center;font-size:12px;color:#717975">
                    &copy; IEEE Young Professionals CSTF — Green Legacy Project
                  </div>
                </div></body></html>"""

                msg.set_content(plain)
                msg.add_alternative(html, subtype="html")

                with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
                    smtp.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
                    smtp.send_message(msg)

                print(f"[Partner Request] Sent partner enquiry from {email} ({org_name})")
                self._respond_json(200, {"success": True, "message": "Partner request sent successfully!"})
            except Exception as e:
                print(f"[Partner Request Error] {e}")
                self._respond_json(500, {"success": False, "message": f"Failed to send email: {str(e)}"})

        else:
            self._respond_json(404, {"error": "Endpoint not found"})


def run():
    print(f"==================================================")
    print(f" IEEE Tree Tag OTP Verification Server")
    print(f" Running on http://127.0.0.1:{PORT}")
    print(f" Sender: {GMAIL_ADDRESS}")
    print(f"==================================================")
    with socketserver.TCPServer(("0.0.0.0", PORT), OTPRequestHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    run()
