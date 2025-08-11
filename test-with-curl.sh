#!/bin/bash

# Test the recall-api function with curl
echo "🔍 Testing recall-api function with curl..."

# Test data
TEST_DATA='{
  "action": "join-meeting-now",
  "userId": "test-user-123",
  "meetingId": "test-meeting-'$(date +%s)'",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "meetingTitle": "Test Meeting",
  "botName": "Action.IT Test Bot",
  "joinMode": "audio_only"
}'

echo "📤 Test data: $TEST_DATA"

# Make the request
curl -X POST "https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-api" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8" \
  -d "$TEST_DATA" \
  -w "\n📥 HTTP Status: %{http_code}\n📥 Response Time: %{time_total}s\n"

echo "✅ Test completed!" 