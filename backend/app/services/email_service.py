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
        <p><a href="http://localhost:5173/chat">Talk to Eunoia</a></p>
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
        <p>Student <b>{student_name}</b> has been assigned to you.</p>
        <p>Stress level: {summary.get("stress_level", "—")}</p>
        <p>Concern: {summary.get("primary_concern", "—")}</p>
        <p>Topics: {topics}</p>
        <p>Risk flags: {flags}</p>
        <p>Notes: {summary.get("mentor_notes", "—")}</p>
        <p><a href="http://localhost:5173/mentor">View in Mentor Portal</a></p>
        """
    )


def send_password_reset_email(email: str, name: str, token: str):
    _send(
        to_email=email,
        subject="Eunoia — Reset your password",
        html_body=f"""
        <p>Hi {name},</p>
        <p>Click below to reset your password. This link expires in 1 hour.</p>
        <p><a href="http://localhost:5173/reset-password?token={token}"
           style="background:#4A6B4C;color:white;padding:10px 20px;
           border-radius:8px;text-decoration:none;font-weight:bold">
           Reset Password
        </a></p>
        <p>If you didn't request this, ignore this email.</p>
        """
    )
def send_mentor_registration_email(mentor_email: str, mentor_name: str):
    _send(
        to_email=mentor_email,
        subject="Eunoia — Your mentor account is pending approval",
        html_body=f"""
        <p>Hi {mentor_name},</p>
        <p>Thank you for registering as a mentor on Eunoia.</p>
        <p>Your account is currently <b>pending admin approval</b>.
        You will receive another email once your account has been verified.</p>
        <p>— The Eunoia Team</p>
        """
    )    