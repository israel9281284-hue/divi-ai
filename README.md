# Divi AI Backend 🎙️🤖

An AI-powered voice assistant backend built with Flask and NVIDIA Nemotron via Nebius AI Studio. Designed to process real-time voice command inputs and deliver intelligent responses.

---

## 🚀 Features

- **Voice Command Processing:** Accepts structured text/voice input via API endpoints.
- **NVIDIA Nemotron Integration:** Powered by advanced LLMs hosted on Nebius AI Studio for high-quality responses.
- **RESTful API Endpoint:** Standardized JSON input/output routing.

---

## 🛠️ Tech Stack

- **Framework:** Python / Flask
- **LLM Provider:** NVIDIA Nemotron (via Nebius AI API)
- **Deployment:** Render / Localtunnel
- **Environment Management:** `python-dotenv`

---

## 🌐 API Reference

### Process Voice Command

- **URL:** `/api/voice-command`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "command": "Divi, tell me a quick joke."
}
