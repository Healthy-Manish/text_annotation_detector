from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import base64
import numpy as np
from datetime import datetime
import json
import os
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# =========================
# CONFIG
# =========================
OUTPUT_FOLDER = "outputs"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Active video sessions (in-memory)
video_sessions = {}

# =========================
# UTILS
# =========================
def decode_base64_image(data_url):
    encoded = data_url.split(",")[1]
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def dummy_text_detection_model(region_img):
    avg = np.mean(region_img)
    if avg < 85:
        return "No text detected"
    elif avg < 170:
        return "Sample Text A"
    else:
        return "Sample Text B"

def draw_annotations(frame, regions, texts):
    annotated = frame.copy()

    for idx, r in enumerate(regions):
        x, y, w, h = map(int, [r["x"], r["y"], r["width"], r["height"]])
        label = r.get("label", f"Region {idx+1}")
        text = texts.get(idx, "")

        cv2.rectangle(annotated, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(
            annotated,
            f"{label}: {text}",
            (x, max(20, y - 8)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            1,
            cv2.LINE_AA
        )

    return annotated

# =========================
# SESSION LIFECYCLE
# =========================

@app.route("/start_session", methods=["POST"])
def start_session():
    data = request.json
    session_id = data["session_id"]
    regions = data["regions"]

    session_dir = os.path.join(OUTPUT_FOLDER, session_id)
    os.makedirs(session_dir, exist_ok=True)

    video_path = os.path.join(session_dir, "annotated_video.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(video_path, fourcc, 5, (1280, 720))

    video_sessions[session_id] = {
        "regions": regions,
        "writer": writer,
        "last_text": {},
        "timeline": defaultdict(list)
    }

    return jsonify({"success": True})


@app.route("/stream_frame", methods=["POST"])
def stream_frame():
    data = request.json
    session_id = data["session_id"]
    frame = decode_base64_image(data["frame"])

    session = video_sessions.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 400

    regions = session["regions"]
    texts = {}

    for idx, r in enumerate(regions):
        x, y, w, h = map(int, [r["x"], r["y"], r["width"], r["height"]])
        roi = frame[y:y+h, x:x+w]

        detected_text = dummy_text_detection_model(roi)
        texts[idx] = detected_text

        last = session["last_text"].get(idx)
        if detected_text != last:
            session["timeline"][idx].append({
                "timestamp": datetime.now().isoformat(),
                "text": detected_text
            })
            session["last_text"][idx] = detected_text

    annotated = draw_annotations(frame, regions, texts)
    session["writer"].write(annotated)

    return jsonify({"success": True})


@app.route("/stop_session", methods=["POST"])
def stop_session():
    session_id = request.json["session_id"]
    session = video_sessions.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 400

    session["writer"].release()

    timeline_path = os.path.join(
        OUTPUT_FOLDER, session_id, "timeline.json"
    )
    with open(timeline_path, "w") as f:
        json.dump(session["timeline"], f, indent=2)

    del video_sessions[session_id]

    return jsonify({"success": True})


# =========================
# REPLAY ENDPOINTS
# =========================

@app.route("/video/<session_id>")
def get_video(session_id):
    return send_from_directory(
        os.path.join(OUTPUT_FOLDER, session_id),
        "annotated_video.mp4"
    )


@app.route("/timeline/<session_id>")
def get_timeline(session_id):
    path = os.path.join(OUTPUT_FOLDER, session_id, "timeline.json")
    if not os.path.exists(path):
        return jsonify({"timeline": {}})

    with open(path) as f:
        return jsonify(json.load(f))
@app.route("/sessions")
def list_sessions():
    sessions = []

    for session_id in os.listdir(OUTPUT_FOLDER):
        session_dir = os.path.join(OUTPUT_FOLDER, session_id)
        if not os.path.isdir(session_dir):
            continue

        video_path = os.path.join(session_dir, "annotated_video.mp4")
        timeline_path = os.path.join(session_dir, "timeline.json")

        sessions.append({
            "session_id": session_id,
            "has_video": os.path.exists(video_path),
            "has_timeline": os.path.exists(timeline_path)
        })

    return jsonify(sessions)


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
