from flask import Flask, request, jsonify, send_from_directory , make_response
from flask_cors import CORS
import cv2
import base64
import numpy as np
from datetime import datetime
import json
import os
import shutil
from collections import defaultdict

from models.model import TextDetector   # your real model

# =========================
# APP SETUP
# =========================
app = Flask(__name__)
CORS(app)

OUTPUT_FOLDER = "outputs"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# =========================
# LOAD MODEL ONCE ✅
# =========================
text_model = TextDetector()

# =========================
# IN-MEMORY ACTIVE SESSIONS
# =========================
video_sessions = {}

# =========================
# UTILS
# =========================
def decode_base64_image(data_url):
    encoded = data_url.split(",")[1]
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

def draw_annotations(frame, regions, texts):
    annotated = frame.copy()

    for idx, r in enumerate(regions):
        key = str(idx)
        x, y, w, h = map(int, [r["x"], r["y"], r["width"], r["height"]])
        label = r.get("label", f"Region {idx + 1}")
        text = texts.get(key, "")

        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 2)
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

    video_sessions[session_id] = {
        "regions": regions,
        "writer": None,                # lazy init
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
        return jsonify({"reason": "Session ended", "success": False}), 200

    if session["writer"] is None:
        h, w = frame.shape[:2]
        # 🔥 CHANGED: Using VP8 for WebM (High browser compatibility)
        fourcc = cv2.VideoWriter_fourcc(*"VP80") 
        video_path = os.path.join(OUTPUT_FOLDER, session_id, "annotated_video.mp4")
        session["writer"] = cv2.VideoWriter(video_path, fourcc, 5, (w, h))

    texts = {}
    regions = session["regions"]
    img_h, img_w = frame.shape[:2]

    for idx, r in enumerate(regions):
        key = str(idx)
        # Safety crop: ensure coordinates are within image bounds
        x = max(0, int(r["x"]))
        y = max(0, int(r["y"]))
        w = min(int(r["width"]), img_w - x)
        h = min(int(r["height"]), img_h - y)
        
        if w > 0 and h > 0:
            roi = frame[y:y + h, x:x + w]
            detected_text = text_model.predict(roi)
            detected_text = detected_text.strip() if detected_text else ""
            texts[key] = detected_text
            last = session["last_text"].get(key)
            if detected_text and detected_text != last:
                session["timeline"][key].append({
                    "timestamp": datetime.now().isoformat(),
                    "text": detected_text
                })
                session["last_text"][key] = detected_text

    annotated = draw_annotations(frame, regions, texts)
    session["writer"].write(annotated)
    return jsonify({"success": True, "detected_texts": texts, "timestamp": datetime.now().isoformat()})



@app.route("/stop_session", methods=["POST"])
def stop_session():
    session_id = request.json["session_id"]
    session = video_sessions.get(session_id)

    if not session:
        return jsonify({"error": "Session not found"}), 400

    if session["writer"]:
        session["writer"].release()

    session_dir = os.path.join(OUTPUT_FOLDER, session_id)

    # Save timeline
    with open(os.path.join(session_dir, "timeline.json"), "w") as f:
        json.dump(session["timeline"], f, indent=2)

    # Save regions metadata
    with open(os.path.join(session_dir, "regions.json"), "w") as f:
        json.dump(session["regions"], f, indent=2)

    del video_sessions[session_id]

    return jsonify({"success": True})

# =========================
# REPLAY ENDPOINTS
# =========================

@app.route("/video/<session_id>")
def get_video(session_id):
    video_dir = os.path.join(OUTPUT_FOLDER, session_id)
    # 🔥 CHANGE: Point to the .webm file
    return send_from_directory(
        video_dir,
        "annotated_video.webm",
        mimetype="video/webm"
    )

@app.route("/timeline/<session_id>")
def get_timeline(session_id):
    path = os.path.join(OUTPUT_FOLDER, session_id, "timeline.json")
    if not os.path.exists(path):
        return jsonify({})
    with open(path) as f:
        return jsonify(json.load(f))


@app.route("/regions/<session_id>")
def get_regions(session_id):
    path = os.path.join(OUTPUT_FOLDER, session_id, "regions.json")
    if not os.path.exists(path):
        return jsonify([])
    with open(path) as f:
        return jsonify(json.load(f))
    
    
@app.route("/session_info/<session_id>")
def get_session_info(session_id):
    session_dir = os.path.join(OUTPUT_FOLDER, session_id)
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404
    
    info = {
        "session_id": session_id,
        "has_video": os.path.exists(os.path.join(session_dir, "annotated_video.mp4")),
        "has_timeline": os.path.exists(os.path.join(session_dir, "timeline.json")),
        "has_regions": os.path.exists(os.path.join(session_dir, "regions.json")),
        "is_active": session_id in video_sessions
    }
    
    # Get creation time from folder
    info["created"] = datetime.fromtimestamp(os.path.getctime(session_dir)).isoformat()
    
    return jsonify(info)

@app.route("/sessions")
def list_sessions():
    sessions = []

    for session_id in os.listdir(OUTPUT_FOLDER):
        session_dir = os.path.join(OUTPUT_FOLDER, session_id)
        if not os.path.isdir(session_dir):
            continue

        sessions.append({
            "session_id": session_id,
            "has_video": os.path.exists(os.path.join(session_dir, "annotated_video.mp4")),
            "has_timeline": os.path.exists(os.path.join(session_dir, "timeline.json"))
        })

    return jsonify(sessions)


@app.route("/delete_session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    session_dir = os.path.join(OUTPUT_FOLDER, session_id)
    if not os.path.exists(session_dir):
        return jsonify({"error": "Session not found"}), 404

    shutil.rmtree(session_dir)
    return jsonify({"success": True})


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
