# backend/app/services/email_service.py
import sendgrid
from sendgrid.helpers.mail import Mail
from app.core.config import settings

def _send(to_email: str, subject: str, html_body: str):
    if not settings.SENDGRID_API_KEY:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
        return
    sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    message = Mail(
        from_email=settings.FROM_EMAIL,
        to_emails=to_email,
        subject=subject,
        html_content=html_body,
    )
    sg.send(message)

def send_burnout_alert(student_email: str, student_name: str):
    _send(
        to_email=student_email,
        subject="Eunoia — Weekly Well-being Check-in",
        html_body=f"""
        <p>Hi {student_name},</p>
        <p>Based on this week's academic data, our system has flagged that you
        may be experiencing higher stress than usual.</p>
        <p>We'd love to check in with you. Click below to have a quick chat
        with Eunoia — it only takes a few minutes and is completely confidential.</p>
        <p><a href="http://localhost:5173/chat" style="
            background:#6366f1;color:white;padding:10px 20px;
            border-radius:8px;text-decoration:none;font-weight:bold">
            Talk to Eunoia →
        </a></p>
        <p>You're doing great. We just want to make sure you have the support you need.</p>
        <p>— The Eunoia Team</p>
        """
    )

def send_mentor_assignment_email(
    mentor_email: str,
    mentor_name: str,
    student_name: str,
    summary: dict,
):
    topics = ", ".join(summary.get("key_topics", [])) or "General stress"
    flags = ", ".join(summary.get("risk_flags", [])) or "None"
    _send(
        to_email=mentor_email,
        subject=f"Eunoia — New student assigned: {student_name}",
        html_body=f"""
        <p>Hi {mentor_name},</p>
        <p>A student has been assigned to you following a high-stress chat session.</p>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif">
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Student</td>
              <td style="padding:8px">{student_name}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Stress Level</td>
              <td style="padding:8px">{summary.get("stress_level","—").upper()}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Primary Concern</td>
              <td style="padding:8px">{summary.get("primary_concern","—")}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Topics Discussed</td>
              <td style="padding:8px">{topics}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Risk Flags</td>
              <td style="padding:8px">{flags}</td></tr>
          <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Your Notes</td>
              <td style="padding:8px">{summary.get("mentor_notes","—")}</td></tr>
        </table>
        <p><a href="http://localhost:5173/mentor" style="
            background:#6366f1;color:white;padding:10px 20px;
            border-radius:8px;text-decoration:none;font-weight:bold">
            View in Mentor Portal →
        </a></p>
        <p>— Eunoia System</p>
        """
    )
def send_mentor_approved_email(email: str, name: str):
    _send(
        to_email=email,
        subject="Eunoia — Your mentor account has been approved!",
        html_body=f"""
        <p>Hi {name},</p>
        <p>Great news! Your mentor account on Eunoia has been <b>approved</b> by the admin.</p>
        <p>You can now log in and start supporting students.</p>
        <p><a href="http://localhost:5173/login"
           style="background:#4A6B4C;color:white;padding:10px 20px;
           border-radius:8px;text-decoration:none;font-weight:bold">
           Login now →
        </a></p>
        <p>— The Eunoia Team</p>
        """
    )    