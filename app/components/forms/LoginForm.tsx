import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, useNavigation } from "@remix-run/react";
import { Input } from "./Input";
import { Button } from "./Button";
import { APIUtil } from "~/utils/api.util";

// Validation schema - matches the one in login route
const loginSchema = z.object({
  username: z.string().min(1, "Please enter your email or username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mfaCode: z.string().optional(), // Optional MFA code
});

export type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void;
  error?: string;
  fieldErrors?: {
    username?: string[];
    password?: string[];
    mfaCode?: string[];
  };
  showMfaField?: boolean; // Automatically determined by backend response
}

export function LoginForm({ onSubmit, error, fieldErrors, showMfaField = false }: LoginFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showMfaFieldLocal, setShowMfaFieldLocal] = useState(showMfaField);
  const [isCheckingMfa, setIsCheckingMfa] = useState(false);
  const [mfaCheckMessage, setMfaCheckMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const username = watch("username");

  // Check MFA status when username is entered
  const checkMfaStatus = useCallback(async (usernameValue: string) => {
    if (!usernameValue || usernameValue.trim().length < 3) {
      setShowMfaFieldLocal(false);
      setMfaCheckMessage("");
      return;
    }

    setIsCheckingMfa(true);
    setMfaCheckMessage("");

    try {
      const apiUtil = APIUtil.getInstance();
      const response = await apiUtil.checkUserMfaStatus(usernameValue.trim());
      
      if (response.success && response.data) {
        if (response.data.mfaEnabled) {
          setShowMfaFieldLocal(true);
          setMfaCheckMessage("✓ MFA is enabled for this account");
        } else if (response.data.mfaSetupRequired) {
          setShowMfaFieldLocal(false);
          setMfaCheckMessage("ℹ️ MFA setup will be required after login");
        } else {
          setShowMfaFieldLocal(false);
          setMfaCheckMessage("✓ No MFA required for this account");
        }
      } else {
        // User might not exist or other error - don't show MFA field
        setShowMfaFieldLocal(false);
        setMfaCheckMessage("");
      }
    } catch (error) {
      console.error("Error checking MFA status:", error);
      setShowMfaFieldLocal(false);
      setMfaCheckMessage("");
    } finally {
      setIsCheckingMfa(false);
    }
  }, []);

  const handleUsernameBlur = useCallback(() => {
    if (username) {
      checkMfaStatus(username);
    }
  }, [username, checkMfaStatus]);

  const handleFormSubmit = (data: LoginFormData) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  // Show MFA field if either backend says so OR local check says so
  const shouldShowMfaField = showMfaField || showMfaFieldLocal;

  return (
    <div className="login-form-container">
      {/* Header */}
      <div className="login-form-header">
        <div className="login-form-icon">
          <svg
            className="icon-lock"
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
        <h2 className="login-form-title">Welcome back</h2>
        <p className="login-form-subtitle">Please sign in to your account</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-content">
            <svg
              className="error-icon"
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
            <p className="error-text">{error}</p>
          </div>
        </div>
      )}

      {/* Login Form */}
      <Form method="post" className="login-form">
        <Input
          {...register("username")}
          type="text"
          id="username"
          name="username"
          label="Email or Username"
          placeholder="Enter your email or username"
          autoComplete="email"
          required
          error={errors.username?.message || fieldErrors?.username?.[0]}
          onBlur={handleUsernameBlur}
        />

        {/* MFA Status Message */}
        {(isCheckingMfa || mfaCheckMessage) && (
          <div className="mfa-status-message">
            {isCheckingMfa ? (
              <div className="mfa-checking">
                <div className="spinner"></div>
                Checking MFA status...
              </div>
            ) : (
              <div className={`mfa-status ${
                mfaCheckMessage.includes("✓") ? "mfa-status-success" : "mfa-status-info"
              }`}>
                {mfaCheckMessage}
              </div>
            )}
          </div>
        )}

        <Input
          {...register("password")}
          type="password"
          id="password"
          name="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          error={errors.password?.message || fieldErrors?.password?.[0]}
        />

        {/* MFA Code Field - Show conditionally or with toggle */}
        {shouldShowMfaField && (
          <Input
            {...register("mfaCode")}
            type="text"
            id="mfaCode"
            name="mfaCode"
            label={showMfaFieldLocal ? "Authentication Code" : "Authentication Code (Optional)"}
            placeholder="000000"
            autoComplete="one-time-code"
            maxLength={6}
            className="mfa-code-input"
            error={errors.mfaCode?.message || fieldErrors?.mfaCode?.[0]}
            helperText={
              showMfaFieldLocal 
                ? "Enter the 6-digit code from your authenticator app"
                : "Enter the 6-digit code from your authenticator app (if you have MFA enabled)"
            }
          />
        )}

        <div className="form-options">
          <div className="remember-me">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="remember-checkbox"
            />
            <label htmlFor="remember-me" className="remember-label">
              Remember me
            </label>
          </div>

          <div className="forgot-password">
            <a href="#" className="forgot-link">
              Forgot your password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </Form>

      {/* Footer */}
      <div className="login-form-footer">
        <p className="signup-prompt">
          Don't have an account?{" "}
          <a href="/register" className="signup-link">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
} 