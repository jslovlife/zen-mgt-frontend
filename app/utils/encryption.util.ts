import CryptoJS from 'crypto-js';

// Secret key for encryption - in production, this should come from environment variables
const SECRET_KEY = 'zen-mgt-secret-key-2024-secure-app';

export class EncryptionUtil {
  private static secretKey = SECRET_KEY;

  /**
   * Encrypts a string using AES encryption and encodes it for URL safety
   * @param text - The text to encrypt
   * @returns Encrypted and URL-encoded string
   */
  static encryptParam(text: string): string {
    try {
      // Encrypt using AES
      const encrypted = CryptoJS.AES.encrypt(text, this.secretKey).toString();
      
      // URL-safe base64 encoding
      const urlSafe = btoa(encrypted)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return urlSafe;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt parameter');
    }
  }

  /**
   * Decrypts a URL-encoded encrypted string
   * @param encodedText - The encrypted and URL-encoded text
   * @returns Decrypted original string
   */
  static decryptParam(encodedText: string): string {
    try {
      // Restore base64 padding and characters
      let base64 = encodedText
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }
      
      // Decode from base64
      const encrypted = atob(base64);
      
      // Decrypt using AES
      const decryptedBytes = CryptoJS.AES.decrypt(encrypted, this.secretKey);
      const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt parameter - invalid or corrupted data');
    }
  }

  /**
   * Validates if an encrypted parameter can be decrypted
   * @param encodedText - The encrypted and URL-encoded text
   * @returns true if valid, false otherwise
   */
  static isValidEncryptedParam(encodedText: string): boolean {
    try {
      const decrypted = this.decryptParam(encodedText);
      return decrypted.length > 0;
    } catch {
      return false;
    }
  }
}

export default EncryptionUtil; 