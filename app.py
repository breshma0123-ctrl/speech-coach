from flask import Flask, render_template, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

app = Flask(__name__)

analyzer = SentimentIntensityAnalyzer()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    text = data.get("text", "").strip()
    duration = float(data.get("duration", 1))

    if not text:
        return jsonify({
            "error": "Please speak or enter some text."
        })

    # Word count
    words = re.findall(r"\b[\w']+\b", text)
    word_count = len(words)

    # Sentence count
    sentences = re.split(r"[.!?]+", text)
    sentence_count = len(
        [s for s in sentences if s.strip()]
    )

    # Speaking rate
    minutes = duration / 60

    if minutes > 0:
        wpm = round(word_count / minutes)
    else:
        wpm = 0

    # Filler words
    filler_list = [
        "um",
        "uh",
        "like",
        "actually",
        "basically",
        "you know",
        "so"
    ]

    lower_text = text.lower()

    fillers = {}

    for filler in filler_list:

        pattern = r"\b" + re.escape(filler) + r"\b"

        count = len(
            re.findall(pattern, lower_text)
        )

        if count > 0:
            fillers[filler] = count

    total_fillers = sum(fillers.values())

    # Sentiment
    scores = analyzer.polarity_scores(text)

    if scores["compound"] >= 0.05:
        sentiment = "Positive"
        emoji = "😊"

    elif scores["compound"] <= -0.05:
        sentiment = "Negative"
        emoji = "😟"

    else:
        sentiment = "Neutral"
        emoji = "😐"

    # Simple keyword extraction
    stop_words = {
        "the", "is", "a", "an", "and",
        "to", "of", "in", "on", "for",
        "with", "this", "that", "it",
        "i", "am", "my", "we", "are",
        "was", "were", "be", "have",
        "has", "had", "very", "today"
    }

    keywords = []

    for word in words:

        clean_word = word.lower()

        if (
            len(clean_word) > 3
            and clean_word not in stop_words
            and clean_word not in keywords
        ):
            keywords.append(clean_word)

    keywords = keywords[:8]

    # Simple speech score
    score = 100

    if total_fillers > 3:
        score -= 10

    if wpm > 160:
        score -= 10

    if wpm < 80 and wpm > 0:
        score -= 5

    if word_count < 10:
        score -= 5

    score = max(score, 40)

    return jsonify({
        "word_count": word_count,
        "sentence_count": sentence_count,
        "duration": round(duration, 1),
        "wpm": wpm,
        "fillers": fillers,
        "total_fillers": total_fillers,
        "sentiment": sentiment,
        "emoji": emoji,
        "positive": round(scores["pos"] * 100),
        "negative": round(scores["neg"] * 100),
        "neutral": round(scores["neu"] * 100),
        "keywords": keywords,
        "score": score
    })


if __name__ == "__main__":
    app.run(debug=True)