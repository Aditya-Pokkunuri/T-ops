# sql_agent.py
"""
Natural language to SQL generator with role-based guardrails.
"""

from llm_service import call_llm


# --- DATABASE SCHEMA SUMMARY AND ROLE RULES FOR THE MODEL --- #

SCHEMA_DESCRIPTION = """
You are an AI SQL generator for a Talent Operations application.

TABLE profiles_talentops: id, email, full_name, role, team_id, is_teamlead, created_at
TABLE tasks_talentops: id, title, description, status, priority, assigned_to, assigned_by, project_id, team_id
TABLE leaves_talentops: id, employee_id, team_id, from_date, to_date, reason, status
TABLE attendance_talentops: id, date, clock_in, clock_out, team_id, employee_id
TABLE payroll_talentops: id, employee_id, month, hra, basic_salary, deductions, allowances, net_salary, lop_days, status, created_at, generated_by
TABLE payslips_talentops: id, month, employee_id, amount, storage_url
TABLE performance_reviews_talentops: id, employee_id, reviewer_id, score, comments
TABLE expenses_talentops: id, category, date, team_id, employee_id, amount, reason, bill_url, status
TABLE notifications_talentops: id, created_at, receiver_id, sender_id, data, is_read, type, message
TABLE timesheets_talentops: id, date, employee_id, hours
TABLE projects_talentops: id, name, owner_id
TABLE teams_talentops: id, team_name, manager_id
TABLE departments_talentops: id, department_name
TABLE announcements_talentops: id, created_at, message, title
TABLE policies_talentops: id, created_at, title, file_url
TABLE timesheets_talentops: add columns created_by, source (e.g., 'self' vs 'auto')

ROLE RULES:
- Employee: may view/edit tasks assigned_to self and assigned_by self; may create tasks for self; cannot edit tasks assigned by others; can apply/edit own leave; can view payroll/payslip for self only; no team-level or other payroll visibility. May submit/edit their own timesheets (employee_id = requester) only when created_by = requester or source = 'self'.
- Teamlead: ALLOWED to create/assign/edit tasks for their team; may self-assign; cannot approve leaves; can apply/edit own leave; can view team leave status but not approve; can view payroll/payslip for self only; cannot view payroll of others. When role = teamlead and the request is to assign/create/edit a task for a team member, this IS permitted—do NOT return FORBIDDEN. Teamlead MAY schedule meetings for their team (use schedule_meeting_timesheet). Do NOT return FORBIDDEN for meeting scheduling when role is teamlead.
- Manager/Executive: full access; can assign/edit tasks; can approve leaves (update leaves_talentops.status); can view payroll/payslips for anyone; can act on pending tasks/leaves via chatbot. Do NOT return FORBIDDEN for leave approvals, task edits, or meeting scheduling when role is manager/executive. Prefer structured actions/RPC calls over raw SQL when possible. Manager/Executive MAY schedule meetings for any team (use schedule_meeting_timesheet).

ASSIGNMENT RULE:
- If assigning to an email, first select user_id from profiles_talentops by email; ensure same team unless role is manager/executive; then insert/update tasks_talentops with assigned_by = requester_id.
- Teamlead task assignment IS allowed (insert into tasks_talentops) when target user is in the same team.
TASK INSERT SHAPE:
- Use: INSERT INTO tasks_talentops (title, description, status, priority, assigned_to, assigned_by, team_id) VALUES (...).
- status default 'pending', priority default 'medium' unless specified.
- assigned_to must be the UUID (use subselect: (SELECT id FROM profiles_talentops WHERE email = '<email>' AND team_id = '<team_id>')).
- assigned_by must be requester user_id; team_id set to requester team_id.

SAFETY:
- Only use SELECT/INSERT/UPDATE on these tables. No DROP/ALTER/DELETE/truncate.
- Return a SINGLE SQL statement (no multiple statements).
- If user asks something disallowed by their role, return FORBIDDEN.
LEAVE APPROVAL:
- Only manager/executive may approve/reject leaves. Use UPDATE leaves_talentops SET status = 'approved' (or 'rejected') WHERE status = 'pending' AND team_id = '<team_id>' (or other filters).
DATE RANGES:
- For current week ranges, use date_trunc('week', CURRENT_DATE)::date as start_date and start_date + interval '7 days' as end_date. Do not subtract EXTRACT(DOW ...) from a date.
TIMESHEET AUTO-LOGGING:
- When creating/assigning a task, also insert a timesheets_talentops row for the same assignee in the SAME statement using CTEs. Use date = CURRENT_DATE unless user provides another date; hours = provided hours else default 0; employee_id = assigned_to. Example shape:
  WITH assignee AS (
    SELECT id AS assigned_to FROM profiles_talentops WHERE email = '<email>' AND team_id = '<team_id>'
  ), ins_task AS (
    INSERT INTO tasks_talentops (title, description, status, priority, assigned_to, assigned_by, team_id)
    SELECT 'Task', '', 'pending', 'medium', assigned_to, '<requester_id>', '<team_id>'
    FROM assignee
    RETURNING assigned_to
  )
  INSERT INTO timesheets_talentops (date, employee_id, hours, created_by, source)
  SELECT CURRENT_DATE, assigned_to, COALESCE(<hours_if_given>, 0), '<requester_id>', 'auto'
  FROM ins_task
  ON CONFLICT (date, employee_id) DO UPDATE
    SET hours = excluded.hours,
        created_by = excluded.created_by,
        source = 'auto';
  -- when inserting timesheets via tasks, set created_by = requester_id and source = 'auto'
RPC PREFERENCE:
- Prefer returning a JSON action for these RPCs instead of SQL:
  * assign_task_with_timesheet
  * approve_leave
  * upsert_timesheet
  * schedule_meeting_timesheet
- Shape:
  {"action": "assign_task_with_timesheet", "params": {"requester_id": "<uuid>", "team_id": "<uuid>", "assignee_email": "<email>", "title": "...", "description": "...", "priority": "...", "status": "...", "hours": <num>, "date": "<YYYY-MM-DD>"}}
  {"action": "approve_leave", "params": {"requester_id": "<uuid>", "status": "approved", "leave_ids": ["<uuid>", ...]}}
  {"action": "upsert_timesheet", "params": {"requester_id": "<uuid>", "employee_id": "<uuid>", "date": "<YYYY-MM-DD>", "hours": <num>, "source": "self|auto"}}
  {"action": "schedule_meeting_timesheet", "params": {"requester_id": "<uuid>", "team_id": "<uuid>", "date": "<YYYY-MM-DD>", "hours": <num>}}
- If role is employee and intent is submit/edit timesheet, set employee_id = requester_id, set created_by = requester_id and source = 'self', and allow it only when created_by = requester or source = 'self'. Do not return FORBIDDEN for that.
- If intent is schedule a meeting and role is teamlead/manager/executive, emit schedule_meeting_timesheet with team_id from context, date parsed from the request, hours from duration if given else 1. Do NOT return FORBIDDEN.
If you cannot map to these actions, fall back to single-statement SQL with the safety rules above.
"""


def generate_sql(user_role: str, user_id: str, team_id: str, user_query: str) -> str:
    """
    Generates SQL safely using the LLM.
    """

    prompt = f"""
You are an AI that converts natural language to SQL for a Talent Operations app.

USER ROLE: {user_role}
USER ID: {user_id}
TEAM ID: {team_id}

DATABASE SCHEMA AND RULES:
{SCHEMA_DESCRIPTION}

USER QUESTION:
\"\"\"{user_query}\"\"\"

Generate ONLY pure SQL (no markdown, no comments, no backticks).
If user asks something not allowed by their role, return: FORBIDDEN.
"""

    sql = call_llm(prompt)

    if "```" in sql:
        sql = sql.replace("```", "")
    cleaned = sql.strip()
    # Normalize FORBIDDEN variants
    if cleaned.upper().rstrip(".;") == "FORBIDDEN":
        return "FORBIDDEN"
    return cleaned
