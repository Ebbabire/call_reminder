# Call Me Reminder

A premium SaaS application for scheduling phone call reminders. Never miss an important call again with automated voice reminders powered by Vapi AI.

![Call Me Reminder](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🎯 Features

- **Smart Scheduling**: Schedule reminders for any time zone with automatic UTC conversion
- **Voice AI Integration**: Automated phone calls via Vapi AI to deliver your reminders
- **Beautiful UI**: Modern, responsive interface built with Next.js and Shadcn/ui
- **Real-time Updates**: Live status tracking (Scheduled, Completed, Failed)
- **Search & Filter**: Quickly find reminders by title or filter by status
- **Edit & Delete**: Full CRUD operations with intuitive dialogs
- **Background Processing**: Automatic scheduler checks for due reminders every 30 seconds
- **Timezone Support**: Automatic timezone detection and conversion

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui (Radix Nova style)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Notifications**: Sonner

### Backend
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite (development) / PostgreSQL (production)
- **Validation**: Pydantic v2
- **HTTP Client**: HTTPX (async)
- **Voice AI**: Vapi API integration
- **Background Tasks**: Asyncio-based scheduler

## 📁 Project Structure

```
call_me_reminder/
├── frontend/                    # Next.js application
│   ├── app/                     # App Router pages and layouts
│   │   ├── reminders/          # Reminders dashboard page
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx             # Landing page
│   ├── components/              # React components
│   │   ├── layout/              # Layout components (AppShell, TopNav)
│   │   ├── reminders/           # Reminder-specific components
│   │   │   ├── create-reminder-dialog.tsx
│   │   │   ├── edit-reminder-dialog.tsx
│   │   │   └── delete-reminder-dialog.tsx
│   │   ├── providers/           # Context providers
│   │   └── ui/                  # Shadcn/ui components
│   ├── hooks/                   # Custom React hooks
│   │   └── use-reminders.ts     # TanStack Query hooks
│   ├── lib/                     # Utility functions
│   │   ├── api.ts               # API client
│   │   ├── timezone.ts          # Timezone conversion utilities
│   │   └── utils.ts             # General utilities
│   └── public/                  # Static assets
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # FastAPI entry point with lifespan
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database connection and session
│   │   ├── models/              # SQLAlchemy models
│   │   │   └── reminder.py      # Reminder model
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── reminder.py      # Reminder request/response schemas
│   │   │   └── vapi.py          # Vapi API schemas
│   │   ├── routers/             # API route handlers
│   │   │   └── reminders.py     # Reminder CRUD endpoints
│   │   └── services/            # Business logic services
│   │       ├── vapi.py          # Vapi API integration
│   │       └── scheduler.py     # Background reminder processor
│   ├── env.example              # Example environment variables
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Backend-specific documentation
│
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Python** 3.11+
- **Vapi Account** (for voice call functionality) - [Sign up here](https://vapi.ai)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd call_me_reminder
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Edit .env with your Vapi credentials
# See Configuration section below
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (optional, for custom API URL)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

## ⚙️ Configuration

### Backend Configuration

Edit `backend/.env` with your settings:

```env
# Application Settings
APP_NAME=Call Me Reminder API
DEBUG=false
DATABASE_URL=sqlite:///./call_me_reminder.db

# CORS Settings (comma-separated list)
CORS_ORIGINS=["http://localhost:3000"]

# Vapi API Configuration
# Get these from https://dashboard.vapi.ai
VAPI_API_KEY=your_vapi_api_key_here
VAPI_API_URL=https://api.vapi.ai
VAPI_ASSISTANT_ID=your_assistant_id_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here

# Scheduler Settings
SCHEDULER_INTERVAL_SECONDS=30
```

### Vapi Setup

1. Create an account at [Vapi Dashboard](https://dashboard.vapi.ai)
2. Create an Assistant for your reminder calls
3. Purchase or configure a phone number
4. Copy your API key, Assistant ID, and Phone Number ID to `.env`

**Note**: The backend will work without Vapi credentials, but reminder calls won't be triggered.

### Frontend Configuration

The frontend automatically connects to `http://localhost:8000/api/v1` by default. To use a different URL, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://your-api-url/api/v1
```

## 🏃 Running the Application

### Start Backend

```bash
cd backend
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000

## 📚 API Documentation

### Reminders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/reminders/` | Create a new reminder |
| `GET` | `/api/v1/reminders/` | List reminders (with pagination, filtering, search) |
| `GET` | `/api/v1/reminders/{id}` | Get a specific reminder |
| `PATCH` | `/api/v1/reminders/{id}` | Update a reminder |
| `DELETE` | `/api/v1/reminders/{id}` | Delete a reminder |

### Query Parameters

**GET `/api/v1/reminders/`**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number (1-indexed) | 1 |
| `per_page` | integer | Items per page (max 100) | 10 |
| `status` | string | Filter by status: `scheduled`, `completed`, `failed` | - |
| `search` | string | Search by title (case-insensitive) | - |

### Data Model

#### Reminder

```json
{
  "id": 1,
  "title": "Call John about project",
  "message": "Discuss Q4 roadmap and budget",
  "phone_number": "+14155551234",
  "trigger_at": "2024-01-15T14:30:00Z",
  "timezone": "America/New_York",
  "status": "scheduled",
  "created_at": "2024-01-10T10:00:00Z"
}
```

**Fields:**
- `id`: Unique identifier (auto-generated)
- `title`: Reminder title (max 255 characters)
- `message`: Reminder message (max 1000 characters)
- `phone_number`: E.164 format (e.g., +14155551234)
- `trigger_at`: UTC datetime when reminder should trigger
- `timezone`: IANA timezone identifier (e.g., America/New_York)
- `status`: `scheduled`, `completed`, or `failed`
- `created_at`: Creation timestamp (auto-generated)

### Status Lifecycle

1. **Created** → Status: `scheduled`
2. **When `trigger_at` arrives** → Background scheduler processes
3. **Vapi call succeeds** → Status: `completed`
4. **Vapi call fails** → Status: `failed`

The scheduler checks every 30 seconds for due reminders.

## 🎨 Usage Examples

### Creating a Reminder

1. Click "New Reminder" button
2. Fill in the form:
   - **Title**: Brief description
   - **Message**: Detailed reminder message
   - **Phone Number**: Your phone in E.164 format (+1...)
   - **Date & Time**: When you want to be called
3. Click "Create Reminder"

The system automatically converts your local time to UTC for storage.

### Editing a Reminder

1. Click the pencil icon on a scheduled reminder
2. Modify the fields
3. Click "Save Changes"

**Note**: Only reminders with `scheduled` status can be edited.

### Deleting a Reminder

1. Click the delete icon (X) on any reminder
2. Confirm deletion in the dialog

## 🔧 Development

### Backend Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload

# Run on custom port
uvicorn app.main:app --reload --port 8001

# Run with debug logging
# Edit backend/app/main.py and change logging level to DEBUG
```

### Frontend Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Testing the Scheduler

Manually trigger the scheduler to test immediately:

```bash
curl -X POST http://localhost:8000/api/v1/test/trigger-scheduler
```

### Components

- **Frontend**: Next.js app with React Query for state management
- **Backend**: FastAPI with SQLAlchemy ORM
- **Scheduler**: Asyncio-based background worker
- **Vapi Integration**: HTTP client for voice AI calls
- **Database**: SQLite (dev) / PostgreSQL (production)

## 📄 License

MIT License - see LICENSE file for details

## 🎯 Roadmap

- [ ] User authentication and multi-user support
- [ ] Webhook support for call status updates
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Recurring reminders
- [ ] Reminder templates
- [ ] Analytics dashboard
- [ ] Mobile app

---

Built with ❤️ using Next.js and FastAPI
