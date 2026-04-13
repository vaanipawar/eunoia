from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

def analyze_stress(text: str) -> dict:
    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]
    stress_index = (1 - compound) / 2
    if stress_index < 0.4:
        level = "low"
    elif stress_index < 0.65:
        level = "medium"
    else:
        level = "high"
    return {
        "stress_level": level,
        "stress_index": round(stress_index, 3),
        "compound": round(compound, 3),
        "raw": scores,
    }

def analyze_conversation_stress(messages: list[str]) -> str:
    if not messages:
        return "low"
    scores = [analyze_stress(m)["stress_index"] for m in messages]
    avg = sum(scores) / len(scores)
    if avg < 0.4:
        return "low"
    elif avg < 0.65:
        return "medium"
    return "high"