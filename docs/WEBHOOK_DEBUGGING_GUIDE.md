# 🔍 Webhook Debugging Guide

## Issue Summary
The recall-webhook function is not triggering when meetings end, even though bots are being created successfully.

## 🔍 Current Status

### ✅ What's Working
1. **Bot Creation**: Bots are being created successfully via `recall-api` function
2. **Webhook Function**: The `recall-webhook` function is deployed and accessible
3. **Event Handlers**: Webhook function has proper handlers for all event types
4. **Database Integration**: Webhook function can update database records

### ❌ What's Not Working
1. **Webhook Events**: Recall.ai is not sending webhook events to our function
2. **Event Triggers**: No webhook invocations are being logged

## 🐛 Root Cause Analysis

### Possible Issues

#### 1. **Webhook Configuration in Bot Creation**
**Current Configuration**:
```typescript
webhooks: [
  {
    url: webhookUrl,
    events: [
      "bot_joined",
      "bot_left", 
      "recording_started",
      "recording_stopped",
      "transcript_available"
    ]
  }
]
```

**Potential Issues**:
- Webhook events might be named differently in Recall.ai API
- Webhook configuration might need to be registered separately
- Webhook URL might need authentication headers

#### 2. **Recall.ai API Documentation Mismatch**
The integration guide shows different event names than what we're using:
- Guide shows: `bot_joined`, `bot_left`, etc.
- We're using: `bot_joined`, `bot_left`, etc.
- **Need to verify**: Are these the correct event names?

#### 3. **Webhook URL Authentication**
The webhook function requires authentication, but Recall.ai might not be sending auth headers.

#### 4. **Webhook Registration Process**
Webhooks might need to be registered separately from bot creation.

## 🧪 Testing Strategy

### Test 1: Verify Webhook Function Accessibility
```bash
curl -X POST https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"event": "bot_joined", "data": {"bot_id": "test-123"}}'
```

### Test 2: Check Bot Creation with Webhooks
1. Create a bot with webhook configuration
2. Monitor Supabase function logs
3. Check if webhook URL is being called

### Test 3: Verify Recall.ai Webhook Events
1. Check Recall.ai dashboard for webhook events
2. Verify webhook URL is registered
3. Test webhook delivery

## 🔧 Potential Fixes

### Fix 1: Update Webhook Event Names
Try different event names based on Recall.ai API:
```typescript
events: [
  "bot.status_change",
  "transcript.done",
  "analysis_done",
  "recording.done"
]
```

### Fix 2: Separate Webhook Registration
Register webhooks separately from bot creation:
```typescript
// Register webhook first
await fetch(`${RECALL_API_BASE_URL}/api/v1/webhook/`, {
  method: "POST",
  headers: {
    "Authorization": `Token ${RECALL_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: webhookUrl,
    events: ["bot_joined", "bot_left", "recording_started", "recording_stopped", "transcript_available"]
  })
});
```

### Fix 3: Remove Authentication from Webhook
Make webhook function publicly accessible:
```typescript
// In recall-webhook function
serve(async (req) => {
  // Remove authentication check for webhook endpoints
  // Only require auth for other operations
});
```

### Fix 4: Use Different Webhook URL Format
Try different webhook URL formats:
- `https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook`
- `https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook/`
- Add query parameters for authentication

## 📋 Next Steps

1. **Research Recall.ai API Documentation**
   - Find official webhook event names
   - Check webhook registration process
   - Verify authentication requirements

2. **Test Webhook Function Directly**
   - Send test events to webhook function
   - Verify event handling logic
   - Check database updates

3. **Monitor Real Bot Creation**
   - Create a real bot with webhook
   - Monitor function logs
   - Check Recall.ai dashboard

4. **Contact Recall.ai Support**
   - Verify webhook configuration
   - Check if webhooks are being sent
   - Confirm event names and format

## 🎯 Expected Outcome

After implementing fixes:
1. ✅ Webhook events are received when bots join/leave meetings
2. ✅ Database records are updated automatically
3. ✅ Transcript processing is triggered
4. ✅ Post-meeting insights are generated

## 📊 Monitoring Points

- **Supabase Function Logs**: Check for webhook invocations
- **Database Updates**: Monitor `meeting_recordings` table
- **Recall.ai Dashboard**: Check bot status and webhook events
- **Network Logs**: Verify webhook URL is being called 