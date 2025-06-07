// Security Configuration
export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // For Remix/React inline scripts - consider nonce-based approach in production
      "'unsafe-eval'", // For development only - remove in production
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // For styled-components/CSS-in-JS
    ],
    imgSrc: [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],
    connectSrc: [
      "'self'",
      process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '', // WebSocket for dev
      // Add your API endpoints here
    ].filter(Boolean),
    fontSrc: [
      "'self'",
      "data:",
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    childSrc: ["'none'"],
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production'
  },

  // Security Headers
  HEADERS: {
    // Prevent XSS attacks
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXSSProtection: '1; mode=block',
    
    // HTTPS enforcement
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    
    // Referrer policy
    referrerPolicy: 'strict-origin-when-cross-origin',
    
    // Permissions policy (formerly Feature Policy)
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Cross-Origin policies
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-site'
  },

  // Token Security Settings
  TOKEN: {
    // Token expiry settings
    maxAge: 24 * 60 * 60 * 1000, // 24 hours max in storage
    refreshThreshold: 5 * 60 * 1000, // Refresh 5 minutes before expiry
    
    // Encryption settings
    encryptionEnabled: true,
    
    // Fingerprint validation
    fingerprintValidation: true,
    fingerprintComponents: [
      'userAgent',
      'language',
      'screen',
      'timezone',
      'canvas',
      'hardware'
    ]
  },

  // Rate Limiting
  RATE_LIMITS: {
    // API call limits per minute
    apiCalls: 100,
    loginAttempts: 5,
    securityActions: 10,
    
    // Monitoring thresholds
    suspiciousRequestThreshold: 3,
    tokenAccessThreshold: 5
  },

  // Security Monitoring
  MONITORING: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
    maxEvents: 100,
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
    
    // Alert settings
    alerts: {
      criticalImmediateLogout: true,
      highSeverityUserNotification: true,
      mediumSeverityConsoleLog: true
    }
  }
};

// Generate CSP string
export function generateCSPString(): string {
  const csp = SECURITY_CONFIG.CSP;
  const directives = [];
  
  for (const [key, values] of Object.entries(csp)) {
    if (key === 'upgradeInsecureRequests') {
      if (values) directives.push('upgrade-insecure-requests');
    } else if (Array.isArray(values) && values.length > 0) {
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      directives.push(`${kebabKey} ${values.join(' ')}`);
    }
  }
  
  return directives.join('; ');
}

// Generate security headers for responses
export function getSecurityHeaders(): Record<string, string> {
  const headers = SECURITY_CONFIG.HEADERS;
  
  return {
    'Content-Security-Policy': generateCSPString(),
    'X-Content-Type-Options': headers.xContentTypeOptions,
    'X-Frame-Options': headers.xFrameOptions,
    'X-XSS-Protection': headers.xXSSProtection,
    'Strict-Transport-Security': headers.strictTransportSecurity,
    'Referrer-Policy': headers.referrerPolicy,
    'Permissions-Policy': headers.permissionsPolicy,
    'Cross-Origin-Embedder-Policy': headers.crossOriginEmbedderPolicy,
    'Cross-Origin-Opener-Policy': headers.crossOriginOpenerPolicy,
    'Cross-Origin-Resource-Policy': headers.crossOriginResourcePolicy,
  };
}

// Validate security configuration
export function validateSecurityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required configurations
  if (!SECURITY_CONFIG.TOKEN.maxAge || SECURITY_CONFIG.TOKEN.maxAge < 60000) {
    errors.push('Token maxAge must be at least 1 minute');
  }
  
  if (!SECURITY_CONFIG.TOKEN.refreshThreshold || SECURITY_CONFIG.TOKEN.refreshThreshold < 30000) {
    errors.push('Token refresh threshold must be at least 30 seconds');
  }
  
  if (SECURITY_CONFIG.RATE_LIMITS.loginAttempts < 3) {
    errors.push('Login attempts limit should be at least 3');
  }
  
  // Check CSP configuration
  if (!SECURITY_CONFIG.CSP.defaultSrc.includes("'self'")) {
    errors.push('CSP default-src must include self');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Development vs Production differences
export const SECURITY_RECOMMENDATIONS = {
  development: {
    warnings: [
      "unsafe-eval and unsafe-inline CSP directives are enabled for development",
      "Security monitoring is in DEBUG mode",
      "WebSocket connections allowed for hot reload"
    ]
  },
  production: {
    requirements: [
      "Remove unsafe-eval from CSP",
      "Implement nonce-based CSP for inline scripts",
      "Enable HTTPS-only with HSTS",
      "Configure external security monitoring",
      "Set up proper logging and alerting",
      "Implement rate limiting at the server level"
    ]
  }
};

// Log security configuration status
export function logSecurityStatus(): void {
  console.log("🔒 Security Configuration Status:");
  
  const validation = validateSecurityConfig();
  if (validation.valid) {
    console.log("✅ Security configuration is valid");
  } else {
    console.warn("⚠️ Security configuration issues:", validation.errors);
  }
  
  console.log(`🔍 Monitoring: ${SECURITY_CONFIG.MONITORING.enabled ? 'Enabled' : 'Disabled'}`);
  console.log(`🔐 Token encryption: ${SECURITY_CONFIG.TOKEN.encryptionEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`👤 Fingerprint validation: ${SECURITY_CONFIG.TOKEN.fingerprintValidation ? 'Enabled' : 'Disabled'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log("⚠️ Development mode security warnings:");
    SECURITY_RECOMMENDATIONS.development.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  } else {
    console.log("🚀 Production security checklist:");
    SECURITY_RECOMMENDATIONS.production.requirements.forEach(req => {
      console.log(`  - ${req}`);
    });
  }
} 