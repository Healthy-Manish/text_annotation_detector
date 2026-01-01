from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import base64
import numpy as np
from datetime import datetime
import json
import os
import hashlib
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'captured_data'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# In-memory storage for session data (in production, use a database)
session_data = defaultdict(lambda: {
    'frames': [],
    'unique_outputs': {},
    'output_hashes': set()
})

def dummy_text_detection_model(image_region):
    """
    Dummy model that simulates text detection
    Returns detected text from the region
    """
    # Simulate text detection with some randomness
    height, width = image_region.shape[:2]
    area = height * width
    
    # Simulate different outputs based on image characteristics
    avg_intensity = np.mean(image_region)
    
    if avg_intensity < 85:
        return "Dark Region - No text detected"
    elif avg_intensity < 170:
        return f"Text Area {np.random.randint(1, 100)}: Sample detected text"
    else:
        return "Bright Region - Possible text area"

def hash_output(output_data):
    """Create a hash of the output to identify duplicates"""
    output_str = json.dumps(output_data, sort_keys=True)
    return hashlib.md5(output_str.encode()).hexdigest()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_frame', methods=['POST'])
def process_frame():
    try:
        data = request.json
        image_data = data['image'].split(',')[1]
        regions = data['regions']
        session_id = data.get('session_id', 'default')
        
        # Decode image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process each region
        frame_results = []
        for idx, region in enumerate(regions):
            x = int(region['x'])
            y = int(region['y'])
            w = int(region['width'])
            h = int(region['height'])
            label = region.get('label', f'Region {idx + 1}')
            
            # Extract region from image
            region_img = image[y:y+h, x:x+w]
            
            # Apply dummy model
            detected_text = dummy_text_detection_model(region_img)
            
            result = {
                'region_id': idx,
                'label': label,
                'coordinates': {'x': x, 'y': y, 'width': w, 'height': h},
                'detected_text': detected_text,
                'timestamp': datetime.now().isoformat()
            }
            
            frame_results.append(result)
        
        # Calculate hash for this frame's output
        output_hash = hash_output(frame_results)
        
        # Check if this output is unique
        if output_hash not in session_data[session_id]['output_hashes']:
            session_data[session_id]['output_hashes'].add(output_hash)
            session_data[session_id]['unique_outputs'][output_hash] = {
                'results': frame_results,
                'timestamp': datetime.now().isoformat(),
                'frame_number': len(session_data[session_id]['frames']) + 1
            }
            
            # Save to file
            save_output(session_id, output_hash, frame_results, image)
            is_unique = True
        else:
            is_unique = False
        
        session_data[session_id]['frames'].append({
            'hash': output_hash,
            'timestamp': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'results': frame_results,
            'is_unique': is_unique,
            'total_frames': len(session_data[session_id]['frames']),
            'unique_frames': len(session_data[session_id]['unique_outputs']),
            'output_hash': output_hash
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

def save_output(session_id, output_hash, results, image):
    """Save output data and image to disk"""
    session_folder = os.path.join(OUTPUT_FOLDER, session_id)
    os.makedirs(session_folder, exist_ok=True)
    
    # Save results as JSON
    json_path = os.path.join(session_folder, f'{output_hash}.json')
    with open(json_path, 'w') as f:
        json.dump({
            'results': results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    # Save image
    img_path = os.path.join(session_folder, f'{output_hash}.jpg')
    cv2.imwrite(img_path, image)

@app.route('/get_history/<session_id>')
def get_history(session_id):
    """Get all unique outputs for a session"""
    if session_id not in session_data:
        return jsonify({'outputs': []})
    
    outputs = [
        {
            'hash': hash_val,
            'data': data
        }
        for hash_val, data in session_data[session_id]['unique_outputs'].items()
    ]
    
    return jsonify({
        'outputs': outputs,
        'total_frames': len(session_data[session_id]['frames']),
        'unique_outputs': len(outputs)
    })

@app.route('/get_sessions')
def get_sessions():
    """Get all available sessions"""
    sessions = []
    for session_id, data in session_data.items():
        sessions.append({
            'session_id': session_id,
            'total_frames': len(data['frames']),
            'unique_outputs': len(data['unique_outputs']),
            'last_updated': data['frames'][-1]['timestamp'] if data['frames'] else None
        })
    return jsonify({'sessions': sessions})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)