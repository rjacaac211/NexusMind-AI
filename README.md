# NexusMind AI — Deep Research Agent System

## Overview

NexusMind AI is a cutting-edge application designed to automate and streamline the process of generating in-depth research reports on a variety of topics. Leveraging advanced natural language processing, multi-turn feedback loops, and modern web technologies, NexusMind AI guides users through a dynamic conversation to produce detailed, structured reports.

## Project File Strucure
```
NexusMind-AI/
├── backend/                              # Backend service
│   ├── Dockerfile                        # Dockerfile for the backend
│   ├── requirements.txt                  # Python dependencies
│   └── app/
│       ├── __init__.py                   
│       ├── main.py                       # FastAPI application entry point
│       ├── api/
│       │   ├── __init__.py  
│       │   └── routes.py                 # API routes
│       └── core/
│           ├── __init__.py 
│           └── deep_research_agent.py    # Deep research agent logic
├── frontend/                             # Frontend service
│   ├── Dockerfile                        # Dockerfile for the frontend
│   ├── package.json                      # NPM package file
│   ├── package-lock.json                 # NPM lock file
│   ├── postcss.config.js                 # PostCSS config
│   ├── tailwind.config.js                # Tailwind CSS config
│   ├── public/
│   │   └── index.html                    # HTML entry point
│   └── src/
│       ├── App.js                        # Root React component
│       ├── App.css                       # Global custom CSS
│       ├── index.js                      # React entry point
│       ├── index.css                     # Tailwind directives
│       ├── reportWebVitals.js            # ADD COMMENT HERE
│       ├── components/
│       │   ├── Navbar.js                 # Navigation bar component
│       │   └── ChatBox.js                # Chat interface component
│       ├── pages/
│       │   ├── Home.js                   # Home page component
│       │   ├── About.js                  # About page component
│       │   └── Contact.js                # Contact page component
│       └── utils/
│           └── downloadPdf.js            # Utility for triggering PDF download from the server
└── docker-compose.yaml                   # Docker Compose file to run frontend and backend together
```