from datetime import datetime, timezone
from uuid import uuid4
import base64
import io
import re

CERTIFICATE_BUCKET = "kaizen-attachments"
CERTIFICATE_TEMPLATE_PATH = "certificate-templates/kaizen-certificate-2026.png"
CERTIFICATE_WIDTH = 841
CERTIFICATE_HEIGHT = 594


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def unwrap(value):
    if isinstance(value, dict) and isinstance(value.get("data"), dict):
        return value["data"]
    return value


def rows_from_result(value):
    value = unwrap(value)
    if isinstance(value, dict):
        for key in ["data", "results", "rows"]:
            if isinstance(value.get(key), list):
                return value[key]
    if isinstance(value, list):
        return value
    return []


def escape_xml(value):
    text = str(value or "")
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def clean_text(value):
    return " ".join(str(value or "").split())


def to_number(value, fallback=0):
    if value in (None, ""):
        return fallback
    try:
        return float(value)
    except Exception:
        return fallback


def format_money(value):
    amount = to_number(value, 0)
    if amount <= 0:
        return "$0"
    return "${:,.0f}".format(amount)


def certificate_issue_date(value):
    if not value:
        return datetime.now(timezone.utc).strftime("%b %d, %Y")
    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text).strftime("%b %d, %Y")
    except Exception:
        return str(value).split("T")[0]


def bytes_from_storage_payload(payload):
    if isinstance(payload, bytes):
        return payload
    if isinstance(payload, bytearray):
        return bytes(payload)
    if hasattr(payload, "read"):
        return payload.read()
    if isinstance(payload, str):
        return payload.encode("utf-8")
    if isinstance(payload, dict):
        for key in ["content", "data", "file", "body"]:
            value = payload.get(key)
            if isinstance(value, bytes):
                return value
            if isinstance(value, str):
                try:
                    return base64.b64decode(value)
                except Exception:
                    return value.encode("utf-8")
    try:
        return bytes(payload)
    except Exception:
        return b""


def safe_slug(value):
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", str(value or "kaizen")).strip("-")
    return slug or "kaizen"


def certificate_path_for(idea):
    key = idea.get("kaizen_id") or idea.get("id") or str(uuid4())
    return "certificates/" + safe_slug(key) + ".svg"


def split_long_word(word, limit):
    parts = []
    while len(word) > limit:
        parts.append(word[:limit])
        word = word[limit:]
    if word:
        parts.append(word)
    return parts


def wrap_lines(value, max_chars=120, line_chars=44, max_lines=4):
    text = clean_text(value)
    if not text:
        return ["Kaizen improvement"]
    if len(text) > max_chars:
        text = text[: max_chars - 3].rstrip() + "..."

    lines = []
    current = ""
    words = []
    for word in text.split(" "):
        words.extend(split_long_word(word, line_chars))

    for word in words:
        candidate = word if not current else current + " " + word
        if len(candidate) <= line_chars:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
        if len(lines) >= max_lines:
            break

    if current and len(lines) < max_lines:
        lines.append(current)
    return lines or ["Kaizen improvement"]


def estimated_char_width(char, font_size):
    if char == " ":
        factor = 0.34
    elif char in "ilI.,:;|'!":
        factor = 0.28
    elif char in "mwMW@#%&":
        factor = 0.82
    elif char.isupper():
        factor = 0.66
    elif char.isdigit():
        factor = 0.56
    elif char in "-_/\\()[]{}":
        factor = 0.42
    else:
        factor = 0.56
    return font_size * factor


def estimated_text_width(value, font_size):
    return sum(estimated_char_width(char, font_size) for char in str(value or ""))


def split_word_by_width(word, max_width, font_size):
    parts = []
    current = ""
    for char in word:
        candidate = current + char
        if current and estimated_text_width(candidate, font_size) > max_width:
            parts.append(current)
            current = char
        else:
            current = candidate
    if current:
        parts.append(current)
    return parts


def wrap_lines_by_width(value, max_chars, max_width, font_size, max_lines):
    text = clean_text(value)
    if not text:
        return ["Kaizen improvement"], False
    if len(text) > max_chars:
        text = text[: max_chars - 3].rstrip() + "..."

    words = []
    for word in text.split(" "):
        if estimated_text_width(word, font_size) > max_width:
            words.extend(split_word_by_width(word, max_width, font_size))
        else:
            words.append(word)

    lines = []
    current = ""
    truncated = False
    for index, word in enumerate(words):
        candidate = word if not current else current + " " + word
        if estimated_text_width(candidate, font_size) <= max_width:
            current = candidate
            continue

        if current:
            lines.append(current)
        current = word

        if len(lines) >= max_lines:
            truncated = True
            remaining = " ".join(words[index:])
            ellipsis = "..."
            while current and estimated_text_width(current + ellipsis, font_size) > max_width:
                current = current[:-1].rstrip()
            lines[-1] = (lines[-1].rstrip(".") + ellipsis) if remaining else lines[-1]
            current = ""
            break

    if current and len(lines) < max_lines:
        lines.append(current)
    elif current:
        truncated = True

    return lines or ["Kaizen improvement"], truncated


def tspans(lines, x, line_step):
    result = []
    for index, line in enumerate(lines):
        dy = 0 if index == 0 else line_step
        result.append(f'<tspan x="{x}" dy="{dy}">{escape_xml(line)}</tspan>')
    return "".join(result)


def certificate_svg(idea, issued_at=None, template_bytes=None):
    recipient = clean_text(idea.get("submitted_by_name") or idea.get("submitted_by_username") or "Kaizen Contributor")
    title = clean_text(idea.get("title") or idea.get("kaizen_id") or "Kaizen improvement")
    issue_date = certificate_issue_date(issued_at or idea.get("closed_at") or idea.get("updated_at"))
    template_data = ""
    if template_bytes:
        template_data = base64.b64encode(bytes_from_storage_payload(template_bytes)).decode("ascii")

    name_lines = wrap_lines(recipient, max_chars=120, line_chars=30, max_lines=2)
    detail_x = 98
    detail_width = 642
    title_font = 17
    title_lines, title_truncated = wrap_lines_by_width(title, 120, detail_width, title_font, 1)
    if title_truncated or len(title_lines) > 1:
        for candidate_font in [13, 12, 11]:
            candidate_lines, candidate_truncated = wrap_lines_by_width(title, 120, detail_width, candidate_font, 2)
            title_font = candidate_font
            title_lines = candidate_lines
            title_truncated = candidate_truncated
            if not candidate_truncated:
                break
    name_font = 39 if len(name_lines) == 1 and len(name_lines[0]) <= 24 else 31
    lead_font = 17
    title_y = 346 if len(title_lines) == 1 else 341
    title_line_step = 22 if len(title_lines) == 1 else title_font + 4
    program_y = title_y + ((len(title_lines) - 1) * title_line_step) + 23
    date_y = program_y + 24
    details_rect_height = date_y - 305 + 15

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{CERTIFICATE_WIDTH}" height="{CERTIFICATE_HEIGHT}" viewBox="0 0 {CERTIFICATE_WIDTH} {CERTIFICATE_HEIGHT}">
  {'<image width="' + str(CERTIFICATE_WIDTH) + '" height="' + str(CERTIFICATE_HEIGHT) + '" href="data:image/png;base64,' + template_data + '"/>' if template_data else '<rect width="841" height="594" fill="#eaf8ff"/>'}
  <rect x="92" y="214" width="300" height="62" fill="#eaf8ff" fill-opacity="0.96"/>
  <text x="99" y="258" fill="#2f7de1" font-size="{name_font}" font-family="Brush Script MT, Segoe Script, cursive" font-weight="700">{tspans(name_lines, 99, 38)}</text>
  <rect x="93" y="305" width="650" height="{details_rect_height}" fill="#eaf8ff"/>
  <text x="{detail_x}" y="326" fill="#263238" font-size="{lead_font}" font-family="Arial, Helvetica, sans-serif">For successfully completing</text>
  <text x="{detail_x}" y="{title_y}" fill="#263238" font-size="{title_font}" font-family="Arial, Helvetica, sans-serif" font-weight="700">{tspans(title_lines, detail_x, title_line_step)}</text>
  <text x="{detail_x}" y="{program_y}" fill="#263238" font-size="{lead_font}" font-family="Arial, Helvetica, sans-serif">under the</text>
  <text x="177" y="{program_y}" fill="#263238" font-size="{lead_font}" font-family="Arial, Helvetica, sans-serif" font-weight="700">KAIZEN PROGRAM.</text>
  <text x="{detail_x}" y="{date_y}" fill="#263238" font-size="17" font-family="Arial, Helvetica, sans-serif">Issue Date:</text>
  <text x="205" y="{date_y}" fill="#263238" font-size="17" font-family="Arial, Helvetica, sans-serif">{escape_xml(issue_date)}</text>
</svg>'''


def certificate_html(idea, template_bytes=None):
    svg = certificate_svg(idea, template_bytes=template_bytes)
    return (
        "<!doctype html><html><head><meta charset='utf-8'/>"
        "<style>body{margin:0;background:#eef2f6;display:grid;place-items:center;min-height:100vh}"
        "svg{max-width:100%;height:auto;box-shadow:0 12px 36px rgba(0,0,0,.16)}</style></head><body>"
        + svg
        + "</body></html>"
    )


def upload_certificate_file(sdk_client, path, svg_text):
    filename = path.split("/")[-1] or "kaizen-certificate.svg"
    return sdk_client.storage.from_(CERTIFICATE_BUCKET).upload(
        files=[(filename, io.BytesIO(svg_text.encode("utf-8")))],
        paths=[path],
        metadatas=[{"description": "Generated Kaizen certificate", "content_type": "image/svg+xml"}],
    )


def existing_certificate(db, idea_id):
    result = db.from_("kaizen_certificates").filter("idea_id", "eq", idea_id).page_size(1).execute()
    rows = rows_from_result(result)
    return rows[0] if rows else None


def build_certificate_row(idea, path, issued_at):
    kaizen_id = idea.get("kaizen_id") or str(idea.get("id"))
    return {
        "certificate_number": "CERT/" + kaizen_id,
        "recipient_username": idea.get("submitted_by_username"),
        "recipient_email": idea.get("submitted_by_email"),
        "recipient_name": idea.get("submitted_by_name") or idea.get("submitted_by_username"),
        "status": "Generated",
        "certificate_path": path,
        "reward_amount": to_number(idea.get("reward_amount"), 0),
        "issued_at": issued_at,
    }


def regenerate_certificate(db, sdk_client, idea_id):
    if not idea_id:
        return {"success": False, "error": "idea_id is required"}
    idea = unwrap(db.get("kaizen_ideas", record_id=idea_id))
    if not isinstance(idea, dict):
        return {"success": False, "error": "Kaizen idea not found"}

    issued_at = idea.get("closed_at") or idea.get("updated_at") or now_iso()
    path = idea.get("certificate_path") or certificate_path_for(idea)
    template_bytes = sdk_client.storage.from_(CERTIFICATE_BUCKET).download(CERTIFICATE_TEMPLATE_PATH)
    svg = certificate_svg(idea, issued_at, template_bytes)
    upload_certificate_file(sdk_client, path, svg)

    row = build_certificate_row(idea, path, issued_at)
    existing = existing_certificate(db, idea_id)
    if existing and existing.get("id"):
        certificate = unwrap(db.update("kaizen_certificates", record_id=existing.get("id"), data=row))
    else:
        row["id"] = str(uuid4())
        row["idea_id"] = idea_id
        certificate = unwrap(db.create("kaizen_certificates", row))

    try:
        db.update("kaizen_ideas", record_id=idea_id, data={"certificate_path": path, "updated_at": now_iso()})
    except Exception:
        pass
    return {"success": True, "certificate": certificate, "certificate_path": path}


def data_url_bytes(value):
    text = str(value or "")
    if "," in text and text.lower().startswith("data:"):
        text = text.split(",", 1)[1]
    return base64.b64decode(text)


def upload_template(params, sdk_client):
    path = params.get("path") or "certificate-templates/kaizen-certificate-2026.png"
    content_type = params.get("content_type") or "application/octet-stream"
    file_base64 = params.get("file_base64")
    if not file_base64:
        return {"success": False, "error": "file_base64 is required"}
    filename = path.split("/")[-1] or "certificate-template"
    sdk_client.storage.from_(CERTIFICATE_BUCKET).upload(
        files=[(filename, io.BytesIO(data_url_bytes(file_base64)))],
        paths=[path],
        metadatas=[{"description": "Certificate template asset", "content_type": content_type}],
    )
    return {"success": True, "path": path}


def save_template(params, user_data, db):
    now = now_iso()
    row = {
        "template_key": params.get("template_key") or "kaizen-certificate-2026",
        "name": params.get("name") or "Kaizen Certificate 2026",
        "certificate_type": params.get("certificate_type") or "Standard Kaizen Certificate",
        "version": int(to_number(params.get("version"), 1) or 1),
        "status": params.get("status") or "Active",
        "is_default": bool(params.get("is_default")),
        "page_size": params.get("page_size") or "A4",
        "orientation": params.get("orientation") or "Landscape",
        "background_path": params.get("background_path") or "",
        "logo_config": params.get("logo_config") or {},
        "text_fields": params.get("text_fields") or {},
        "signature_config": params.get("signature_config") or {},
        "style_config": params.get("style_config") or {},
        "placeholders": params.get("placeholders") or ["Employee_Name", "Kaizen_Title", "Issue_Date"],
        "preview_html": certificate_html({
            "submitted_by_name": "QA Employee",
            "title": "Sample Kaizen Title",
            "kaizen_id": "KZN/2026/SAMPLE",
            "department_name": "Managed Services",
            "category": "Productivity",
            "client_name": "Sample Client",
            "process_name": "Sample Process",
            "reward_amount": 0,
        }),
        "created_by_username": params.get("created_by_username") or (user_data or {}).get("username") or "system",
        "updated_at": now,
    }
    template_id = params.get("id")
    if template_id:
        template = unwrap(db.update("kaizen_certificate_templates", record_id=template_id, data=row))
    else:
        row["id"] = str(uuid4())
        row["created_at"] = now
        template = unwrap(db.create("kaizen_certificate_templates", row))
        template_id = row["id"]
    if row["is_default"]:
        set_default_template(db, template_id)
    return {"success": True, "template": template}


def set_default_template(db, template_id):
    if not template_id:
        return {"success": False, "error": "id is required"}
    rows = rows_from_result(db.from_("kaizen_certificate_templates").page_size(200).execute())
    for row in rows:
        if row.get("id"):
            db.update("kaizen_certificate_templates", record_id=row.get("id"), data={"is_default": row.get("id") == template_id, "updated_at": now_iso()})
    template = unwrap(db.get("kaizen_certificate_templates", record_id=template_id))
    return {"success": True, "template": template}


def preview(params, sdk_client):
    sample = params.get("sample") if isinstance(params.get("sample"), dict) else {}
    idea = {
        "submitted_by_name": sample.get("Employee_Name") or sample.get("recipient_name") or "QA Kaizen Employee Appbuild",
        "title": sample.get("Kaizen_Title") or sample.get("title") or "Sample Kaizen Title",
        "kaizen_id": sample.get("Kaizen_ID") or "KZN/2026/MS/001",
        "department_name": sample.get("Department") or "Managed Services",
        "category": sample.get("Category") or "Productivity",
        "client_name": sample.get("Client") or "All Spectrum",
        "process_name": sample.get("Process") or "Policy Checking",
        "reward_amount": sample.get("Reward") or 0,
        "closed_at": sample.get("Issue_Date") or now_iso(),
    }
    try:
        template_bytes = sdk_client.storage.from_(CERTIFICATE_BUCKET).download(CERTIFICATE_TEMPLATE_PATH)
    except Exception:
        template_bytes = None
    return {"success": True, "preview_html": certificate_html(idea, template_bytes)}


def main(params, user_data, sdk_client):
    params = params or {}
    action = params.get("action") or "preview"

    if action == "preview":
        return preview(params, sdk_client)
    if action == "upload_template":
        return upload_template(params, sdk_client)

    db = sdk_client.database
    if action == "save":
        return save_template(params, user_data, db)
    if action == "set_default":
        return set_default_template(db, params.get("id"))
    if action == "regenerate":
        return regenerate_certificate(db, sdk_client, params.get("idea_id"))
    return {"success": False, "error": "Unsupported action"}
