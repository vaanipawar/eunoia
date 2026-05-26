
import sys
sys.path.insert(0, ".")
from app.services.chatbot import chat, generate_session_summary

history = []
print("=== Eunoia Chatbot Test ===\n")

test_messages = [
    "Hi, I've been feeling really overwhelmed lately",
    "I have 3 exams next week and I haven't started studying",
    "I barely sleep, maybe 4 hours a night. I feel like I'm going to fail",
    "It's been like this for about 3 weeks now. I feel completely lost",
    "I haven't told anyone. I don't want to worry my parents",
]

stress_level = "low"
for msg in test_messages:
    print(f"STUDENT: {msg}")
    result = chat(msg, history, stress_level, "Aarav")
    stress_level = result["stress_level"]
    history.append({"role": "user", "content": msg})
    history.append({"role": "assistant", "content": result["reply"]})
    print(f"EUNOIA [{stress_level.upper()}]: {result['reply']}\n")
    if result["intake_complete"]:
        print("=== INTAKE COMPLETE — Generating summary ===")
        summary = generate_session_summary(history, "Aarav")
        import json
        print(json.dumps(summary, indent=2))
        break