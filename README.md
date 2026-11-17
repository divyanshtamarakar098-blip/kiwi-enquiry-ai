# Kiwi Connect Digital - AI-Powered Workflow Automation System

An end-to-end intelligent customer enquiry management and workflow automation platform built for **Kiwi Connect Digital**.

The system automates the intake, understanding, extraction, categorization, lead scoring, and draft response generation for customer business enquiries using **Google Gemini (gemini-3.5-flash-lite)**, **FastAPI**, **SQLite (SQLAlchemy)**, and **React + Tailwind CSS**.

---

## 🌟 Key Features

### 1. Enquiry Input System
- Clean customer enquiry submission form with validation for Name, Phone Number, Email, and Message.
- One-click demo sample buttons (including the Indore E-commerce test case).
- Live AI feedback display upon submission.

### 2. AI-Powered Workflow & Analysis
Single-call, structured JSON analysis using Google Gemini and Pydantic:
- **Executive Summary:** Concise 2-3 sentence distillation of client needs.
- **Service Classification:** Automatic classification into exactly one of 7 official categories:
  - *Website Development*
  - *Mobile Application Development*
  - *AI Software Development*
  - *Digital Marketing*
  - *E-commerce Development*
  - *Custom Software Development*
  - *Other Services*
- **Parameter Extraction:** Extracts **Budget**, **Location (City/Region)**, and **Urgency**.
- **Project Requirements & Missing Information:** Extracts key features and identifies missing data needed before quoting.
- **Priority Assignment:** Low, Medium, or High priority calculated based on urgency, scope, and budget.
- **AI Lead Scoring:** 0 to 100 lead quality rating based on commercial readiness.
- **Customer Response Generation:** Polite, tailored response with suggested next steps and follow-up questions.

### 3. Admin Workflow Dashboard
- **KPI Metrics:** Total, New, High-Priority, In-Progress, and Converted enquiry cards.
- **Category-Wise Distribution:** Visual percentage and volume breakdown across all 7 categories.
- **Search & Filtering:** Real-time search by keyword, city, or contact info; filter by category, status, and priority.
- **Inline Status Management:** Quick update dropdowns for *New*, *In Progress*, *Converted*, and *Closed*.
- **Admin Review & Edit:** Modal to review AI findings and edit the drafted customer response.
- **CSV Data Export:** One-click CSV export of all filtered enquiries.
- **Duplicate Detection:** Automatic flag if a duplicate contact submits multiple requests.
- **AI Re-Analysis:** Re-evaluate enquiries if previously in `AI Pending` state.

---

## 🏗️ Architecture & 9-Step Expected Workflow

```
[Customer Form / Admin]
          │
          ▼
   1. Submits Enquiry (Name, Phone, Email, Message)
          │
          ▼
   2. FastAPI Backend receives payload & validates via Pydantic
          │
          ▼
   3. Duplicate Enquiry Check (Matches previous phone/email)
          │
          ▼
   4. Google Gemini AI analyzes the customer's message
          │
          ▼
   5. AI returns strict JSON schema (response_schema enforcement)
          │
          ▼
   6. System validates categorization (1 of 7 allowed)
          │
          ▼
   7. AI assigns Priority (Low / Medium / High) & Lead Score (0-100)
          │
          ▼
   8. AI drafts personalized suggested response & next steps
          │
          ▼
   9. Committed to SQLite DB -> Real-time display on Admin Dashboard
```

---

## 🗄️ Database Schema (`enquiries` table)

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK) | Auto-incrementing unique enquiry identifier |
| `customer_name` | VARCHAR(100) | Customer's full name |
| `phone_number` | VARCHAR(20) | Customer's phone number |
| `email` | VARCHAR(120) | Customer's email address |
| `message` | TEXT | Raw enquiry message submitted |
| `status` | VARCHAR(30) | `New`, `In Progress`, `Converted`, `Closed`, `AI Pending` |
| `category` | VARCHAR(50) | Exactly one of the 7 official company categories |
| `priority` | VARCHAR(20) | `Low`, `Medium`, or `High` |
| `summary` | TEXT | AI-generated executive summary |
| `service_type` | VARCHAR(100) | Extracted service (e.g., E-commerce Web Application) |
| `budget` | VARCHAR(50) | Extracted budget (e.g., "Rs 50,000") or "Not specified" |
| `location` | VARCHAR(100) | Extracted location (e.g., "Indore") or "Not specified" |
| `urgency` | VARCHAR(50) | Extracted urgency/timeline level |
| `requirements` | JSON | List of extracted project requirements |
| `missing_info` | JSON | List of missing project parameters |
| `suggested_response`| TEXT | AI drafted customer email/message reply |
| `next_steps` | JSON | List of recommended action steps |
| `follow_up_questions`| JSON | List of questions targeting missing info |
| `edited_response` | TEXT | Admin-customized response (if edited) |
| `lead_score` | INTEGER | Lead quality score from 0 to 100 |
| `is_duplicate` | INTEGER | 1 if duplicate email/phone detected, 0 otherwise |
| `duplicate_of_id` | INTEGER | ID of previous enquiry if duplicate |
| `created_at` | DATETIME | Timestamp of creation (UTC) |
| `updated_at` | DATETIME | Timestamp of last status/response update (UTC) |

---

## 🚀 Installation & Local Setup

### Prerequisites
- Python 3.10+ (Tested on Python 3.12)
- Node.js 18+ (Tested on Node.js 24)
- Google Gemini API Key (Free tier from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Backend Setup

```powershell
# Open terminal and navigate to the backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure your Gemini API Key in .env
# Open .env and add:
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```
Backend will be live at: `http://127.0.0.1:8000`  
Interactive Swagger documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```powershell
# In a new terminal, navigate to the frontend directory
cd frontend

# Install node packages
npm install

# Start Vite React development server
npm run dev
```
Frontend will be live at: `http://localhost:5173`

---

## 🧪 Testing the Indore Example Enquiry

Submit this enquiry via the form or REST API:
> *"I own a clothing store in Indore. I need an e-commerce website where customers can browse products, place orders and make online payments. My budget is around Rs 50,000."*

### Result verified:
- **Category:** `E-commerce Development`
- **Location:** `Indore`
- **Budget:** `Rs 50,000` (or `50,000 INR`)
- **Urgency:** `Medium`
- **Missing Information:** Expected project launch timeline, preferred payment gateway (e.g. Razorpay/Paytm), product catalog volume.
- **Priority:** `Medium` / `High`
- **Lead Score:** `80-90 / 100` (High purchase intent with stated budget).

---


## AI Model Used

- **Model:** Google Gemini `gemini-3.5-flash-lite` (free tier), called through the `google-genai` SDK. The model name comes from the `GEMINI_MODEL` setting in `.env`, so it can be changed without touching the code.
- **Why this model:** the app makes one AI call per enquiry, so a lite model keeps cost and latency low while still returning valid structured JSON. It also supports Hinglish messages.
- **Structured extraction:** one call with a JSON response schema returns the summary, service type, budget, location, urgency, requirements, missing information, category, priority, lead score, suggested reply, next steps and follow-up questions.
- **Prompt rules:** the category and priority rules are written in `backend/app/services/prompts.py`. For example, "E-commerce Development" is chosen only when the customer mentions selling online, and High priority needs a deadline or a large budget.
- **Handling incorrect AI output:** the response is validated with Pydantic (allowed categories, priority values, score range). If validation fails, the call is retried once. If Gemini still fails, or the API returns an error, the enquiry is saved with status `AI Pending`, a rule-based fallback fills the fields, and the real error is stored in `ai_error` for the admin.
- **Traceability:** every enquiry stores which engine produced it in `ai_engine`, and the admin can re-run the analysis.

## Third-Party Libraries and Tools

**Backend (Python):** FastAPI, Uvicorn, SQLAlchemy, Pydantic, google-genai, python-dotenv, PyJWT, httpx, email-validator.

**Frontend:** React, Vite, Tailwind CSS, react-router-dom.

**Services and tools:** Google AI Studio (free Gemini API key), SQLite, Git and GitHub. The code was written with help from AI coding assistants, and I can explain the full implementation.

## Admin Login

Set `ADMIN_PASSWORD` and `JWT_SECRET` in `backend/.env` (see `backend/.env.example`). Open http://localhost:5173/admin and sign in with that password. The customer page at http://localhost:5173 shows only the enquiry form.

## Security Notes

- API keys and passwords are stored in `.env`, which is git-ignored. Only `.env.example` is committed.
- All admin routes require a JWT, and the login endpoint is rate-limited.
- Only sample customer data is used.
- A production version would use individual admin accounts, hashed passwords, HTTPS, PostgreSQL and a background queue for the AI step.
