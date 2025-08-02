# Test Scripts Directory

This directory contains all testing utilities, scripts, and documentation for the Action.IT application.

## Directory Structure

```
test-scripts/
├── README.md                    # This file
├── TESTING.md                   # Main testing guide
├── create-test-user.js          # Supabase test user creation
├── test-auth-flow.js            # Authentication flow testing
├── test-calendar-integration.js # Calendar API testing
└── utils/                      # Testing utilities
    ├── test-helpers.js         # Common testing functions
```

## Available Scripts

### 1. `create-test-user.js`
Creates a test user in Supabase for development testing.

**Usage:**
```bash
node test-scripts/create-test-user.js
```

**Prerequisites:**
- Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Supabase project configured

### 2. `test-auth-flow.js`
Tests the complete authentication flow including login, logout, and session management.

**Usage:**
```bash
node test-scripts/test-auth-flow.js
```

### 3. `test-calendar-integration.js`
Tests Google Calendar integration and OAuth flow.

**Usage:**
```bash
node test-scripts/test-calendar-integration.js
```



## Testing Utilities

### `utils/test-helpers.js`
Common testing functions used across multiple test scripts.



## Quick Start

1. **Set up environment variables:**
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_URL="https://vfsnygvfgtqwjwrwnseg.supabase.co"
```

2. **Create test user:**
```bash
node test-scripts/create-test-user.js
```

3. **Run authentication tests:**
```bash
node test-scripts/test-auth-flow.js
```

4. **Test calendar integration:**
```bash
node test-scripts/test-calendar-integration.js
```

## Test Data

### Test User Credentials
- **Email:** `test@action.it`
- **Password:** `testpassword123`



## Integration with Application

The test scripts work with the following application features:

- **Test Login:** Quick login button for development
- **Auth Context:** Session management and user state

## Troubleshooting

### Common Issues

1. **Supabase Connection Errors:**
   - Verify environment variables are set
   - Check Supabase project configuration
   - Ensure service role key has proper permissions

2. **Test User Creation Fails:**
   - User may already exist
   - Check Supabase dashboard for existing users
   - Verify email confirmation settings



### Debug Mode

Enable debug logging by setting:
```bash
export DEBUG=true
```

This will provide detailed console output for all test operations.

## Contributing

When adding new test scripts:

1. Follow the naming convention: `test-*.js`
2. Include proper error handling
3. Add documentation to this README
4. Update the main `TESTING.md` guide if needed
5. Include usage examples and prerequisites 