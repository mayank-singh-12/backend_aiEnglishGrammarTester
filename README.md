# Grammar Tester Backend

The backend for the AI English Grammar Tester application. It serves as a proxy between the React frontend and the Google Gemini AI API, managing the system prompts and interaction history.

## 🚀 Overview

This server handles the orchestration of the AI grammar tutor. It ensures that the AI adheres to a strict JSON protocol for generating questions and evaluating answers, allowing the frontend to render a consistent UI.

## 🛠️ Tech Stack

- **Node.js**: Runtime environment.
- **Express**: Web framework for creating the API.
- **@google/genai**: Official SDK for interacting with Google Gemini AI.
- **dotenv**: For secure environment variable management.
- **cors**: To allow the frontend to communicate with the server.

## 📂 Key Files

- `index.js`: The main application entry point. Contains the API endpoints and the `aiCall` wrapper for Gemini.
- `aiManual.txt`: The "system prompt." This file contains the comprehensive instructions that define the AI's persona, output format (JSON), and pedagogical rules.
- `package.json`: Project dependencies and scripts.
- `vercel.json`: Configuration for deploying the backend to Vercel.

## 🔌 API Endpoints

### `GET /`
- **Description**: Initializes the conversation.
- **Behavior**: Sends the `aiManual.txt` to the AI to trigger the initial greeting.
- **Response**: Returns a JSON object containing the AI's greeting.

### `POST /interact`
- **Description**: Handles the main quiz interaction loop.
- **Request Body**: 
  ```json
  {
    "message": "User's input string",
    "history": [
      { "role": "user", "content": "..." },
      { "role": "model", "content": "..." }
    ]
  }
  ```
- **Behavior**: Combines the system manual, conversation history, and the new message into a single prompt for the AI.
- **Response**: Returns the AI's response parsed as JSON.

## ⚙️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root of the `server` directory:
```env
GOOGLEAPI=your_google_gemini_api_key_here
PORT=5000
```

### 3. Run the Server
```bash
node index.js
```

## 🤖 AI Integration Details

The server uses the `gemini-3.5-flash` model. To prevent the AI from adding conversational filler or markdown blocks (which would break `JSON.parse`), the `aiManual.txt` explicitly forbids any text outside of the JSON objects.

The `aiCall` function also disables `thinkingConfig` to avoid `thoughtSignature` warnings in the API responses.

## 📜 License
ISC
