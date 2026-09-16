import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from nebius_client import query_nebius

app = Flask(__name__)
CORS(app)

# Root route so visiting the main URL doesn't throw a 404
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "online",
        "service": "Divi AI Backend",
        "track": "Personal AI",
        "model": "NVIDIA Nemotron via Nebius Serverless",
        "endpoint": "/api/voice-command"
    }), 200

# Primary POST endpoint for voice commands
@app.route('/api/voice-command', methods=['POST'])
def voice_command():
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({"error": "Missing 'command' parameter"}), 400
    
    user_command = data['command']
    ai_response = query_nebius(user_command)
    
    return jsonify({
        "input": user_command,
        "response": ai_response
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
