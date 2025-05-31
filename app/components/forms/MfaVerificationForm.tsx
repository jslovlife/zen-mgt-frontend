import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, useNavigation } from "@remix-run/react";
import { Input } from "./Input";
import { Button } from "./Button";

// Validation schema
const mfaVerificationSchema = z.object({
  mfaCode: z.string().length(6, "MFA code must be exactly 6 digits").regex(/^\d+$/, "MFA code must contain only numbers"),
});

export type MfaVerificationFormData = z.infer<typeof mfaVerificationSchema>;

interface MfaVerificationFormProps {
  onSubmit?: (data: MfaVerificationFormData) => void;
  error?: string;
  fieldErrors?: {
    mfaCode?: string[];
  };
  email?: string; // This can now be email or username
}

export function MfaVerificationForm({ onSubmit, error, fieldErrors, email }: MfaVerificationFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaVerificationFormData>({
    resolver: zodResolver(mfaVerificationSchema),
  });

  const handleFormSubmit = (data: MfaVerificationFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="mt-2 text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
        {email && (
          <p className="mt-1 text-sm text-gray-500">
            Signing in as: <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* MFA Verification Form */}
      <Form method="post" className="space-y-6">
        <Input
          {...register("mfaCode")}
          type="text"
          id="mfaCode"
          name="mfaCode"
          label="Authentication Code"
          placeholder="000000"
          autoComplete="one-time-code"
          maxLength={6}
          className="text-center text-2xl tracking-widest font-mono"
          required
          error={errors.mfaCode?.message || fieldErrors?.mfaCode?.[0]}
          helperText="Enter the 6-digit code from your authenticator app"
        />

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Verifying..." : "Verify Code"}
        </Button>
      </Form>

      {/* Help Text */}
      <div className="mt-8 text-center space-y-4">
        <div className="text-sm text-gray-600">
          <p>Can't access your authenticator app?</p>
          <a
            href="/auth/backup-codes"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Use a backup code instead
          </a>
        </div>
        
        <div className="text-sm text-gray-600">
          <a
            href="/login"
            className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  );
} 