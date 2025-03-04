# NexusMind AI — Deep Research Agent Web App

​NexusMind AI is an advanced research assistant that automates the generation of in-depth research reports. By leveraging cutting-edge **natural language processing (NLP)**, **multi-turn feedback loops**, and modern web technologies, it enables users to interact dynamically to refine and produce structured reports. At its core, NexusMind AI integrates **Open Deep Research** from LangGraph, a customizable web research assistant that generates comprehensive reports on any topic. 

## Features
- **Conversational AI for Research**: Users can input a research topic, receive structured outlines, and refine results through iterative feedback.
- **Multi-Turn Feedback Loop**: The AI dynamically improves the research content based on user feedback.
- **PDF Report Generation**: Converts final research results into downloadable PDF reports.
- **Speech-to-Text Support**: Enables voice-based topic input and interaction.
- **Dark Mode**: User-friendly theme switching between light and dark modes.
- **Automatic Conversation Reset**: Restarts the conversation while preserving the final report.

## Technologies Used
### Backend (FastAPI)
- **FastAPI** (Python) – High-performance API framework.
- **LangGraph & LangChain** – Handles deep research agent creation.
- **OpenAI API** – Powering language generation.
- **Deepgram API** – Speech-to-text transcription.
- **PDFKit & Markdown** – Generating structured reports in PDF format.
- **Docker** – Containerization for easy deployment.

### Frontend (React.js)
- **React.js** – Interactive UI development.
- **Tailwind CSS** – Modern styling for UI.
- **Axios** – API communication.
- **React Markdown & Highlight.js** – Renders research results with rich formatting.

### Deployment
- **Docker Compose** – Manages both frontend and backend services.

## Project Structure
```
NexusMind-AI/
├── backend/                              # Backend service
│   ├── Dockerfile                        # Backend container setup
│   ├── requirements.txt                  # Python dependencies
│   └── app/
│       ├── __init__.py                   
│       ├── main.py                       # FastAPI app entry point
│       ├── api/
│       │   ├── __init__.py  
│       │   └── routes.py                 # API endpoints
│       └── core/
│           ├── __init__.py
│           ├── deep_research_agent.py    # AI-powered research agent
├── frontend/                             # Frontend service
│   ├── Dockerfile                        # Frontend container setup
│   ├── package.json                      # Node.js dependencies
│   ├── postcss.config.js                 # PostCSS configuration
│   ├── tailwind.config.js                # Tailwind CSS setup
│   ├── public/
│   │   └── index.html                    # Main HTML entry
│   └── src/
│       ├── App.js                        # Root React component
│       ├── index.js                      # React app entry point
│       ├── components/
│       │   ├── Navbar.js                 # Navigation bar
│       │   └── ChatBox.js                # Main chat interface
│       ├── pages/
│       │   ├── Home.js                   # Home page
│       │   ├── About.js                  # About page
│       │   └── Contact.js                # Contact page
│       └── utils/
│           └── downloadPdf.js            # PDF generation utility
└── docker-compose.yaml                   # Orchestration for frontend & backend
```

## Installation & Setup
### Prerequisites
- **Docker** & **Docker Compose** installed.

### Running with Docker
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/NexusMind-AI.git
   cd NexusMind-AI
   ```
2. Start the services using Docker Compose:
   ```bash
   docker compose up --build
   ```
3. Access the web app at **http://localhost:3000**.

## API Endpoints
| Endpoint               | Method | Description |
|------------------------|--------|-------------|
| `/api/start_research`  | POST   | Start a research session |
| `/api/resume`          | POST   | Resume research with feedback |
| `/api/generate_pdf`    | POST   | Convert research to PDF |
| `/api/transcribe`      | POST   | Convert speech to text |
| `/api/reset`           | POST   | Reset conversation & AI memory |

---
**Developed by RJ Aca-ac**

