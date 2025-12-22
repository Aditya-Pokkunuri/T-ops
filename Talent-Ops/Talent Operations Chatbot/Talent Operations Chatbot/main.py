# main.py
from fastapi import FastAPI
from pydantic import BaseModel

from role_engine import is_allowed
from sql_agent import generate_sql
from supabase_client import get_client

app = FastAPI(title="Talent Operations Chatbot")


@app.get("/")
def read_root():
    return {"message": "TalentOps backend is alive dYZ%"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


def infer_action(message: str) -> str | None:
    """Lightweight intent guess for permission gating before hitting the LLM."""
    text = message.lower()
    if "assign" in text and "task" in text:
        return "assign_tasks"
    if "approve" in text and "leave" in text:
        return "approve_leaves"
    if "payroll" in text or "payslip" in text:
        return "view_payroll_self"
    return None


class ChatRequest(BaseModel):
    user_id: str
    role: str
    team_id: str | None = None
    message: str


def _fetch_name_map(supabase, ids: set[str]):
    """
    Given a set of profile IDs, return a map id -> {full_name, email}.
    """
    if not ids:
        return {}
    try:
        resp = (
            supabase.table("profiles_talentops")
            .select("id, full_name, email")
            .in_("id", list(ids))
            .execute()
        )
        rows = resp.data or []
        return {r["id"]: {"name": r.get("full_name"), "email": r.get("email")} for r in rows}
    except Exception:
        return {}


def _annotate_with_names(rows, name_map):
    """
    Add friendly name fields to result rows when IDs are present.
    """
    annotated = []
    for row in rows:
        if not isinstance(row, dict):
            annotated.append(row)
            continue
        r = dict(row)
        for field, label in [
            ("assigned_to", "assigned_to_name"),
            ("assigned_by", "assigned_by_name"),
            ("employee_id", "employee_name"),
            ("reviewer_id", "reviewer_name"),
        ]:
            pid = r.get(field)
            if pid and pid in name_map:
                r[label] = name_map[pid].get("name") or name_map[pid].get("email")
        annotated.append(r)
    return annotated


@app.post("/chat")
async def chat(request: ChatRequest):
    supabase = get_client()

    user_id = request.user_id
    role = request.role.lower()
    team_id = request.team_id
    user_message = request.message

    # STEP 1 - permission gate
    action = infer_action(user_message)
    if action and not is_allowed(role, action):
        return {"reply": "forbidden", "reason": f"{role} cannot {action}"}

    # STEP 2 - generate SQL or action
    sql_query = generate_sql(role, user_id, team_id, user_message)
    normalized = sql_query.strip().upper().rstrip(".;")
    if normalized == "FORBIDDEN":
        return {"reply": "forbidden"}

    # STEP 3 - dispatch RPC when LLM returns action JSON
    if sql_query.startswith("{") and "\"action\"" in sql_query:
        try:
            import json
            payload = json.loads(sql_query)
            action_name = payload.get("action")
            params = payload.get("params", {})
            if action_name in ("assign_task_with_timesheet", "approve_leave", "upsert_timesheet", "schedule_meeting_timesheet"):
                # auto-fill requester_id/employee_id for self-timesheet when missing
                if action_name == "upsert_timesheet" and "employee_id" not in params:
                    params["employee_id"] = user_id
                if "requester_id" not in params:
                    params["requester_id"] = user_id
                # normalize for schedule_meeting_timesheet to match p_* signature
                if action_name == "schedule_meeting_timesheet":
                    raw_date = params.get("date")
                    if isinstance(raw_date, str) and "T" in raw_date:
                        raw_date = raw_date.split("T", 1)[0]
                    params = {
                        "p_requester": params.get("requester_id", user_id),
                        "p_team_id": params.get("team_id", team_id),
                        "p_date": raw_date or params.get("date"),
                        "p_hours": params.get("hours", 1),
                    }
                response = supabase.rpc(action_name, params).execute()
                friendly = {"action": action_name, "reply": response.data}
                if action_name == "assign_task_with_timesheet":
                    friendly["message"] = f"Assigned '{params.get('title', 'task')}' to {params.get('assignee_email')}"
                return friendly
        except Exception as e:
            return {"error": f"action_parse_failed: {e}", "raw": sql_query}

    # STEP 4 - run SQL on Supabase
    try:
        response = supabase.rpc("execute_sql_chatbot", {"sql": sql_query}).execute()
        data = response.data

        # Friendly empty-state message for common queries
        if isinstance(data, list) and len(data) == 0:
            hint = "No records found."
            low = user_message.lower()
            if "leave" in low:
                hint = "No pending leaves found."
            elif "task" in low:
                hint = "No tasks found."
            elif "timesheet" in low:
                hint = "No timesheets found."
            return {"sql": sql_query, "reply": [], "message": hint}

        # Attach human-readable names when IDs are present
        if isinstance(data, list):
            ids = set()
            for row in data:
                if isinstance(row, dict):
                    for field in ("assigned_to", "assigned_by", "employee_id", "reviewer_id"):
                        pid = row.get(field)
                        if pid:
                            ids.add(pid)
            name_map = _fetch_name_map(supabase, ids)
            data = _annotate_with_names(data, name_map)

        return {"sql": sql_query, "reply": data}
    except Exception as e:
        return {"error": str(e), "sql": sql_query}
