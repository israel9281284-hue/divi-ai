from flask import Flask, request, jsonify
from flask_cors import CORS
from nebius_client import ask_divi_ai

app = Flask(__name__)
CORS(app)

@app.route("/api/voice-command", methods=["POST"])
def handle_command():
    data = request.get_json() or {}
    text_input = data.get("command", "")
    
    if not text_input:
        return jsonify({"error": "No voice command provided."}), 400

    ai_response = ask_divi_ai(text_input)
    return jsonify({
        "status": "success",
        "input": text_input,
        "response": ai_response
    })

if __name__ == "__main__":
    print("🚀 DiviAI Backend Server running on http://localhost:5000")
    app.run(port=5000, debug=True)