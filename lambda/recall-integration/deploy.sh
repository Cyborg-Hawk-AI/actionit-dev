#!/bin/bash

# Deploy Recall.ai Integration Lambda Function
# This script packages and deploys the Lambda function to AWS

set -e

FUNCTION_NAME="axnt-recall-integration"
REGION="us-east-1"
ROLE_NAME="axnt-recall-lambda-role"
POLICY_NAME="axnt-recall-lambda-policy"
KMS_KEY_ALIAS="axnt-encryption-key"
KMS_KEY_DESCRIPTION="KMS key for Recall.ai integration encryption"

echo "🚀 Deploying Recall.ai Integration Lambda Function..."

# Create KMS key for encryption
echo "🔐 Creating KMS key for encryption..."
KMS_KEY_ID=$(aws kms describe-key --key-id "alias/$KMS_KEY_ALIAS" --region $REGION --query 'KeyMetadata.KeyId' --output text 2>/dev/null || echo "")

if [ -z "$KMS_KEY_ID" ]; then
    echo "🔐 Creating new KMS key..."
    KMS_KEY_ID=$(aws kms create-key \
        --description "$KMS_KEY_DESCRIPTION" \
        --key-usage ENCRYPT_DECRYPT \
        --key-spec SYMMETRIC_DEFAULT \
        --region $REGION \
        --query 'KeyMetadata.KeyId' \
        --output text)
    
    echo "🔐 Creating KMS key alias..."
    aws kms create-alias \
        --alias-name "alias/$KMS_KEY_ALIAS" \
        --target-key-id $KMS_KEY_ID \
        --region $REGION
    
    echo "✅ KMS key created: $KMS_KEY_ID"
else
    echo "✅ KMS key already exists: $KMS_KEY_ID"
fi

# Create deployment package
echo "📦 Creating deployment package..."
cd "$(dirname "$0")"
rm -rf package.zip
zip -r package.zip lambda_function.py

# Check if Lambda function exists
echo "🔍 Checking if Lambda function exists..."
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ Lambda function exists, updating..."
    
    # Update function code
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://package.zip \
        --region $REGION
    
    echo "✅ Lambda function code updated successfully"
else
    echo "❌ Lambda function does not exist, creating..."
    
    # Create IAM role for Lambda
    echo "🔐 Creating IAM role for Lambda..."
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }' || echo "Role may already exist"
    
    # Create IAM policy for Lambda
    echo "🔐 Creating IAM policy for Lambda..."
    aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document "{
            \"Version\": \"2012-10-17\",
            \"Statement\": [
                {
                    \"Effect\": \"Allow\",
                    \"Action\": [
                        \"logs:CreateLogGroup\",
                        \"logs:CreateLogStream\",
                        \"logs:PutLogEvents\"
                    ],
                    \"Resource\": \"arn:aws:logs:*:*:*\"
                },
                {
                    \"Effect\": \"Allow\",
                    \"Action\": [
                        \"secretsmanager:GetSecretValue\"
                    ],
                    \"Resource\": \"arn:aws:secretsmanager:*:*:secret:axnt-recall-google-oauth*\"
                },
                {
                    \"Effect\": \"Allow\",
                    \"Action\": [
                        \"kms:Encrypt\",
                        \"kms:Decrypt\",
                        \"kms:GenerateDataKey\",
                        \"kms:DescribeKey\"
                    ],
                    \"Resource\": \"arn:aws:kms:$REGION:*:key/$KMS_KEY_ID\"
                },
                {
                    \"Effect\": \"Allow\",
                    \"Action\": [
                        \"kms:Decrypt\"
                    ],
                    \"Resource\": \"arn:aws:kms:$REGION:*:alias/$KMS_KEY_ALIAS\"
                }
            ]
        }" || echo "Policy may already exist"
    
    # Attach policy to role
    echo "🔐 Attaching policy to role..."
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" || echo "Policy may already be attached"
    
    # Wait for role to be ready
    echo "⏳ Waiting for IAM role to be ready..."
    sleep 10
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
    echo "🔐 Role ARN: $ROLE_ARN"
    
    # Create Lambda function
    echo "🚀 Creating Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.12 \
        --role $ROLE_ARN \
        --handler lambda_function.lambda_handler \
        --zip-file fileb://package.zip \
        --timeout 60 \
        --memory-size 256 \
        --region $REGION \
        --environment Variables="{
            \"KMS_KEY_ID\": \"alias/$KMS_KEY_ALIAS\"
        }"
    
    echo "✅ Lambda function created successfully"
fi

# Clean up
rm -f package.zip

echo "🎉 Recall.ai Integration Lambda Function deployed successfully!"
echo "📋 Function details:"
echo "   - Function Name: $FUNCTION_NAME"
echo "   - Region: $REGION"
echo "   - Runtime: Python 3.12"
echo "   - Handler: lambda_function.lambda_handler"
echo "   - Timeout: 60 seconds"
echo "   - Memory: 256 MB"
echo "   - KMS Key ID: $KMS_KEY_ID"
echo "   - KMS Key Alias: alias/$KMS_KEY_ALIAS"
echo ""
echo "🔧 Next steps:"
echo "   1. Set the RECALL_LAMBDA_FUNCTION_NAME environment variable in Vercel"
echo "   2. Test the Lambda function with a sample event"
echo "   3. Monitor CloudWatch logs for execution details"
echo "   4. Verify KMS key permissions for encryption/decryption"
