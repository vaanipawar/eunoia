import requests
import json
from app.core.config import settings
from app.services.sentiment import analyze_stress, analyze_conversation_stress

OPENROUTER_API_KEY = settings.OPENROUTER_API_KEY


LOW_STRESS_SYSTEM = """You are Eunoia, a warm, empathetic student well-being assistant.
The student you're talking to has LOW stress levels right now.
Your role:
- Be friendly, conversational, and supportive
- Offer practical coping strategies, study tips, and well-being advice
- Keep responses concise (2–4 sentences) unless they ask for more
- Ask gentle check-in questions to keep them engaged
- Topics you cover: time management, sleep hygiene, study breaks, mindfulness, social connection
- Never be preachy. Be like a caring friend, not a therapist.
Always end with one open-ended question to keep the conversation going."""


HIGH_STRESS_INTAKE_SYSTEM = """You are Eunoia, a caring student well-being assistant.
The student you're talking to is showing HIGH stress indicators.
Your role is to gently collect information for their wellbeing record so a mentor can help them.

Collect the following across the conversation (one at a time, naturally):
1. What is causing their stress (academic, personal, social, health)
2. How long they've been feeling this way
3. Intensity on a scale of 1–10
4. Whether they've spoken to anyone about it
5. What kind of support they feel would help most

Rules:
- Be warm, non-judgmental, and patient
- Never ask multiple questions at once
- Validate their feelings before asking the next question
- If they mention self-harm or crisis, immediately say:
  "I'm really glad you shared that with me. Please reach out to a counselor or call iCall: 9152987821 right now. I'm flagging this for immediate mentor support."
- Keep responses short and human

Once you have enough info (at least 3 of the 5 points), end your response with exactly:
[INTAKE_COMPLETE]"""


def build_messages(history: list[dict], new_message: str) -> list[dict]:
    messages = []
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": new_message})
    return messages


def call_llm(system: str, messages: list, max_tokens: int = 500):
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "deepseek/deepseek-chat",
            "messages": [
                {"role": "system", "content": system},
                *messages
            ],
            "max_tokens": max_tokens,
        }
    )

    data = response.json()

    if "choices" not in data:
        raise Exception(f"LLM Error: {data}")

    return data["choices"][0]["message"]["content"]


def chat(
    user_message: str,
    history: list[dict],
    stress_level: str,
    student_name: str,
) -> dict:

    sentiment = analyze_stress(user_message)
    current_stress = sentiment["stress_level"]

    # Escalate stress level — never downgrade
    stress_priority = {"low": 0, "medium": 1, "high": 2}
    if stress_priority[current_stress] > stress_priority.get(stress_level, 0):
        stress_level = current_stress

    # Check recent conversation stress
    recent_messages = [m["content"] for m in history[-3:] if m["role"] == "user"]
    recent_messages.append(user_message)
    conversation_stress = analyze_conversation_stress(recent_messages)

    if stress_priority[conversation_stress] > stress_priority.get(stress_level, 0):
        stress_level = conversation_stress

    system = HIGH_STRESS_INTAKE_SYSTEM if stress_level == "high" else LOW_STRESS_SYSTEM
    system = f"Student's name: {student_name}\n\n" + system

    messages = build_messages(history, user_message)

    reply = call_llm(system, messages)

    intake_complete = "[INTAKE_COMPLETE]" in reply
    reply = reply.replace("[INTAKE_COMPLETE]", "").strip()

    return {
        "reply": reply,
        "stress_level": stress_level,
        "intake_complete": intake_complete,
        "sentiment": sentiment,
    }


def generate_session_summary(messages: list[dict], student_name: str) -> dict:

    transcript = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in messages
    )

    prompt = f"""You are analyzing a counseling chat session for student: {student_name}.

TRANSCRIPT:
{transcript}

Generate a structured JSON summary with exactly these fields:
{{
  "stress_level": "low|medium|high",
  "primary_concern": "one sentence",
  "duration_feeling": "how long they've been stressed",
  "stress_intensity": "number 1-10 or 'not disclosed'",
  "support_sought": "yes/no/not disclosed",
  "desired_support": "what kind of help they want",
  "key_topics": ["list", "of", "topics"],
  "risk_flags": ["any", "crisis", "indicators"],
  "recommended_action": "one of: monitor / check_in / assign_mentor / urgent_escalation",
  "mentor_notes": "2-3 sentence briefing for the mentor"
}}

Return ONLY the JSON object, no other text."""

    reply = call_llm("", [{"role": "user", "content": prompt}], max_tokens=600)

    reply = reply.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(reply)
    except json.JSONDecodeError:
        return {
            "stress_level": "unknown",
            "primary_concern": "Could not parse summary",
            "recommended_action": "check_in",
            "mentor_notes": reply[:500],
            "key_topics": [],
            "risk_flags": [],
        }