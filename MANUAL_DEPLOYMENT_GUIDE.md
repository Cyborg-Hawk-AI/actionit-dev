# Manual Deployment Guide for Recall.ai Integration

## 🎯 **Current Status**
- ✅ **API Key:** `8c0933578c0fbc870e520b43432b392aba8c3da9` is valid
- ✅ **Region:** `us-west-2.recall.ai` is correct
- ✅ **Bot Creation:** Direct bot creation works
- ❌ **Edge Function:** Needs manual deployment due to Docker issues

## 📋 **Step-by-Step Manual Deployment**

### **Step 1: Access Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg
   ```

2. **Navigate to Edge Functions:**
   - Click on "Edge Functions" in the left sidebar
   - Find the `recall-api` function

### **Step 2: Update Environment Variables**

1. **Go to Settings > API:**
   - Click on "Settings" in the left sidebar
   - Click on "API" tab

2. **Update the RECALL_API_KEY:**
   - Find the "Environment Variables" section
   - Add or update: `RECALL_API_KEY = 8c0933578c0fbc870e520b43432b392aba8c3da9`

### **Step 3: Deploy the Function**

#### **Option A: Via Supabase Dashboard**

1. **Edit the Function:**
   - Click on the `recall-api` function
   - Click "Edit" button

2. **Replace the Code:**
   - Copy the updated code from `supabase/functions/recall-api/index.ts`
   - Paste it into the editor

3. **Deploy:**
   - Click "Deploy" button
   - Wait for deployment to complete

#### **Option B: Via Supabase CLI (Alternative)**

If Docker issues are resolved:

```bash
# Clean up temp directory
sudo rm -rf supabase/.temp

# Deploy the function
supabase functions deploy recall-api
```

### **Step 4: Test the Deployment**

#### **Test Script:**
```javascript
// test-deployed-function.js
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';

async function testDeployedFunction() {
  const testData = {
    action: 'join-meeting-now',
    userId: 'test-user-123',
    meetingId: 'test-meeting-' + Date.now(),
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    meetingTitle: 'Test Meeting',
    botName: 'Action.IT Test Bot',
    joinMode: 'audio_only'
  };
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/recall-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ANON_KEY' // Replace with your anon key
    },
    body: JSON.stringify(testData)
  });
  
  const data = await response.json();
  console.log('Response:', data);
}

testDeployedFunction();
```

## 🔧 **Key Changes Made**

### **1. Updated API Key**
```bash
supabase secrets set RECALL_API_KEY=8c0933578c0fbc870e520b43432b392aba8c3da9
```

### **2. Updated Function Logic**
The `handleJoinMeetingNow` function now uses:

- **Direct bot creation** instead of scheduled approach
- **Correct webhook events** (`bot_status_change`, `recording_started`, etc.)
- **Proper error handling** and logging
- **No calendar dependency**

### **3. Function Endpoint**
```typescript
// Before (scheduled approach - broken)
POST /api/v2/calendar/{calendar_id}/schedule-bot/

// After (direct approach - working)
POST /api/v1/bot/
```

## 🧪 **Testing Steps**

### **1. Test API Key**
```bash
node test-your-api-key.js
```
Expected: ✅ API key works with us-west-2 region

### **2. Test Bot Creation**
```bash
node test-direct-bot-creation.js
```
Expected: ✅ Bot created successfully

### **3. Test Edge Function**
```bash
node test-deployed-function.js
```
Expected: ✅ Function returns bot_id and recording_id

## 📊 **Expected Results**

### **Successful Response:**
```json
{
  "success": true,
  "bot_id": "9b5c00a2-aa43-46e2-90b5-d5476bb83716",
  "recording_id": "123",
  "status": "joining"
}
```

### **Error Response:**
```json
{
  "error": "Error message",
  "details": "Stack trace"
}
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **401 Unauthorized:**
   - Check if API key is set correctly
   - Verify the function is deployed

2. **404 Not Found:**
   - Ensure the function name is correct
   - Check if the function is deployed

3. **500 Internal Server Error:**
   - Check function logs in Supabase dashboard
   - Verify environment variables are set

### **Debugging Steps:**

1. **Check Function Logs:**
   - Go to Edge Functions > recall-api
   - Click on "Logs" tab
   - Look for error messages

2. **Test API Key:**
   ```bash
   node test-your-api-key.js
   ```

3. **Test Direct Bot Creation:**
   ```bash
   node test-direct-bot-creation.js
   ```

## 🚀 **Next Steps After Deployment**

### **1. Test with Real Meeting URL**
```javascript
const realMeetingData = {
  action: 'join-meeting-now',
  userId: 'your-user-id',
  meetingId: 'real-meeting-id',
  meetingUrl: 'https://meet.google.com/your-real-meeting',
  meetingTitle: 'Real Meeting',
  botName: 'Action.IT',
  joinMode: 'audio_only'
};
```

### **2. Monitor Webhook Events**
- Check if webhook events are received
- Verify transcript processing works
- Monitor bot status changes

### **3. Test Other Actions**
```javascript
// Test bot listing
{ action: 'list-bots' }

// Test transcript retrieval
{ action: 'get-transcript', botId: 'bot-id' }

// Test recording start
{ action: 'start-recording', botId: 'bot-id' }
```

## 📞 **Support**

If you encounter issues:

1. **Check Supabase Dashboard Logs**
2. **Verify API Key is working** with test scripts
3. **Ensure function is deployed** correctly
4. **Test with simple bot creation** first

## ✅ **Success Criteria**

The deployment is successful when:

- ✅ Function responds to `join-meeting-now` action
- ✅ Bot is created in Recall.ai
- ✅ Recording entry is created in database
- ✅ Webhook events are received
- ✅ No 404 or 401 errors

---

**Note:** This guide assumes your Supabase project is `vfsnygvfgtqwjwrwnseg`. Replace with your actual project reference if different. 