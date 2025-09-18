import { 
  EncryptCommand, 
  DecryptCommand, 
  GenerateDataKeyCommand,
  DescribeKeyCommand 
} from '@aws-sdk/client-kms';
import { kmsClient, CONFIG, type EncryptedToken } from './aws-config';

/**
 * Encrypts sensitive data using AWS KMS
 */
export async function encryptWithKMS(plaintext: string): Promise<EncryptedToken> {
  try {
    const command = new EncryptCommand({
      KeyId: CONFIG.KMS_KEY_ALIAS,
      Plaintext: Buffer.from(plaintext, 'utf-8'),
    });

    const response = await kmsClient.send(command);
    
    if (!response.CiphertextBlob) {
      throw new Error('No ciphertext returned from KMS encryption');
    }

    return {
      encryptedData: Buffer.from(response.CiphertextBlob).toString('base64'),
      keyId: response.KeyId || CONFIG.KMS_KEY_ALIAS,
    };
  } catch (error) {
    console.error('Failed to encrypt with KMS:', error);
    throw new Error('Failed to encrypt data with AWS KMS');
  }
}

/**
 * Decrypts data encrypted with AWS KMS
 */
export async function decryptWithKMS(encryptedToken: EncryptedToken): Promise<string> {
  try {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(encryptedToken.encryptedData, 'base64'),
    });

    const response = await kmsClient.send(command);
    
    if (!response.Plaintext) {
      throw new Error('No plaintext returned from KMS decryption');
    }

    return Buffer.from(response.Plaintext).toString('utf-8');
  } catch (error) {
    console.error('Failed to decrypt with KMS:', error);
    throw new Error('Failed to decrypt data with AWS KMS');
  }
}

/**
 * Generates a data key for encryption (alternative approach)
 */
export async function generateDataKey(): Promise<{ plaintext: string; encrypted: string }> {
  try {
    const command = new GenerateDataKeyCommand({
      KeyId: CONFIG.KMS_KEY_ALIAS,
      KeySpec: 'AES_256',
    });

    const response = await kmsClient.send(command);
    
    if (!response.Plaintext || !response.CiphertextBlob) {
      throw new Error('No data key returned from KMS');
    }

    return {
      plaintext: Buffer.from(response.Plaintext).toString('base64'),
      encrypted: Buffer.from(response.CiphertextBlob).toString('base64'),
    };
  } catch (error) {
    console.error('Failed to generate data key:', error);
    throw new Error('Failed to generate data key with AWS KMS');
  }
}

/**
 * Verifies KMS key is accessible
 */
export async function verifyKMSAccess(): Promise<boolean> {
  try {
    const command = new DescribeKeyCommand({
      KeyId: CONFIG.KMS_KEY_ALIAS,
    });

    await kmsClient.send(command);
    return true;
  } catch (error) {
    console.error('KMS access verification failed:', error);
    return false;
  }
}

