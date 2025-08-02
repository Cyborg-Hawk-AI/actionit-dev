// Script to create a test user in Supabase
// Run this with: node scripts/create-test-user.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = "https://vfsnygvfgtqwjwrwnseg.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@action.it',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        role: 'test'
      }
    });

    if (error) {
      console.error('Error creating test user:', error);
      return;
    }

    console.log('Test user created successfully!');
    console.log('Email: test@action.it');
    console.log('Password: testpassword123');
    console.log('User ID:', data.user.id);
    
  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}

createTestUser(); 