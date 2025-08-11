# Webhook Authentication Fix Guide

## 🚨 **Issue Identified**

The webhook is failing with **401 "Missing authorization header"** because Supabase Edge Functions require authentication by default, but Recall.ai cannot send authentication headers.

## 🔧 **Solution: Make Webhook Publicly Accessible**

### **Step 1: Access Supabase Dashboard**

1. **Go to:** https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg
2. **Navigate to:** Edge Functions > recall-webhook

### **Step 2: Configure Function as Public**

1. **Click on the `recall-webhook` function**
2. **Go to "Settings" tab**
3. **Find "Invoke" section**
4. **Set "Invoke" to "Public"** (this allows unauthenticated requests)

### **Step 3: Alternative - Use JWT Verification**

If you prefer to keep authentication, you can modify the webhook to verify the Svix signature instead:

```typescript
// Add this to the webhook function
import { createHmac } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Verify Svix signature
function verifySvixSignature(payload: string, signature: string, timestamp: string, secret: string) {
  const signedContent = `${timestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedContent)
    .toString("hex");
  
  return signature === `v1,${expectedSignature}`;
}

// In the main handler
const svixSignature = req.headers.get("svix-signature");
const svixTimestamp = req.headers.get("svix-timestamp");

if (!svixSignature || !svixTimestamp) {
  return new Response(JSON.stringify({ error: "Missing Svix headers" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// Verify signature (you'll need to get the webhook secret from Recall.ai)
const isValid = verifySvixSignature(
  JSON.stringify(payload),
  svixSignature,
  svixTimestamp,
  "YOUR_WEBHOOK_SECRET"
);

if (!isValid) {
  return new Response(JSON.stringify({ error: "Invalid signature" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

## 🧪 **Testing the Fix**

### **Test 1: Public Function Test**
```bash
curl -X POST "https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "bot.done",
    "data": {
      "bot": {
        "id": "38f98d39-d97c-484d-9782-bbc6b55ad1dd"
      },
      "data": {
        "code": "done"
      }
    }
  }'
```

### **Test 2: JavaScript Test**
```javascript
// test-public-webhook.js
const response = await fetch('https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event: 'bot.done',
    data: {
      bot: { id: '38f98d39-d97c-484d-9782-bbc6b55ad1dd' },
      data: { code: 'done' }
    }
  })
});

console.log('Status:', response.status);
console.log('Response:', await response.json());
```

## 📋 **Expected Results**

### **Before Fix:**
```json
{
  "code": 401,
  "message": "Missing authorization header"
}
```

### **After Fix:**
```json
{
  "success": true,
  "status": "processed"
}
```

## 🔍 **Verification Steps**

1. **Set function to public** in Supabase dashboard
2. **Test with curl** or JavaScript
3. **Check function logs** in Supabase dashboard
4. **Verify database updates** for recording status

## 🚀 **Next Steps**

Once the webhook is publicly accessible:

1. **Test with real Recall.ai webhook** events
2. **Monitor function logs** for processing
3. **Verify transcript processing** works
4. **Check OpenAI integration** for insights generation

## 📞 **Support**

If you still encounter issues:

1. **Check function logs** in Supabase dashboard
2. **Verify function is set to public**
3. **Test with the provided scripts**
4. **Contact Supabase support** if needed

---

**Note:** Making the webhook public is the simplest solution, but you can also implement Svix signature verification for additional security. 