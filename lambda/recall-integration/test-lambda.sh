#!/bin/bash

# Test Recall.ai Integration Lambda Function
# This script tests the Lambda function with a sample event

set -e

FUNCTION_NAME="axnt-recall-integration"
REGION="us-east-1"

echo "🧪 Testing Recall.ai Integration Lambda Function..."

# Create test event
echo "📝 Creating test event..."
cat > test-event.json << EOF
{
  "userId": "test-user-123",
  "googleTokens": {
    "access_token": "ya29.a0AfH6SMC...",
    "refresh_token": "1//05n78zP...",
    "expires_at": 1758179387514
  }
}
EOF

echo "📋 Test event created:"
cat test-event.json
echo ""

# Invoke Lambda function
echo "🚀 Invoking Lambda function..."
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload file://test-event.json \
  --region $REGION \
  --log-type Tail \
  response.json

echo "📊 Lambda function response:"
cat response.json | jq '.'

echo ""
echo "📋 CloudWatch logs (last 10 lines):"
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/$FUNCTION_NAME" \
  --region $REGION \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text | xargs -I {} aws logs get-log-events \
  --log-group-name "/aws/lambda/$FUNCTION_NAME" \
  --log-stream-name {} \
  --region $REGION \
  --query 'events[-10:].message' \
  --output text

# Clean up
rm -f test-event.json response.json

echo ""
echo "✅ Lambda function test completed!"
echo "🔍 Check the response above for any errors or success messages"
