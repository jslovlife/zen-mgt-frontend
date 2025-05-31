import { useState, useEffect } from "react";
import { Form, useNavigation } from "@remix-run/react";
import { Input } from "./Input";
import { Button } from "./Button";
import QRCode from "qrcode";

export type MfaSetupFormData = {
  mfaCode?: string;
  password?: string;
};

interface MfaSetupFormProps {
  username: string;
  error?: string;
  fieldErrors?: {
    mfaCode?: string[];
    password?: string[];
  };
  qrCodeUrl?: string;
  secret?: string;
  backupCodes?: string[];
  isSetupInitiated?: boolean;
}

export function MfaSetupForm({ 
  username,
  error, 
  fieldErrors, 
  qrCodeUrl,
  secret,
  backupCodes,
  isSetupInitiated = false
}: MfaSetupFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showSecret, setShowSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  console.log("=== MFA SETUP FORM RENDER ===");
  console.log("Username:", username);
  console.log("Is setup initiated:", isSetupInitiated);
  console.log("QR Code URL:", qrCodeUrl);
  console.log("Secret:", secret);
  console.log("Backup codes:", backupCodes);

  // Generate QR code image from TOTP URI
  useEffect(() => {
    if (qrCodeUrl && qrCodeUrl.startsWith('otpauth://')) {
      console.log("=== GENERATING QR CODE ===");
      console.log("TOTP URI:", qrCodeUrl);
      
      QRCode.toDataURL(qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then((dataUrl) => {
        console.log("=== QR CODE GENERATED ===");
        console.log("Data URL length:", dataUrl.length);
        setQrCodeDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error("=== QR CODE GENERATION ERROR ===");
        console.error("Error:", error);
      });
    }
  }, [qrCodeUrl]);

  // Phase 1: Initial setup - show explanation and setup button
  if (!isSetupInitiated) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Two-Factor Authentication</h2>
          <p className="text-gray-600">
            Enhance your account security by enabling two-factor authentication (2FA).
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">1</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Install an authenticator app</h3>
              <p className="text-sm text-gray-600">Download Google Authenticator, Authy, or similar app on your phone.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">2</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Scan QR code</h3>
              <p className="text-sm text-gray-600">Use your authenticator app to scan the QR code we'll provide.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-600 text-sm font-medium">3</div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enter verification code</h3>
              <p className="text-sm text-gray-600">Enter the 6-digit code from your app to complete setup.</p>
            </div>
          </div>
        </div>

        <Form method="post">
          <input type="hidden" name="action" value="initiate" />
          <input type="hidden" name="username" value={username} />
          
          <Button
            type="submit"
            className="w-full"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Setting up..." : "Set Up Two-Factor Authentication"}
          </Button>
        </Form>

        <div className="mt-4 text-center">
          <a href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  // Phase 2: QR Code and verification
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
        <p className="text-gray-600">
          Use your authenticator app to scan this QR code
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* QR Code Display */}
      {qrCodeUrl && (
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code for 2FA setup" 
                  className="w-48 h-48"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Generating QR code...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Manual entry option */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Can't scan? Enter code manually
            </button>
            
            {showSecret && secret && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Manual entry code:</p>
                <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                  {secret}
                </code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Form */}
      <Form method="post" className="space-y-4">
        <input type="hidden" name="action" value="enable" />
        <input type="hidden" name="username" value={username} />
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm your password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            error={fieldErrors?.password?.[0]}
          />
        </div>

        <div>
          <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-1">
            Enter 6-digit code from your app
          </label>
          <Input
            id="mfaCode"
            name="mfaCode"
            type="text"
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
            className="text-center text-lg font-mono tracking-wider"
            required
            error={fieldErrors?.mfaCode?.[0]}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the 6-digit code shown in your authenticator app
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Verifying..." : "Enable Two-Factor Authentication"}
        </Button>
      </Form>

      {/* Backup Codes */}
      {backupCodes && backupCodes.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowBackupCodes(!showBackupCodes)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showBackupCodes ? "Hide" : "Show"} backup codes
          </button>
          
          {showBackupCodes && (
            <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Save these backup codes</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Store these codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="text-xs font-mono bg-white px-2 py-1 rounded border">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-center">
        <a href="/login" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to login
        </a>
      </div>
    </div>
  );
} 