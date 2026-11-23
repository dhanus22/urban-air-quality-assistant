# 🌬️ Urban Air Quality Assistant

> A GenAI-powered web application that helps families and communities navigate severe winter smog and urban air pollution with personalized, actionable guidance.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash-orange.svg)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Problem Statement

Winter smog and urban air pollution are critical health hazards affecting millions of families worldwide. Many people lack access to:
- **Real-time, localized air quality data** in an understandable format
- **Personalized guidance** on how to protect their families
- **Practical alternatives** to high-emission daily habits
- **Clear understanding** of how their choices impact air quality

**Urban Air Quality Assistant** bridges this gap using Generative AI to provide tailored, actionable advice.

---

## ✨ Key Features

### 📊 Real-Time Air Quality Dashboard
- Live AQI data for any city worldwide (powered by WAQI/AQICN)
- Visual gauge with color-coded severity levels
- Individual pollutant breakdown (PM2.5, PM10, NO₂, O₃, SO₂, CO)
- Weather conditions and health advisories
- Geolocation support for automatic city detection

### 💬 AI Chat Assistant
- Conversational interface powered by Google Gemini 2.5 Flash
- Context-aware responses based on current local AQI
- Quick-action prompts for common pollution questions
- Personalized advice for families, children, elderly, and more

### 📅 Low-Emission Daily Routines
- AI-generated daily schedules tailored to your lifestyle
- Emission impact ratings for each activity
- Sustainable alternatives for high-emission habits
- Health tips integrated into your routine

### 🏠 Indoor Air Quality Hacks
- Room-specific improvement recommendations
- Budget-conscious solutions (Low/Medium/High)
- DIY step-by-step instructions
- Effectiveness ratings for each hack

### 📈 Impact Calculator
- Quantified CO₂ reduction from lifestyle changes
- Health benefit analysis
- Community-level impact visualization
- Actionable tips for maximum impact

---

## 🏗️ Architecture

```
urban-air-quality-assistant/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # App entry point
│   ├── config.py              # Environment configuration
│   ├── models/
│   │   └── schemas.py         # Pydantic request/response models
│   ├── routers/
│   │   ├── air_quality.py     # AQ data endpoints
│   │   └── assistant.py       # AI assistant endpoints
│   ├── services/
│   │   ├── aqi_service.py     # WAQI API client + caching
│   │   └── gemini_service.py  # Gemini AI client
│   ├── middleware/
│   │   └── security.py        # Security headers + rate limiting
│   ├── utils/
│   │   └── prompts.py         # GenAI system prompts
│   └── tests/                 # pytest test suite
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript interfaces
│   │   └── __tests__/         # Vitest test suite
│   └── index.html
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** — [Download](https://python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **WAQI API Token** (free) — [Get Token](https://aqicn.org/data-platform/token/)
- **Google Gemini API Key** (free) — [Get Key](https://aistudio.google.com/app/apikey)

### 1. Clone & Setup Environment

```bash
# Navigate to the project
cd urban-air-quality-assistant

# Create backend virtual environment
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Configure API Keys

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your API keys
# WAQI_API_TOKEN=your_token_here
# GEMINI_API_KEY=your_key_here
```

### 3. Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive API documentation.

### 4. Setup & Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v --cov=. --cov-report=term-missing
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| **API Key Protection** | Server-side proxying; keys never exposed to client |
| **Input Validation** | Pydantic models with strict validators |
| **Rate Limiting** | slowapi with per-IP, per-endpoint limits |
| **CORS** | Explicit origin whitelist (no wildcards) |
| **Security Headers** | X-Frame-Options, CSP, HSTS, X-Content-Type-Options |
| **XSS Prevention** | Input sanitization + Content-Security-Policy |

---

## ♿ Accessibility (WCAG 2.1 AA)

- ✅ Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- ✅ ARIA landmarks and labels on all interactive elements
- ✅ Keyboard navigation with visible focus indicators
- ✅ Skip-to-content link
- ✅ Color contrast ratios ≥ 4.5:1
- ✅ Screen reader announcements for dynamic content (`aria-live`)
- ✅ Responsive design (mobile-first)
- ✅ Respects `prefers-reduced-motion` for animations

---

## 📡 API Reference

### Air Quality Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/air-quality/{city}` | Get AQI for a city |
| GET | `/api/v1/air-quality/geo/{lat}/{lng}` | Get AQI by coordinates |
| GET | `/api/v1/air-quality/search/{keyword}` | Search monitoring stations |

### AI Assistant Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/assistant/chat` | Chat with AI assistant |
| POST | `/api/v1/assistant/routines` | Generate daily routines |
| POST | `/api/v1/assistant/indoor-hacks` | Get indoor AQ hacks |
| POST | `/api/v1/assistant/impact` | Calculate impact of changes |

### Utility Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript 5.7, Vite 6, Tailwind CSS 3.4
- **Backend**: Python 3.11, FastAPI 0.115, Pydantic 2.10
- **AI**: Google Gemini 2.5 Flash via `google-genai` SDK
- **Data**: WAQI/AQICN Real-time Air Quality API
- **Testing**: pytest, Vitest, React Testing Library
- **Security**: slowapi, CORS middleware, CSP headers

---

## 🏆 Hackathon Context

This project was built for **Virtual Prompt Wars by HackToSkill**, focusing on leveraging Generative AI to solve real-world environmental challenges.

### Evaluation Criteria Addressed
1. **Code Quality** — TypeScript strict mode, Python type hints, clean architecture
2. **Security** — Multi-layer security stack, input validation, rate limiting
3. **Efficiency** — Caching, async operations, lazy loading, debouncing
4. **Testing** — Unit + integration tests with 80%+ coverage target
5. **Accessibility** — WCAG 2.1 AA compliance throughout
6. **Problem Statement Alignment** — Every feature directly addresses winter smog navigation

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 💚 for cleaner air and healthier communities
</p>
