# RJ Dental Care PH — Frontend

This **React**-based frontend provides the user interface for the RJ Dental Care PH application. It features:
- **Chat Interface** with voice input support using the Deepgram API.
- **Oral Disease Image Upload** for classification (Caries or Gingivitis).
- **React Router** for navigating different pages (Home, About, Products, Contact).

## Table of Contents
- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Features](#features)
- [Setup & Installation](#setup--installation)
- [How It Works](#how-it-works)

## Overview

The **frontend** communicates with the FastAPI **backend** to handle:
- **Chat messages** and **voice transcription**.
- **Image prediction** for oral diseases.
- **Chat history** retrieval from MongoDB via the backend API.

## Folder Structure

```
frontend/
├── Dockerfile                  # Docker configuration for building the React frontend
├── package.json                # npm metadata and scripts
├── package-lock.json           # Generated lock file with exact dependency versions
├── postcss.config.js           # PostCSS configuration (for Tailwind)
├── tailwind.config.js          # TailwindCSS configuration
└── src/
    ├── App.css                 # Basic styling
    ├── App.js                  # Main React component with routing
    ├── index.css               # Tailwind imports (base, components, utilities)
    ├── index.js                # Renders <App /> into the DOM
    ├── reportWebVitals.js      # Performance metrics (optional)
    ├── components/
    │   ├── ChatBox.js          # Chat UI with voice input & message persistence
    │   ├── ImageUpload.js      # Image upload & prediction feature
    │   └── Navbar.js           # Navigation bar
    └── pages/
        ├── About.js            # About page
        ├── Contact.js          # Contact page
        ├── Home.js             # Home page
        └── Products.js         # Products page
```

## Features

- **Voice-Enabled Chat**: Users can record audio and receive transcriptions from Deepgram.
- **Oral Disease Prediction**: Upload images to classify Caries or Gingivitis.
- **Simple Routing**: Navigate between Home, About, Products, and Contact.
- **TailwindCSS** for styling.

## Setup & Installation

1. **Install Dependencies**
    If you're **not** using Docker Compose and want to run the frontend standalone, install dependencies via:
    ```bash
    cd frontend
    npm install
    ```

2. **Run with Docker**  
   The recommended approach is to use Docker (or Docker Compose) for a consistent environment:
    ```bash
    cd backend
    docker compose up -d --build frontend
    ```
    This will build and start the frontend container on port `3000`.

    > **Note:** Typically, this frontend is part of a multi-container setup (alongside the backend and database), orchestrated by Docker Compose. 
    > Refer to the project's main [README](../README.md) for details on full-stack deployment.

## How It Works

1. **Routing & Pages**  
   - The application uses **React Router** (`BrowserRouter`) to handle different pages (Home, About, Products, Contact).  
   - The `Navbar` component provides links to these pages for easy navigation.

2. **Home Page**  
   - Displays two main features:
     - **ImageUpload**: Allows users to upload an oral image, which is sent to the backend (`/api/predict`) for classification (e.g., Caries or Gingivitis). The result is then displayed on the page.
     - **ChatBox**: Provides a chat interface that sends messages to the backend (`/api/chat`) and displays bot responses. It also supports:
       - **Voice Input**: Users can record audio and have it transcribed via the backend (`/api/transcribe`) using Deepgram’s Speech-to-Text API.
       - **Chat History Persistence**: A unique `session_id` is stored in `localStorage` so that past conversation messages can be retrieved from MongoDB whenever the user revisits or reloads the page.

3. **State Management & UI Updates**  
   - **React Hooks** (`useState`, `useEffect`) are used to manage component state (e.g., storing messages, tracking if audio is recording).
   - **Axios** handles all network requests to the backend. The responses are used to update the UI in real time.

4. **Styling**  
   - **TailwindCSS** is used for rapid styling through utility classes. Additional custom CSS is provided in `App.css`.

Overall, the frontend provides a clean, interactive interface for uploading oral images and chatting with the AI Assistant, with seamless communication to the FastAPI backend for all data processing. This modular approach allows easy expansion for new pages, components, and features.
