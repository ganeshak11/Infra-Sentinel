"""
email_notifier.py — Sends email on new alert via SMTP (Gmail).
"""

import os
import ssl
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("cyber-kavach.email")


def _format_alert_body(alert: dict) -> str:
    """Format the alert dict into a human-readable email body."""
    return (
        "🚨 Cyber Kavach Alert\n"
        "\n"
        f"Type:      {alert.get('type', 'N/A')}\n"
        f"Severity:  {alert.get('severity', 'N/A')}\n"
        f"Source IP: {alert.get('ip', 'N/A')}\n"
        f"Process:   {alert.get('process', 'N/A')}\n"
        f"Action:    {alert.get('action', 'N/A')}\n"
        f"Reason:    {alert.get('reason', 'N/A')}\n"
        f"Time:      {alert.get('timestamp', 'N/A')}\n"
    )


def send_email(alert: dict) -> None:
    """
    Send an email notification for the given alert.

    Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_EMAIL
    Fails silently (logs the error) so it never crashes the main API.
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    alert_email = os.getenv("ALERT_EMAIL")

    # If credentials are not configured, skip silently
    if not all([smtp_user, smtp_pass, alert_email]):
        logger.warning("Email not configured — skipping notification.")
        return

    # Narrow types after None guard (os.getenv returns str | None)
    smtp_user = str(smtp_user)
    smtp_pass = str(smtp_pass)
    alert_email = str(alert_email)

    severity = alert.get("severity", "UNKNOWN")
    alert_type = alert.get("type", "unknown")
    subject = f"[Cyber Kavach] {severity} Alert — {alert_type}"

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = alert_email
    msg["Subject"] = subject
    msg.attach(MIMEText(_format_alert_body(alert), "plain"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, alert_email, msg.as_string())
        logger.info("Alert email sent to %s", alert_email)
    except Exception as exc:
        logger.error("Failed to send alert email: %s", exc)

