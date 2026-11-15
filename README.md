# NetraX — Explainable AI & Quantum Machine Learning for Diabetic Retinopathy Screening in Rural India 👁️✨

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![PennyLane](https://img.shields.io/badge/PennyLane-QML-FFD21E.svg)](https://pennylane.ai)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)

**NetraX** is an enterprise tele-ophthalmology and explainable AI clinical decision support system designed specifically for rural and resource-constrained primary health centres (PHCs). It couples fine-tuned Foundation Vision Models (**DINOv2**), **PennyLane Hybrid Quantum Machine Learning (QML)**, layer-wise gradient **Grad-CAM attention heatmaps**, automated multi-metric retinal quality scoring, role-based workflows, and automated tele-ophthalmology referral orchestration.

---

## 🌟 Key Capabilities

### 🩺 1. End-to-End Clinical Screening Workflow
* **Patient Intake & Consent**: Fast demographic intake with explicit informed consent capture and automatic incremental patient ID allocation (`P10001`, `P10002`...).
* **Rural Resilient Image Upload**: Client-side canvas compression automatically downsamples high-resolution smartphone/fundus photos (>1.5 MB to max 1800px 0.85 JPEG) before network transmission; supports single or both-eye (`OD` / `OS`) acquisition.
* **Objective Technical Quality Assessment**: Real image processing checks using Laplacian variance for sharpness/focus, luminance histogram distribution for illumination & glare, pixel dynamic range for contrast, and minimum resolution validation.
* **DINOv2 Deep Classification**: Direct inference on fine-tuned `facebook/dinov2-base` (346 MB, 225 transformer layers) outputting 5-class international DR severity levels:
  - **Level 0**: No Diabetic Retinopathy
  - **Level 1**: Mild Non-Proliferative DR (NPDR)
  - **Level 2**: Moderate NPDR *(Referral Threshold)*
  - **Level 3**: Severe NPDR
  - **Level 4**: Proliferative DR (PDR)
* **PennyLane Hybrid QML Classifier**: 1536-dimensional DINOv2 feature vectors are dimensionally reduced via fitted PCA (4-d), standard-scaled, and passed to a 4-qubit Quantum Variational Circuit with `AngleEmbedding` and `BasicEntanglerLayers`, yielding quantum probability distributions.
* **Explainable AI (Grad-CAM)**: Gradient backpropagation through `model.dinov2` patch tokens generates genuine attention heatmaps and transparent overlays highlighting pathological microvascular regions.
* **Separation of Clinical Decision**: Clinician reviews and specialist grades are recorded in separate audit fields (`clinician_dr_level`, `clinician_decision`, `reviewed_by`, `reviewer_override`), strictly preserving the pristine AI prediction (`dr_level`).
* **2-Page PDF Clinical Reports**: Automated FPDF2 report engine generating official clinical documents embedding patient intake data, clinician sign-off, original fundus photography, and Grad-CAM attention heatmaps side-by-side.

---

### 👥 2. Strict Role-Specific Operations (RBAC)

The system enforces strict boundary isolation so that each of the 4 assigned roles can **only** access and execute their designated tasks:

| Role | Designated Tasks | Strictly Forbidden |
|:---|:---|:---|
| **Screening Operator**<br>*(Field Health Worker / PHC)* | • Patient registration & informed consent intake<br>• Retinal image capture & upload<br>• Automated image quality inspection<br>• Executing AI analysis & viewing preliminary results<br>• Printing patient receipts & summaries<br>• Viewing camera hardware status | ❌ Doctor review & sign-off (`/screening/review`)<br>❌ Referral triage / care scheduling (`/screening/referral`)<br>❌ Specialist model comparison (`/screening/model-compare`)<br>❌ User & clinic center administration (`/users`, `/centers`) |
| **Reviewer**<br>*(Clinical QA / Second Reader)* | • Viewing unreviewed screening queue<br>• Inspecting fundus photos and Grad-CAM attention maps<br>• Comparing classical CNN vs. QML outputs<br>• Submitting clinical QA review verification & notes<br>• Viewing quality analytics dashboard | ❌ Patient registration / raw photo upload<br>❌ Referral triage & follow-up care booking<br>❌ Staff user & center management |
| **Ophthalmologist**<br>*(Senior Specialist Doctor)* | • Screening queue review with diagnostic override authority<br>• Triage priority assignment (Urgent vs. Routine)<br>• Scheduling hospital referral appointments<br>• Signing specialist diagnostic reports (`/reports/clinical`)<br>• Inspecting deep Grad-CAM overlays & benchmark metrics | ❌ Raw field image acquisition & intake<br>❌ Staff user account & role management<br>❌ Clinic center configuration |
| **Administrator**<br>*(System / Operational Admin)* | • User accounts & staff role assignment (`/users`)<br>• Telemedicine clinic & PHC center setup (`/centers`)<br>• Camera hardware inventory (`/devices`)<br>• System operational logs & n8n webhook audit trail<br>• Capacity simulation & population analytics | ❌ Submitting medical diagnostic reviews or overrides<br>❌ Capturing or uploading clinical patient screenings |

---

### 🌐 3. Rural Infrastructure Resilience
* **Dual-Language Localization (EN ↔ HI)**: Full English and Hindi (हिंदी) translations for navigation, clinical disclaimers, triage levels, and patient forms with header runtime switching persisted in `localStorage`.
* **Progressive Web App (PWA) & Offline Caching**: Built-in Service Worker (`sw.js`) and web app manifest caching the application shell and static assets, with graceful offline fallback when rural network connections drop.
* **Automated n8n Webhook Dispatcher**: Automatic event routing for `screening.created`, `screening.referral_alert`, `screening.reviewed`, and `follow_up.scheduled` with a built-in local simulation runner (`POST /api/automation/webhook`) and retry mechanics recorded in `automation_logs`.
* **Security & Hardening**: JWT Bearer token authentication, thread-safe in-memory rate limiting on login (10 attempts/min per IP, returning HTTP 429), path-containment guards preventing directory traversal, and strict image container header decoding (`JPEG`, `PNG`, `WEBP`).

---

## 🏗️ Architecture & Technology Stack

```
                             ┌──────────────────────────────────────┐
                             │       React 19 + TypeScript UI       │
                             │  (Vite, Tailwind CSS, Lucide, PWA)   │
                             └──────────────────┬───────────────────┘
                                                │ REST API (JSON)
                                                ▼
                             ┌──────────────────────────────────────┐
                             │          FastAPI Backend             │
                             │   (Python 3.11, SQLAlchemy 2.0)      │
                             └──────────┬────────────────┬──────────┘
                                        │                │
                     ┌──────────────────▼──┐          ┌──▼───────────────────────────┐
                     │ SQLite / PostgreSQL │          │        AI / ML Engine        │
                     │ Database + Sync     │          │ • DINOv2 (Vision Transformer)│
                     └─────────────────────┘          │ • PennyLane Hybrid QML       │
                                                      │ • Grad-CAM Attention Backprop│
                                                      │ • Laplacian Quality Scoring  │
                                                      └──────────────────────────────┘
```

| Component | Stack |
|:---|:---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Service Worker (PWA) |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, passlib, FPDF2, httpx |
| **Machine Learning** | PyTorch, torchvision, Hugging Face Transformers, PennyLane, scikit-learn, PIL, OpenCV |
| **Database** | SQLite (Local Development) / PostgreSQL (Production, e.g., Neon DB) |
| **Deployment** | Multi-stage Dockerfiles (`node:20-alpine`, `python:3.11-slim`), `docker-compose.yml`, Nginx |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18+) & `npm`
* **Python** (v3.10+ or v3.11 recommended) & `pip`
* **Git**

---

### Option A: Running with Docker Compose (Recommended)

To run the complete production-ready stack in unified containers:

```bash
docker-compose up --build
```
* **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
* **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Local Development Setup

#### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API will be active at: `http://localhost:8000`
* Swagger Interactive API Docs: `http://localhost:8000/docs`
* Detailed Health Check: `http://localhost:8000/api/health/detailed`

#### 2. Frontend Setup

Open a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
* Application UI will be accessible at: `http://localhost:5173`

---

## 🔑 Seeded Demo Accounts (Role Testing)

The database automatically seeds demo credentials for testing each of the 4 distinct roles:

| Role | Email | Password | Primary Workflow |
|:---|:---|:---|:---|
| **Screening Operator** | `operator@netrax.health` | `netrax123` | Patient intake, consent check, camera upload, AI triage |
| **Reviewer** | `reviewer@netrax.health` | `netrax123` | Inspecting unreviewed cases, Grad-CAM QA review |
| **Ophthalmologist** | `ophtho@netrax.health` | `netrax123` | Specialist review with override, referral priority & follow-up |
| **Administrator** | `admin@netrax.health` | `netrax123` | User roles, PHC centers, camera inventory, automation audit |

---

## 🧪 Running Tests & Quality Verification

### Run Backend Smoke & Integration Tests
```bash
cd backend
python -m pytest tests/test_smoke_api.py -v
```
*Verifies database schema synchronization, patient consent, image upload validation, clinician review override isolation, PDF report length, n8n webhook dispatching, and detailed health telemetry.*

### Run Frontend TypeScript & Build Check
```bash
cd frontend
npm run build
```
*Executes `tsc --noEmit` and Vite production bundling to ensure zero TypeScript errors.*

---

## 📁 Repository Structure

```
Diabetic-Retinopathy/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, screenings, patients, analytics, automation)
│   │   ├── ml/              # DINOv2 CNN, PennyLane QML, Grad-CAM backprop engine
│   │   │   └── weights/     # Deployed model weights, PCA, scaler, and QML state dict
│   │   ├── models/          # SQLAlchemy ORM models & database entities
│   │   ├── schemas/         # Pydantic data schemas & request validation models
│   │   ├── services/        # Business logic: auth, n8n webhook service, FPDF2 report builder
│   │   ├── config.py        # Settings management & environment variables
│   │   ├── database.py      # SQLAlchemy session & database engine
│   │   ├── deps.py          # JWT authentication & require_roles() dependencies
│   │   ├── main.py          # FastAPI application initialization & CORS config
│   │   └── schema_sync.py   # Automatic SQLite/Postgres schema migration engine
│   ├── tests/               # Pytest smoke and API integration test suites
│   ├── Dockerfile           # Python 3.11-slim production container definition
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── public/              # Static assets, favicon, manifest.json, sw.js (PWA)
│   ├── src/
│   │   ├── app/             # Application router & provider wrappers
│   │   ├── pages/           # Pages (Dashboard, Screening flow, Analytics, Admin, Reports)
│   │   ├── shared/          # Reusable UI kit, API clients, i18n dictionaries, RBAC guards
│   │   └── main.tsx         # React entry point
│   ├── Dockerfile           # Multi-stage Node 20 builder + Nginx Alpine runtime
│   ├── package.json         # Frontend dependencies and build scripts
│   └── vite.config.ts       # Vite configuration with API reverse proxy
│
├── docker-compose.yml       # Multi-container orchestration (backend + frontend)
├── .env.example             # Documented environment variables template
├── .gitignore               # Excludes secrets, node_modules, and virtual environments
└── README.md                # Comprehensive project documentation
```

---

## 📜 Medical & Diagnostic Disclaimer

> [!WARNING]
> **NetraX** is designed as an AI-powered clinical decision support and triage system for primary eye care screening. It provides triage risk categorization and explainability heatmaps to assist healthcare professionals. Final diagnostic confirmation, clinical decision overrides, and medical prescriptions must always be performed by a qualified ophthalmologist or registered medical practitioner.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
