# Letshire - AI Recruiter Chat Assistant

Letshire is an AI-powered recruiter assistant that allows recruiters to interact with a candidate's resume through a conversational interface. The system parses the resume into a structured profile and uses an LLM to answer recruiter questions strictly based on the candidate's provided information.

## Features

- **Resume Parsing**  
  Extracts information from PDF resumes and converts unstructured content into a structured JSON profile.

- **Schema Validation**  
  Uses Pydantic models to validate extracted resume data, like skills, experience, education, and projects.

- **Resume-Grounded Q&A**  
  Recruiters can ask questions about the candidate and receive answers based only on the available resume information, reducing unsupported or hallucinated claims.

- **Conversational Interface**  
  React-based chat interface with persistent conversation history.

- **Optimized LLM Usage**  
  Resume parsing is performed once during application startup instead of repeatedly for every conversation, reducing unnecessary LLM API calls.

- **Production Deployment**  
  Frontend deployed on Vercel and backend deployed on Render with environment-based configuration.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- Pydantic
- PyPDF

### AI
- Groq LLM API
- LLM-based resume extraction
- Resume-grounded question answering

### Deployment
- Vercel
- Render

## Architecture

```text
                    ┌──────────────────┐
                    │   React Frontend │
                    │      (Vite)      │
                    └────────┬─────────┘
                             │
                             │ REST API
                             ▼
                    ┌──────────────────┐
                    │   FastAPI        │
                    │     Backend      │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
          ┌──────────────┐        ┌──────────────┐
          │ Resume Parser│        │ Chat Service │
          └──────┬───────┘        └──────┬───────┘
                 │                       │
                 └───────────┬───────────┘
                             ▼
                    ┌──────────────────┐
                    │   Groq LLM API   │
                    └──────────────────┘
