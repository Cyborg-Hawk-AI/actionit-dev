// Authentication Flow Testing Script
// Tests login, logout, session management, and auth state

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = "https://vfsnygvfgtqwjwrwnseg.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzEyMzcsImV4cCI6MjA2MjE0NzIzN30.tkYMaq3lvT-qXDqSNLdU2uSr-Puwhzcg-a6Sq10CBNU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USER = {
  email: 'test@action.it',
  password: 'testpassword123'
};

async function testAuthFlow() {
  console.log('🧪 Starting Authentication Flow Tests...\n');

  try {
    // Test 1: Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found for:', session.user.email);
    } else {
      console.log('ℹ️  No active session found');
    }

    // Test 2: Sign in with test credentials
    console.log('\n2. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('💡 Tip: Run create-test-user.js first to create the test user');
      }
      return;
    }

    console.log('✅ Sign in successful for:', signInData.user.email);
    console.log('   User ID:', signInData.user.id);
    console.log('   Session expires:', new Date(signInData.session.expires_at * 1000).toISOString());

    // Test 3: Verify session after sign in
    console.log('\n3. Verifying session after sign in...');
    const { data: { session: newSession } } = await supabase.auth.getSession();
    
    if (newSession) {
      console.log('✅ Session verified successfully');
      console.log('   Access token length:', newSession.access_token.length);
      console.log('   Refresh token length:', newSession.refresh_token.length);
    } else {
      console.error('❌ Session verification failed');
    }

    // Test 4: Test user metadata
    console.log('\n4. Testing user metadata...');
    const user = signInData.user;
    console.log('   Email:', user.email);
    console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Created at:', new Date(user.created_at).toISOString());
    console.log('   Last sign in:', new Date(user.last_sign_in_at).toISOString());

    // Test 5: Test sign out
    console.log('\n5. Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Sign out successful');
    }

    // Test 6: Verify session cleared
    console.log('\n6. Verifying session cleared...');
    const { data: { session: clearedSession } } = await supabase.auth.getSession();
    
    if (!clearedSession) {
      console.log('✅ Session cleared successfully');
    } else {
      console.error('❌ Session not cleared properly');
    }

    // Test 7: Test invalid credentials
    console.log('\n7. Testing invalid credentials...');
    const { error: invalidSignInError } = await supabase.auth.signInWithPassword({
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });

    if (invalidSignInError) {
      console.log('✅ Invalid credentials properly rejected:', invalidSignInError.message);
    } else {
      console.error('❌ Invalid credentials were accepted (this is wrong)');
    }

    console.log('\n🎉 Authentication flow tests completed successfully!');

  } catch (error) {
    console.error('💥 Test suite failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function testOAuthFlow() {
  console.log('\n🔐 Testing OAuth Flow...\n');

  try {
    // Test Google OAuth URL generation
    console.log('1. Testing Google OAuth URL generation...');
    const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'email profile'
      }
    });

    if (googleError) {
      console.error('❌ Google OAuth setup failed:', googleError.message);
    } else if (googleData?.url) {
      console.log('✅ Google OAuth URL generated successfully');
      console.log('   URL length:', googleData.url.length);
      console.log('   URL preview:', googleData.url.substring(0, 100) + '...');
    }

    // Test Microsoft OAuth URL generation
    console.log('\n2. Testing Microsoft OAuth URL generation...');
    const { data: microsoftData, error: microsoftError } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        scopes: 'offline_access User.Read'
      }
    });

    if (microsoftError) {
      console.error('❌ Microsoft OAuth setup failed:', microsoftError.message);
    } else if (microsoftData?.url) {
      console.log('✅ Microsoft OAuth URL generated successfully');
      console.log('   URL length:', microsoftData.url.length);
      console.log('   URL preview:', microsoftData.url.substring(0, 100) + '...');
    }

    console.log('\n🎉 OAuth flow tests completed!');

  } catch (error) {
    console.error('💥 OAuth test suite failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Authentication Test Suite\n');
  console.log('=' .repeat(50));
  
  await testAuthFlow();
  await testOAuthFlow();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ All authentication tests completed!');
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAuthFlow,
  testOAuthFlow,
  runAllTests
}; 