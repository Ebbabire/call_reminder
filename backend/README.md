# Backend Setup and Run Instructions

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

## Setup Steps

### 1. Create a Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
# Windows
copy env.example .env

# macOS/Linux
cp env.example .env
```

Edit `.env` and add your Vapi API credentials (optional for basic testing):

```env
VAPI_API_KEY=your_vapi_api_key_here
VAPI_API_URL=https://api.vapi.ai
VAPI_ASSISTANT_ID=your_assistant_id_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
```

**Note:** The backend will work without Vapi credentials, but reminder calls won't be triggered.

### 4. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 5. Run with Custom Port (Optional)

```bash
uvicorn app.main:app --reload --port 8001
```

## Development Mode

The `--reload` flag enables auto-reload on code changes, which is useful for development.

## Production Mode

For production, use:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Database

The SQLite database (`call_me_reminder.db`) will be created automatically in the backend directory on first run.

## Health Check

Test if the server is running:

```bash
curl http://localhost:8000/health
```

Or visit http://localhost:8000/health in your browser.
