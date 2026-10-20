# Divi AI — Personal AI Assistant

Divi AI is a web-based AI assistant designed to help people find information, understand difficult topics, and complete everyday tasks. The project combines a web interface, a Python backend, AI model integration, and web-search capabilities.

Divi AI is being developed for the Nebius × NVIDIA Global AI Hackathon.

## Project Goals

The goal of Divi AI is to make AI assistance more accessible and useful through conversational AI, web search, learning assistance, and task-oriented workflows.

The project aims to provide a single interface where users can ask questions, explore information, and get help with everyday activities.

## Features

- **AI Chat:** Ask questions and receive AI-generated responses.
- **Web Search:** Retrieve relevant online information using Tavily.
- **Learning Assistance:** Help users understand difficult subjects in simple language.
- **Agent Mode:** Develop workflows that select and use tools to complete tasks.
- **Conversation History:** Support access to previous conversations.
- **Personal AI:** Develop persistent memory and personalized assistance.
- **Web Interface:** Access the application through a browser.

Some features may require additional configuration or development. Their availability should be confirmed against the current deployment.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend logic |
| Flask | Web application framework |
| HTML, CSS, JavaScript | Frontend interface |
| Nebius Token Factory | Hosted AI model access |
| NVIDIA Nemotron | Target model for AI responses |
| Tavily | Web-search integration |
| GitHub | Source code and version control |
| Render | Web application hosting |

## Hackathon Track

**Proposed category: Best Apps and Agents**

Divi AI aims to provide a practical AI assistant combining conversational interaction, web search, learning assistance, and task-oriented workflows.

The final submission will demonstrate the actual NVIDIA model integration and the Nebius infrastructure used by the deployed application.

## How Divi AI Works

The intended request flow is:

1. A user enters a question in the web interface.
2. The frontend sends the request to the Python backend.
3. The backend determines which functionality is needed.
4. When appropriate, the backend obtains information from Tavily or sends a request to an AI model through Nebius.
5. The backend returns the result to the user.

Web search and model inference are separate operations. Search results can provide additional information to help the AI generate a more useful response.

## NVIDIA and Nebius Integration

Divi AI is being developed to use an NVIDIA open-source model through Nebius Token Factory.

The intended integration includes:

- **NVIDIA Nemotron:** Generates responses to user questions and supports the assistant's task-oriented features.
- **Nebius Token Factory:** Provides hosted access to the selected model through an API.
- **Python backend:** Sends requests to the model and returns its responses to the frontend.

The final implementation must identify the exact model used and demonstrate successful inference through Nebius.

### How Token Factory Supports Development

Token Factory is intended to accelerate development by providing access to a hosted model without requiring the project to purchase and manage its own GPU server.

This allows development to focus on the application interface, backend logic, search integration, and useful assistant features.

The final submission should document the actual model tested, the API integration, and the development work completed using Token Factory.

### Other Nebius Services

The application is hosted on Render. Nebius Token Factory is the intended model-serving service.

Other Nebius services, such as Serverless Endpoints or Serverless Jobs, will be documented here if they are actually used in the final implementation.

## Getting Started

### Requirements

Before running Divi AI locally, you need:

- Python 3.11 or another version supported by the project's dependencies.
- Git.
- A web browser.
- The API credentials required for the features you enable.

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/israel9281284-hue/divi-ai.git
cd divi-ai
```

### 2. Create a Virtual Environment

On Windows:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell prevents activation, you can run the virtual environment's Python directly:

```powershell
.\venv\Scripts\python -m pip install -r requirements.txt
```

On Linux or macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

If the repository contains `requirements.txt`, install the dependencies:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

The application may require API keys for web search and model access.

Configure the variables expected by the backend. For example:

```text
TAVILY_API_KEY=your_tavily_api_key
NEBIUS_API_KEY=your_nebius_api_key
```

These are example variable names. Confirm that they match the names used in `app.py`.

Replace the placeholder values with your own credentials in your local environment or hosting dashboard.

**Security warning:** Never commit real API keys, passwords, or other secrets to GitHub. Keep them in environment variables and configure them securely in Render.

### 5. Run the Application

If `app.py` defines the Flask application and starts the development server when executed, run:

```bash
python app.py
```

If the application uses a different startup command, follow the instructions defined by the current project configuration.

Open the local address printed in the terminal to access the application.

### 6. Test the Application

After starting the application, check the following:

1. Confirm that the homepage loads.
2. Test the AI chat with a simple question.
3. Test the web-search endpoint.
4. Confirm that missing or invalid API credentials produce clear errors.
5. Check the application logs if a request fails.

The AI chat and web search should be tested separately to help identify problems with individual services.

## Live Demo

**Application:** https://divi-ai.onrender.com

The deployed application should be tested before it is submitted as the official hackathon demo.

## Deployment

Divi AI is hosted on Render.

To deploy updates:

1. Commit changes to the GitHub repository.
2. Allow Render to deploy the updated code.
3. Review the deployment logs.
4. Confirm that the required environment variables are configured.
5. Test the live website and its backend endpoints.

## Privacy and Security

Divi AI is being developed with attention to the safe handling of user information.

- API keys should remain on the server.
- Secrets must not be committed to the public repository.
- User information should only be stored when the relevant functionality is implemented and configured.
- Account and memory features should be tested before being described as fully available.

## Current Development Status

Divi AI is an active development project.

Current priorities include:

1. Verifying the Tavily web-search integration.
2. Improving the chat and assistant features.
3. Verifying NVIDIA Nemotron access through Nebius Token Factory.
4. Testing the complete application.
5. Completing the hackathon demonstration and documentation.

## Future Improvements

Planned improvements include:

- More reliable AI responses.
- Better web-assisted answers.
- Task-oriented agent workflows.
- Persistent user memory.
- Improved conversation history.
- Better error handling and testing.

## License

Divi AI is licensed under the Mozilla Public License 2.0 (MPL 2.0).

See the [LICENSE](LICENSE) file for the complete license terms.

## Links

- **GitHub Repository:** https://github.com/israel9281284-hue/divi-ai
- **Live Application:** https://divi-ai.onrender.com
- **Hackathon:** Nebius × NVIDIA Global AI Hackathon
