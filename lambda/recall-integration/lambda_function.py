import json
import boto3
import base64
import os
from datetime import datetime
import requests
from botocore.exceptions import ClientError

# Initialize AWS clients
secrets_manager = boto3.client('secretsmanager')
kms_client = boto3.client('kms')

# Constants
RECALL_BASE = "https://us-west-2.recall.ai"
SECRET_NAME = "axnt-recall-google-oauth"
KMS_KEY_ID = os.environ.get('KMS_KEY_ID', 'alias/axnt-encryption-key')

print(f"[Lambda] KMS Key ID from environment: {KMS_KEY_ID}")

def lambda_handler(event, context):
    """
    AWS Lambda function to handle Recall.ai integration
    """
    try:
        print(f"[Lambda] ===== RECALL.AI INTEGRATION STARTED ======")
        print(f"[Lambda] Event: {json.dumps(event, default=str)}")
        print(f"[Lambda] Context: {context}")
        
        # Extract parameters
        user_id = event.get('userId')
        google_tokens = event.get('googleTokens', {})
        
        if not user_id or not google_tokens:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Missing required parameters: userId and googleTokens'
                })
            }
        
        print(f"[Lambda] Processing for user: {user_id}")
        print(f"[Lambda] Google tokens received: {bool(google_tokens.get('access_token'))}")
        
        # Get credentials from AWS Secrets Manager
        credentials = get_recall_credentials()
        
        # Create Recall.ai calendar
        calendar_result = create_recall_calendar(credentials, google_tokens)
        
        print(f"[Lambda] ===== RECALL.AI INTEGRATION COMPLETED ======")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'userId': user_id,
                'calendarId': calendar_result.get('id'),
                'status': calendar_result.get('status'),
                'platform': calendar_result.get('platform'),
                'platform_email': calendar_result.get('platform_email'),
                'created_at': calendar_result.get('created_at'),
                'message': 'Recall.ai calendar created successfully'
            })
        }
        
    except Exception as e:
        print(f"[Lambda] ===== RECALL.AI INTEGRATION FAILED ======")
        print(f"[Lambda] Error: {str(e)}")
        print(f"[Lambda] Error type: {type(e).__name__}")
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Recall.ai integration failed',
                'errorMessage': str(e),
                'errorType': type(e).__name__
            })
        }

def get_recall_credentials():
    """
    Retrieve Recall.ai credentials from AWS Secrets Manager
    """
    try:
        print(f"[Lambda] Getting credentials from Secrets Manager: {SECRET_NAME}")
        
        response = secrets_manager.get_secret_value(SecretId=SECRET_NAME)
        secret_data = json.loads(response['SecretString'])
        
        print(f"[Lambda] Credentials retrieved successfully")
        print(f"[Lambda] Has client_id: {bool(secret_data.get('client_id'))}")
        print(f"[Lambda] Has client_secret: {bool(secret_data.get('client_secret'))}")
        print(f"[Lambda] Has recall_api_key: {bool(secret_data.get('recall_api_key'))}")
        
        return secret_data
        
    except ClientError as e:
        print(f"[Lambda] Failed to retrieve credentials: {e}")
        raise Exception(f"Failed to retrieve credentials from Secrets Manager: {e}")
    except Exception as e:
        print(f"[Lambda] Unexpected error retrieving credentials: {e}")
        raise Exception(f"Unexpected error retrieving credentials: {e}")

def create_recall_calendar(credentials, google_tokens):
    """
    Create a Recall.ai calendar using the provided credentials and Google tokens
    """
    try:
        print(f"[Lambda] Creating Recall.ai calendar...")
        
        # Prepare request body
        request_body = {
            'oauth_client_id': credentials['client_id'],
            'oauth_client_secret': credentials['client_secret'],
            'oauth_refresh_token': google_tokens['refresh_token'],
            'platform': 'google_calendar'
        }
        
        print(f"[Lambda] Request body prepared (sensitive data masked)")
        print(f"[Lambda] OAuth client ID prefix: {credentials['client_id'][:10]}...")
        print(f"[Lambda] OAuth client secret prefix: {credentials['client_secret'][:10]}...")
        print(f"[Lambda] OAuth refresh token prefix: {google_tokens['refresh_token'][:10]}...")
        
        # Make request to Recall.ai
        url = f"{RECALL_BASE}/api/v2/calendars/"
        headers = {
            'Authorization': f"Token {credentials['recall_api_key']}",
            'Content-Type': 'application/json'
        }
        
        print(f"[Lambda] Making request to Recall.ai: {url}")
        print(f"[Lambda] Authorization header prefix: Token {credentials['recall_api_key'][:10]}...")
        
        response = requests.post(url, headers=headers, json=request_body, timeout=30)
        
        print(f"[Lambda] Response received:")
        print(f"[Lambda] Status code: {response.status_code}")
        print(f"[Lambda] Response headers: {dict(response.headers)}")
        
        if response.status_code != 201:
            print(f"[Lambda] Request failed with status {response.status_code}")
            print(f"[Lambda] Response text: {response.text}")
            raise Exception(f"Recall.ai API request failed: {response.status_code} - {response.text}")
        
        calendar_data = response.json()
        print(f"[Lambda] Calendar created successfully:")
        print(f"[Lambda] Calendar ID: {calendar_data.get('id')}")
        print(f"[Lambda] Status: {calendar_data.get('status')}")
        print(f"[Lambda] Platform: {calendar_data.get('platform')}")
        print(f"[Lambda] Platform email: {calendar_data.get('platform_email')}")
        print(f"[Lambda] Created at: {calendar_data.get('created_at')}")
        
        return calendar_data
        
    except requests.exceptions.RequestException as e:
        print(f"[Lambda] Network error creating Recall.ai calendar: {e}")
        raise Exception(f"Network error creating Recall.ai calendar: {e}")
    except Exception as e:
        print(f"[Lambda] Error creating Recall.ai calendar: {e}")
        raise Exception(f"Error creating Recall.ai calendar: {e}")

def encrypt_data(data):
    """
    Encrypt data using AWS KMS
    """
    try:
        print(f"[Lambda] Encrypting data with KMS key: {KMS_KEY_ID}")
        
        response = kms_client.encrypt(
            KeyId=KMS_KEY_ID,
            Plaintext=json.dumps(data)
        )
        
        encrypted_data = base64.b64encode(response['CiphertextBlob']).decode('utf-8')
        print(f"[Lambda] Data encrypted successfully")
        
        return encrypted_data
        
    except ClientError as e:
        print(f"[Lambda] KMS encryption failed: {e}")
        raise Exception(f"KMS encryption failed: {e}")
    except Exception as e:
        print(f"[Lambda] Unexpected error during encryption: {e}")
        raise Exception(f"Unexpected error during encryption: {e}")

def decrypt_data(encrypted_data):
    """
    Decrypt data using AWS KMS
    """
    try:
        print(f"[Lambda] Decrypting data with KMS key: {KMS_KEY_ID}")
        
        ciphertext_blob = base64.b64decode(encrypted_data)
        
        response = kms_client.decrypt(
            CiphertextBlob=ciphertext_blob
        )
        
        decrypted_data = json.loads(response['Plaintext'].decode('utf-8'))
        print(f"[Lambda] Data decrypted successfully")
        
        return decrypted_data
        
    except ClientError as e:
        print(f"[Lambda] KMS decryption failed: {e}")
        raise Exception(f"KMS decryption failed: {e}")
    except Exception as e:
        print(f"[Lambda] Unexpected error during decryption: {e}")
        raise Exception(f"Unexpected error during decryption: {e}")
