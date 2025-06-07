/**
 * Environment Check Utility
 * Verifies all required environment variables are properly set
 */

export function checkEnvironment() {
  const checks = {
    NODE_ENV: process.env.NODE_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    sessionSecretLength: process.env.SESSION_SECRET?.length || 0,
  };
  
  console.group('🔧 ENVIRONMENT CHECK');
  console.log('NODE_ENV:', checks.NODE_ENV);
  console.log('Has SESSION_SECRET:', checks.hasSessionSecret);
  console.log('SESSION_SECRET length:', checks.sessionSecretLength);
  
  const issues: string[] = [];
  
  if (!checks.hasSessionSecret) {
    issues.push('❌ SESSION_SECRET not set - using fallback (insecure for production)');
  } else if (checks.sessionSecretLength < 32) {
    issues.push('⚠️ SESSION_SECRET too short - should be at least 32 characters');
  }
  
  if (issues.length > 0) {
    console.group('⚠️ ISSUES FOUND');
    issues.forEach(issue => console.log(issue));
    console.groupEnd();
  } else {
    console.log('✅ All environment checks passed');
  }
  
  console.groupEnd();
  
  return {
    ...checks,
    issues,
    allGood: issues.length === 0
  };
}

// Auto-run check on import
checkEnvironment(); 