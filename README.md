# NetraX — AI-Powered Diabetic Retinopathy Screening & Tele-Ophthalmology Platform 👁️✨

**NetraX** is an enterprise-grade, full-stack AI platform for Diabetic Retinopathy (DR) screening, clinical decision support, and tele-ophthalmology workflow management. It combines Deep Learning (CNNs), Quantum Machine Learning (QML), explainable AI (Grad-CAM), lesion detection, automated clinical report generation (PDF), and hardware/network simulation for peripheral screening centers.

---

## 🌟 Key Features & Capabilities

### 🩺 1. Comprehensive Screening Workflow
* **Patient Context & Registration**: Search, register, and manage patient records across primary and secondary eye care centers.
* **Retinal Image Ingestion & Quality Check**: Multi-angle image upload with automated quality assessment and artifact detection.
* **Image Enhancement**: Contrast adjustment, CLAHE (Contrast Limited Adaptive Histogram Equalization), and noise reduction filters.
* **AI Analysis & Grading**: DR severity classification (No DR, Mild, Moderate, Severe, Proliferative DR) powered by CNN and QML architectures.
* **Explainable AI (XAI)**: Heatmap visualization using Grad-CAM to highlight regions of clinical interest.
* **Lesion Detection & Evidence Mapping**: Interactive detection and segmentation of microaneurysms, hemorrhages, hard exudates, and soft exudates (cotton wool spots).
* **Model Comparison Engine**: Direct side-by-side evaluation of classical CNN vs. QML model predictions, confidence scores, and latency metrics.
* **Clinical Decision Support & Referrals**: Structured reviewer workflow, doctor sign-off, urgent referral routing, and automated PDF clinical report generation.

### 📊 2. Analytics & Operations Management
* **Interactive Dashboard**: High-level telemetry on total screenings, DR prevalence, center performance, and referral bottlenecks.
* **Quality Analytics**: Track image acquisition error rates, re-take rates, and camera calibration metrics.
* **Model Performance Metrics**: Monitor sensitivity, specificity, AUC-ROC, and confusion matrices across deployed models.
* **Hardware & Tele-Ophthalmology Simulation**: Simulate bandwidth, edge inference latency, battery consumption, and hardware resource allocation (Simulink integration).

### 🔒 3. Enterprise Security & Access Control
* **Role-Based Access Control (RBAC)**: Fine-grained permissions for:
  * 👨‍⚕️ **Ophthalmologist** (Full diagnostic review, sign-off, referral management)
  * 🩺 **Clinical Staff / Nurse** (Patient intake, image upload, initial AI preview)
  * ⚙️ **Technical Operator** (Hardware telemetry, model benchmarks, system settings)
  * 🔑 **System Administrator** (User management, role assignment, audit logs)
* **JWT Authentication**: Secure token-based API authentication.

---

## 🏗️ System Architecture & Tech Stack

```
                     ┌──────────────────────────────────────┐
                     │           React + Vite UI            │
                     │  (TypeScript, Tailwind CSS, Lucide)  │
                     └──────────────────┬───────────────────┘
                                        │ REST API (JSON)
                                        ▼
                     ┌──────────────────────────────────────┐
                     │          FastAPI Backend             │
                     │  (Python 3.10+, SQLAlchemy, Pydantic)│
                     └──────────┬────────────────┬──────────┘
                                │                │
             ┌──────────────────▼──┐          ┌──▼──────────────────┐
             │ SQLite / PostgreSQL │          │   ML / AI Engine    │
             │     Database        │          │ (PyTorch, CNN, QML) │
             └─────────────────────┘          └─────────────────────┘
```

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, PyJWT, ReportLab |
| **Machine Learning** | PyTorch, torchvision, OpenCV, NumPy, Grad-CAM, QML Stubs |
| **Database** | SQLite (Development) / PostgreSQL (Neon DB for Production) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18+ recommended) & `npm`
* **Python** (v3.10+ recommended) & `pip`
* **Git**

---

### 🔧 Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/AniyaTyagi/Diabetic-Retinopathy.git
cd Diabetic-Retinopathy
```

---

#### 2. Backend Setup (`backend/`)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration file
copy .env.example .env

# Run backend development server
uvicorn app.main:app --reload --port 8000
```
* The backend REST API will be available at: `http://localhost:8000`
* Interactive API Documentation (Swagger UI): `http://localhost:8000/docs`

---

#### 3. Frontend Setup (`frontend/`)

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* The application UI will be available at: `http://localhost:5173`

---

## 🔑 Demo Access & Roles

The system comes pre-configured with default demo accounts across all user roles:

| Role | Email | Default Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Ophthalmologist** | `arjun@netrax.health` | `netrax123` | Full clinical review, report sign-off, referrals |
| **Clinical Staff** | `priya@netrax.health` | `netrax123` | Patient intake, image capture, screening submission |
| **Technical Operator** | `vikram@netrax.health` | `netrax123` | Tele-ophthalmology ops, simulation, device status |
| **Admin** | `admin@netrax.health` | `netrax123` | User management, RBAC, system settings |

---

## 📁 Repository Structure

```
Diabetic-Retinopathy/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoint routers (auth, screenings, patients, etc.)
│   │   ├── ml/              # CNN, QML inference engines & Grad-CAM generators
│   │   ├── models/          # SQLAlchemy database models & ML weight configs
│   │   ├── schemas/         # Pydantic schemas & validation models
│   │   ├── services/        # Business logic, auth, report PDF generation
│   │   ├── config.py        # App configuration & settings
│   │   ├── database.py      # Database session setup
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Backend unit and smoke tests
│   └── requirements.txt     # Python package dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Application router & main layout
│   │   ├── pages/           # UI pages (Dashboard, Screening Workflow, Analytics, Admin)
│   │   ├── shared/          # Reusable UI components, API clients, AuthContext, RBAC helpers
│   │   ├── index.css        # Global CSS & Tailwind imports
│   │   └── main.tsx         # React entry point
│   ├── package.json         # Node.js dependencies & scripts
│   └── vite.config.ts       # Vite bundler configuration
│
├── .gitignore               # Excludes secrets, node_modules, and model weights
└── README.md                # Project documentation
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
