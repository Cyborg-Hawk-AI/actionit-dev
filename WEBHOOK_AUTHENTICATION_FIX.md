# Webhook Authentication Fix - Complete Guide

## 🚨 **Current Issue**
The webhook is still returning **401 "Missing authorization header"** even after disabling JWT authentication.

## 🔧 **Step-by-Step Fix**

### **Step 1: Verify Function Settings in Supabase Dashboard**

1. **Go to:** https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg
2. **Navigate to:** Edge Functions
3. **Click on:** `recall-webhook` function
4. **Go to:** Settings tab
5. **Check:** "Invoke" setting - it should be set to **"Public"**

### **Step 2: Alternative - Check Function Configuration**

If the dashboard doesn't show the "Invoke" setting, try these steps:

1. **Go to:** Edge Functions > `recall-webhook`
2. **Click:** "Settings" or "Configuration"
3. **Look for:** "Authentication" or "Access Control"
4. **Set to:** "Public" or "No authentication required"

### **Step 3: Check Function Logs**

1. **In the function dashboard, go to:** "Logs" tab
2. **Look for:** Recent deployment logs
3. **Check if:** The function is being called and what errors appear

### **Step 4: Manual Function Configuration**

If the dashboard doesn't work, try this CLI approach:

```bash
# Check function status
supabase functions list

# Check function logs
supabase functions logs recall-webhook

# Redeploy with explicit public setting
supabase functions deploy recall-webhook --no-verify-jwt
```

### **Step 5: Test with Authentication Header**

If you can't disable authentication, test with a valid token:

```javascript
// test-with-auth.js
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Get from Supabase dashboard

const response = await fetch('https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    event: 'bot.done',
    data: {
      bot: { id: '38f98d39-d97c-484d-9782-bbc6b55ad1dd' },
      data: { code: 'done' }
    }
  })
});
```

### **Step 6: Alternative - Use Different Function Name**

If the issue persists, create a new function:

```bash
# Create a new webhook function
supabase functions new recall-webhook-public

# Copy the code from recall-webhook to the new function
# Deploy the new function
supabase functions deploy recall-webhook-public
```

## 🔍 **Troubleshooting Steps**

### **Check 1: Function Deployment Status**
```bash
supabase functions list
```

### **Check 2: Function Logs**
```bash
supabase functions logs recall-webhook --follow
```

### **Check 3: Test Function Directly**
```bash
curl -X POST "https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook" \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"test":true}}'
```

### **Check 4: Verify Environment Variables**
Make sure these are set in your Supabase project:
- `RECALL_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📋 **Expected Results**

### **After Fix:**
```json
{
  "success": true,
  "status": "bot_done",
  "botId": "38f98d39-d97c-484d-9782-bbc6b55ad1dd"
}
```

### **If Still Failing:**
```json
{
  "code": 401,
  "message": "Missing authorization header"
}
```

## 🚀 **Next Steps Once Fixed**

1. **Test with real Recall.ai webhook events**
2. **Monitor function logs** for processing
3. **Verify transcript processing** works
4. **Check OpenAI integration** for insights generation

## 📞 **If Still Having Issues**

1. **Check Supabase project settings** for function permissions
2. **Verify the function code** is correct
3. **Try creating a new function** with a different name
4. **Contact Supabase support** if needed

---

**Note:** The webhook function code is correct and ready to process events. The only issue is the authentication configuration in Supabase. 