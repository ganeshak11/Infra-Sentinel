"""
sender.py — POSTs alert JSON to the backend API.

Sends each alert to BACKEND_URL/alerts via HTTP POST.
Retries once on failure. Logs success or failure.
"""

import logging
import requests

logger = logging.getLogger("sender")


def send_alert(alert, config):
    """
    POST the alert dict as JSON to the backend.

    Args:
        alert:  dict following the standard alert format
        config: dict with at least "backend_url" (str)
    """
    url = f"{config['backend_url']}/alerts"
    max_retries = 2  # 1 original attempt + 1 retry

    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.post(url, json=alert, timeout=10)

            if resp.status_code in (200, 201):
                logger.info(
                    "Alert %s sent successfully → %s (HTTP %d)",
                    alert["id"], url, resp.status_code,
                )
                return True
            else:
                logger.warning(
                    "Backend returned HTTP %d for alert %s (attempt %d/%d): %s",
                    resp.status_code, alert["id"], attempt, max_retries,
                    resp.text[:200],
                )

        except requests.ConnectionError:
            logger.warning(
                "Connection failed to %s (attempt %d/%d) — backend may be down.",
                url, attempt, max_retries,
            )
        except requests.Timeout:
            logger.warning(
                "Request timed out to %s (attempt %d/%d).",
                url, attempt, max_retries,
            )
        except requests.RequestException as exc:
            logger.error(
                "Unexpected error sending alert %s (attempt %d/%d): %s",
                alert["id"], attempt, max_retries, exc,
            )

    logger.error(
        "❌ Failed to send alert %s after %d attempts.", alert["id"], max_retries
    )
    return False
