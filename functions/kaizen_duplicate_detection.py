from datetime import datetime, timezone
from uuid import uuid4
import hashlib
import logging
import math
import re

logger = logging.getLogger(__name__)

MODEL = "text-embedding-3-small"
DIMENSIONS = 512
DISPLAY_THRESHOLD = 40.0
STRONG_THRESHOLD = 70.0
LIKELY_THRESHOLD = 90.0
EXCLUDED_STATUSES = {"draft", "withdrawn"}

SYNONYMS = {
    "automate": "automation", "automated": "automation", "automating": "automation",
    "bot": "automation", "bots": "automation", "rpa": "automation", "robotic": "automation",
    "reconcile": "reconciliation", "reconciled": "reconciliation",
    "reconciling": "reconciliation", "matching": "reconciliation",
    "invoices": "invoice", "transactions": "transaction",
    "monthly": "monthly", "month": "monthly",
    "reduce": "reduction", "reduced": "reduction", "reducing": "reduction",
    "save": "saving", "saved": "saving", "savings": "saving",
    "errors": "error", "mistakes": "error", "turnaround": "tat", "cycle": "tat",
}
STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "in",
    "is", "it", "of", "on", "or", "the", "to", "using", "use", "with", "will",
}


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def actor(user_data):
    if isinstance(user_data, dict) and user_data.get("username"):
        return user_data["username"]
    return "system"


def unwrap(value):
    if isinstance(value, dict) and isinstance(value.get("data"), (list, dict)):
        return value["data"]
    return value


def rows(db, table):
    try:
        value = unwrap(db.from_(table).page_size(1000).execute())
        return value if isinstance(value, list) else []
    except Exception:
        return []


def clean(value, limit=2000):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def normalized(value):
    return clean(value).lower()


def tokens(value):
    result = []
    for raw in re.findall(r"[a-z0-9]+", normalized(value)):
        if raw in STOP_WORDS:
            continue
        token = SYNONYMS.get(raw, raw)
        if len(token) > 3 and token.endswith("s") and not token.endswith("ss"):
            token = token[:-1]
        result.append(token)
    return result


def lexical_similarity(first, second):
    left, right = set(tokens(first)), set(tokens(second))
    if not left or not right:
        return 0.0
    intersection = len(left & right)
    jaccard = intersection / max(1, len(left | right))
    containment = intersection / max(1, min(len(left), len(right)))
    return round(min(100.0, max(jaccard, containment * 0.9) * 100), 1)


def cosine(left, right):
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(float(a) * float(b) for a, b in zip(left, right))
    left_norm = math.sqrt(sum(float(a) * float(a) for a in left))
    right_norm = math.sqrt(sum(float(b) * float(b) for b in right))
    if not left_norm or not right_norm:
        return 0.0
    return round(max(0.0, min(1.0, dot / (left_norm * right_norm))) * 100, 1)


def source_parts(value):
    return {
        "title": clean(value.get("title")),
        "problem": clean(value.get("problem_statement")),
        "solution": clean(value.get("proposed_solution")),
    }


def source_hash(parts):
    source = "\n".join([parts["title"], parts["problem"], parts["solution"]])
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def secret_value(sdk_client, key):
    try:
        secret = unwrap(sdk_client.secrets.get(key))
        value = secret.get("value") if isinstance(secret, dict) else ""
        if isinstance(value, dict):
            return value.get("api_key") or value.get("key") or ""
        return str(value or "")
    except Exception:
        return ""


def embedding_client(sdk_client):
    key = secret_value(sdk_client, "OPENAI_API_KEY")
    if not key or key == "[ENCRYPTED]":
        return None
    from openai import OpenAI
    return OpenAI(api_key=key, timeout=20.0, max_retries=1)


def embed_batch(client, values):
    response = client.embeddings.create(
        model=MODEL,
        input=[value or "Not provided" for value in values],
        dimensions=DIMENSIONS,
    )
    return [list(item.embedding) for item in response.data]


def embedding_cache(db):
    return {
        str(row.get("idea_id")): row
        for row in rows(db, "kaizen_idea_embeddings")
        if row.get("idea_id")
    }


def save_embedding(db, idea, parts, vectors, cache):
    idea_id = idea.get("id")
    current = cache.get(str(idea_id))
    data = {
        "idea_id": idea_id,
        "source_hash": source_hash(parts),
        "model": MODEL,
        "title_embedding": vectors[0],
        "problem_embedding": vectors[1],
        "solution_embedding": vectors[2],
        "updated_at": now_iso(),
    }
    if current and current.get("id"):
        data["created_at"] = current.get("created_at") or now_iso()
        saved = unwrap(db.update(
            "kaizen_idea_embeddings", record_id=current["id"], data=data
        ))
    else:
        data.update({"id": str(uuid4()), "created_at": now_iso()})
        saved = unwrap(db.create("kaizen_idea_embeddings", data))
    cache[str(idea_id)] = saved if isinstance(saved, dict) else data


def ensure_embeddings(db, client, candidates):
    cache = embedding_cache(db)
    missing = []
    for idea in candidates:
        parts = source_parts(idea)
        current = cache.get(str(idea.get("id")))
        if (
            not current
            or current.get("source_hash") != source_hash(parts)
            or current.get("model") != MODEL
        ):
            missing.append((idea, parts))
    for start in range(0, len(missing), 80):
        batch = missing[start:start + 80]
        input_texts = []
        for _, parts in batch:
            input_texts.extend([
                parts["title"], parts["problem"], parts["solution"]
            ])
        vectors = embed_batch(client, input_texts)
        for index, (idea, parts) in enumerate(batch):
            offset = index * 3
            save_embedding(
                db, idea, parts, vectors[offset:offset + 3], cache
            )
    return cache


def context_score(values, idea):
    client = (
        100.0 if values.get("client_id")
        and values.get("client_id") == idea.get("client_id") else 0.0
    )
    process = (
        100.0 if normalized(values.get("process_name"))
        and normalized(values.get("process_name"))
        == normalized(idea.get("process_name")) else 0.0
    )
    department = (
        100.0 if values.get("department_id")
        and values.get("department_id") == idea.get("department_id") else 0.0
    )
    return (
        round(client * 0.4 + process * 0.4 + department * 0.2, 1),
        {
            "same_client": client,
            "same_process": process,
            "same_department": department,
        },
    )


def weighted_total(scores, query_parts):
    configured = [
        ("title", 0.20), ("problem", 0.40),
        ("solution", 0.30), ("context", 0.10),
    ]
    active = [
        (key, weight) for key, weight in configured
        if key == "context" or query_parts.get(key)
    ]
    denominator = sum(weight for _, weight in active) or 1.0
    return round(
        sum(scores.get(key, 0.0) * weight for key, weight in active)
        / denominator,
        1,
    )


def classify(score):
    if score >= LIKELY_THRESHOLD:
        return "Likely Duplicate"
    if score >= STRONG_THRESHOLD:
        return "Strong Match"
    if score >= DISPLAY_THRESHOLD:
        return "Related Idea"
    return "No Significant Match"


def explanation(scores, context):
    phrases = []
    if scores.get("problem", 0) >= 65:
        phrases.append("same underlying problem")
    if scores.get("solution", 0) >= 65:
        phrases.append("similar proposed solution")
    if scores.get("title", 0) >= 65:
        phrases.append("similar improvement objective")
    context_labels = [
        key.replace("same_", "")
        for key, value in context.items() if value
    ]
    if context_labels:
        phrases.append("same " + ", ".join(context_labels))
    if not phrases:
        phrases.append("related operational meaning and keywords")
    return "; ".join(phrases[:4]).capitalize() + "."


def component_scores(values, idea, query_vectors, cached):
    query_parts = source_parts(values)
    candidate_parts = source_parts(idea)
    method = "meaning-aware-fallback"
    if query_vectors and cached:
        title = cosine(query_vectors[0], cached.get("title_embedding"))
        problem = cosine(query_vectors[1], cached.get("problem_embedding"))
        solution = cosine(
            query_vectors[2], cached.get("solution_embedding")
        )
        method = "openai-embedding"
    else:
        title = lexical_similarity(
            query_parts["title"], candidate_parts["title"]
        )
        problem = lexical_similarity(
            query_parts["problem"], candidate_parts["problem"]
        )
        solution = lexical_similarity(
            query_parts["solution"], candidate_parts["solution"]
        )
    context, context_parts = context_score(values, idea)
    scores = {
        "title": title, "problem": problem,
        "solution": solution, "context": context,
    }
    scores.update(context_parts)
    return (
        weighted_total(scores, query_parts),
        scores,
        context_parts,
        method,
    )


def upsert_check(db, match, values):
    try:
        existing = unwrap(
            db.from_("kaizen_duplicate_checks")
            .filter("idea_id", "eq", match.get("idea_id"))
            .filter(
                "candidate_idea_id", "eq",
                match.get("candidate_idea_id"),
            )
            .first()
        )
    except Exception:
        existing = None
    data = {
        "idea_id": match.get("idea_id"),
        "candidate_idea_id": match.get("candidate_idea_id"),
        "kaizen_id": values.get("kaizen_id"),
        "candidate_kaizen_id": match.get("candidate_kaizen_id"),
        "check_status": (
            "Review Required"
            if match["similarity_percent"] >= STRONG_THRESHOLD
            else "Warning"
        ),
        "similarity_percent": match.get("similarity_percent"),
        "classification": match.get("classification"),
        "matched_meaning": match.get("matched_meaning"),
        "scoring_method": match.get("scoring_method"),
        "similarity_breakdown": match.get("similarity_breakdown"),
        "matched_fields": match.get("matched_fields"),
        "threshold": STRONG_THRESHOLD,
        "updated_at": now_iso(),
    }
    if existing and existing.get("id"):
        return db.update(
            "kaizen_duplicate_checks",
            record_id=existing["id"],
            data=data,
        )
    data.update({"id": str(uuid4()), "created_at": now_iso()})
    return db.create("kaizen_duplicate_checks", data)


def detect(params, db, sdk_client):
    values = dict(params.get("values") or params)
    idea_id = params.get("idea_id") or values.get("id")
    if idea_id and not values.get("title"):
        values = unwrap(db.get("kaizen_ideas", record_id=idea_id))
    if not values.get("title"):
        return {
            "success": False,
            "error": "Title is required for duplicate detection",
        }
    candidates = [
        idea for idea in rows(db, "kaizen_ideas")
        if idea.get("id") != idea_id
        and normalized(idea.get("status")) not in EXCLUDED_STATUSES
    ]
    client, query_vectors, cache = None, None, {}
    try:
        client = embedding_client(sdk_client)
        if client:
            parts = source_parts(values)
            query_vectors = embed_batch(
                client,
                [parts["title"], parts["problem"], parts["solution"]],
            )
            cache = ensure_embeddings(db, client, candidates)
    except Exception as exc:
        client, query_vectors, cache = None, None, {}
        logger.warning(
            "Embedding comparison unavailable; using fallback: %s",
            exc,
        )
    matches = []
    display_threshold = float(
        params.get("display_threshold") or DISPLAY_THRESHOLD
    )
    for idea in candidates:
        total, breakdown, context, method = component_scores(
            values, idea, query_vectors, cache.get(str(idea.get("id")))
        )
        if total < display_threshold:
            continue
        label = classify(total)
        matched_fields = [
            key for key in ["title", "problem", "solution"]
            if breakdown.get(key, 0) >= 65
        ]
        matched_fields.extend([
            key.replace("same_", "")
            for key, value in context.items() if value
        ])
        matches.append({
            "idea_id": idea_id,
            "candidate_idea_id": idea.get("id"),
            "kaizen_id": values.get("kaizen_id"),
            "candidate_kaizen_id": idea.get("kaizen_id"),
            "title": idea.get("title"),
            "status": idea.get("status"),
            "submitter": (
                idea.get("submitted_by_name")
                or idea.get("submitted_by_username")
            ),
            "similarity_percent": total,
            "classification": label,
            "matched_meaning": explanation(breakdown, context),
            "scoring_method": method,
            "similarity_breakdown": breakdown,
            "matched_fields": matched_fields,
            "requires_justification": total >= STRONG_THRESHOLD,
            "requires_reviewer_resolution": total >= LIKELY_THRESHOLD,
            "threshold": STRONG_THRESHOLD,
        })
    matches.sort(key=lambda row: -row["similarity_percent"])
    created = []
    if params.get("persist") and idea_id:
        for match in matches[:10]:
            created.append(upsert_check(db, match, values))
    return {
        "success": True,
        "display_threshold": display_threshold,
        "strong_threshold": STRONG_THRESHOLD,
        "likely_duplicate_threshold": LIKELY_THRESHOLD,
        "embedding_enabled": bool(client),
        "scoring_method": (
            "openai-embedding" if client else "meaning-aware-fallback"
        ),
        "matches": matches[:20],
        "created_count": len(created),
    }


def decide(params, user, db):
    check_id = params.get("check_id")
    if not check_id:
        return {"success": False, "error": "check_id is required"}
    status_map = {
        "proceed": "Proceed Justified", "link": "Linked",
        "merge": "Merged", "dismiss": "Dismissed",
        "review": "Review Required",
    }
    status = status_map.get(
        params.get("decision"),
        params.get("status") or "Dismissed",
    )
    saved = db.update(
        "kaizen_duplicate_checks",
        record_id=check_id,
        data={
            "check_status": status,
            "justification": params.get("justification"),
            "action_taken": params.get("decision") or status,
            "reviewed_by_username": user,
            "reviewed_at": now_iso(),
            "updated_at": now_iso(),
        },
    )
    try:
        db.create("kaizen_audit_logs", {
            "id": str(uuid4()),
            "timestamp": now_iso(),
            "user_username": user,
            "action_type": "Duplicate " + status,
            "entity_type": "Duplicate Check",
            "entity_id": check_id,
            "new_value": {"status": status},
            "severity": "Info",
            "source": "kaizen-duplicate-detection",
            "retention_until": "2033-12-31",
            "created_at": now_iso(),
        })
    except Exception:
        pass
    return {"success": True, "duplicate_check": saved}


def main(params, user_data, sdk_client):
    db = sdk_client.database
    user = actor(user_data)
    action = params.get("action") or "detect"
    if action == "detect":
        return detect(params, db, sdk_client)
    if action in ["decide", "link", "merge", "dismiss", "proceed"]:
        if action != "decide":
            params["decision"] = action
        return decide(params, user, db)
    return {"success": False, "error": "Unsupported action"}
