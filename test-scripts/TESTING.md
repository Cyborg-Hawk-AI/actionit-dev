# Action.IT Testing Guide

## Quick Start for Testing

### 1. Home Page
- Navigate to `/` to see the landing page
- Click "Login" in the header or "Test Login" button to access the login page

### 2. Login Page
- Navigate to `/login` to access the login interface
- Use the "Test Login (Development)" button for quick testing
- Or use the regular login form with test credentials

### 3. Test User Credentials
```
Email: test@action.it
Password: testpassword123
```

### 4. Creating a Test User
If you need to create a test user in Supabase:

1. Set your Supabase service role key:
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

2. Run the test user creation script:
```bash
node scripts/create-test-user.js
```

### 5. App Routes
After logging in, you can access:
- `/app` - Main dashboard
- `/app/calendar` - Calendar view
- `/app/settings` - Settings page
- `/app/meetings/:meetingId` - Meeting details

### 6. Development Features
- **Test Login Button**: Quick access for development
- **Debug Logging**: Check browser console for auth state changes
- **Error Handling**: Toast notifications for login errors

### 7. Testing Checklist
- [ ] Home page loads correctly
- [ ] Login button works
- [ ] Test login creates session
- [ ] Dashboard loads after login
- [ ] Logout works properly
- [ ] Auth state persists on refresh

### 8. Troubleshooting
- Check browser console for auth debug logs
- Verify Supabase connection in network tab
- Ensure environment variables are set correctly
- Check Supabase dashboard for user creation

## Environment Variables
Make sure these are set in your `.env.local`:
```
REACT_APP_SUPABASE_URL=https://vfsnygvfgtqwjwrwnseg.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
``` 