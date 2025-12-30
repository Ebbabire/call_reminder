# Debugging Vapi Integration

## Issues Fixed

1. **API Endpoint**: Changed from `/call` to `/calls` (plural) - this was the main issue
2. **Enhanced Logging**: Added detailed logging for requests and responses
3. **Better Error Handling**: Improved error messages and response parsing
4. **Manual Trigger Endpoint**: Added `/api/v1/test/trigger-scheduler` to manually test

## How to Debug

### 1. Check Vapi Configuration

Visit: http://localhost:8000/health

This will show:
- `vapi_configured`: Whether Vapi credentials are set
- `vapi_healthy`: Whether Vapi API is reachable
- `scheduler_running`: Whether the background scheduler is active

### 2. Check Backend Logs

When the scheduler runs, you should see logs like:
```
INFO: Reminder scheduler started. Checking every 30 seconds.
INFO: Found 1 due reminder(s) to process
INFO: Processing reminder 1: 'Test Reminder' for +1234567890
```

If Vapi is not configured, you'll see:
```
ERROR: Vapi configuration error: Vapi API key is not configured
```

### 3. Manual Testing

**Test the scheduler manually:**
```bash
curl -X POST http://localhost:8000/api/v1/test/trigger-scheduler
```

**Check for due reminders:**
```bash
curl http://localhost:8000/api/v1/reminders?status=scheduled
```

### 4. Verify Vapi Credentials

Make sure your `.env` file has:
```env
VAPI_API_KEY=your_actual_api_key
VAPI_API_URL=https://api.vapi.ai
VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PHONE_NUMBER_ID=your_phone_number_id
```

### 5. Common Issues

**Issue: "Vapi API key is not configured"**
- Solution: Add `VAPI_API_KEY` to your `.env` file

**Issue: "Vapi API error (401)"**
- Solution: Check that your API key is correct and not expired

**Issue: "Vapi API error (404)"**
- Solution: Verify the endpoint URL is correct (should be `https://api.vapi.ai/calls`)

**Issue: Scheduler not running**
- Solution: Check backend logs for startup errors. The scheduler should start automatically when the FastAPI app starts.

**Issue: Reminders not triggering**
- Check that `trigger_at` is in the past (UTC time)
- Check that reminder `status` is `scheduled`
- Check backend logs for processing messages

### 6. Enable Debug Logging

To see more detailed logs, you can temporarily change the log level in `backend/app/main.py`:

```python
logging.basicConfig(
    level=logging.DEBUG,  # Change from INFO to DEBUG
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
```

### 7. Test Vapi API Directly

You can test the Vapi API directly using curl:

```bash
curl -X POST https://api.vapi.ai/calls \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "assistantId": "YOUR_ASSISTANT_ID",
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
    "customer": {
      "number": "+1234567890"
    }
  }'
```

## Expected Behavior

1. **Scheduler starts** when FastAPI app starts
2. **Every 30 seconds**, scheduler checks for due reminders
3. **When a reminder is due** (trigger_at <= now UTC):
   - Scheduler calls Vapi API
   - If successful: reminder status → `completed`
   - If failed: reminder status → `failed`
4. **Logs show** the processing status

## Next Steps

If issues persist:
1. Check backend logs for specific error messages
2. Verify Vapi credentials are correct
3. Test Vapi API directly with curl
4. Check that reminders have `trigger_at` in the past
5. Verify reminder status is `scheduled`
