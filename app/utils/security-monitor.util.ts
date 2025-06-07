// Security Monitoring Utility
export interface SecurityEvent {
  type: 'TOKEN_ACCESS' | 'FINGERPRINT_MISMATCH' | 'TOKEN_EXPIRY' | 'SUSPICIOUS_REQUEST' | 'DEVICE_CHANGE';
  timestamp: number;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 100;
  private readonly ALERT_THRESHOLDS = {
    TOKEN_ACCESS: 5, // Alert if token accessed 5+ times in 1 minute
    FINGERPRINT_MISMATCH: 1, // Alert immediately on fingerprint mismatch
    SUSPICIOUS_REQUEST: 3, // Alert on 3+ suspicious requests in 5 minutes
  };

  private constructor() {
    this.startCleanupTimer();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  public logEvent(event: SecurityEvent): void {
    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Check for alert conditions
    this.checkAlertConditions(event);

    // Log to console based on severity
    this.logToConsole(event);
  }

  private logToConsole(event: SecurityEvent): void {
    const prefix = this.getSeverityEmoji(event.severity);
    const message = `${prefix} SECURITY ${event.type}: ${JSON.stringify(event.details)}`;
    
    switch (event.severity) {
      case 'CRITICAL':
        console.error(message);
        break;
      case 'HIGH':
        console.warn(message);
        break;
      case 'MEDIUM':
        console.info(message);
        break;
      case 'LOW':
        console.log(message);
        break;
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🔍';
      case 'LOW': return 'ℹ️';
      default: return '📝';
    }
  }

  private checkAlertConditions(event: SecurityEvent): void {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute for most checks

    switch (event.type) {
      case 'TOKEN_ACCESS':
        const recentTokenAccess = this.events.filter(e => 
          e.type === 'TOKEN_ACCESS' && 
          (now - e.timestamp) < timeWindow
        ).length;
        
        if (recentTokenAccess >= this.ALERT_THRESHOLDS.TOKEN_ACCESS) {
          this.triggerAlert('HIGH', 'Excessive token access detected', {
            count: recentTokenAccess,
            timeWindow: timeWindow / 1000
          });
        }
        break;

      case 'FINGERPRINT_MISMATCH':
        this.triggerAlert('CRITICAL', 'Device fingerprint mismatch detected', event.details);
        break;

      case 'SUSPICIOUS_REQUEST':
        const recentSuspicious = this.events.filter(e => 
          e.type === 'SUSPICIOUS_REQUEST' && 
          (now - e.timestamp) < (timeWindow * 5) // 5 minutes
        ).length;
        
        if (recentSuspicious >= this.ALERT_THRESHOLDS.SUSPICIOUS_REQUEST) {
          this.triggerAlert('HIGH', 'Multiple suspicious requests detected', {
            count: recentSuspicious
          });
        }
        break;
    }
  }

  private triggerAlert(severity: string, message: string, details: Record<string, any>): void {
    console.error(`🚨 SECURITY ALERT [${severity}]: ${message}`, details);
    
    // In production, you might want to:
    // - Send alerts to security team
    // - Log to external security service
    // - Trigger additional security measures
    
    if (typeof window !== 'undefined') {
      // Show user notification for critical alerts
      if (severity === 'CRITICAL') {
        this.showUserAlert(message);
      }
    }
  }

  private showUserAlert(message: string): void {
    // Simple user notification - in production, use a proper notification system
    if (confirm(`Security Alert: ${message}\n\nFor your security, you will be logged out. Click OK to continue.`)) {
      this.performSecurityLogout();
    }
  }

  private performSecurityLogout(): void {
    // Clear all storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/login?reason=security';
    }
  }

  private startCleanupTimer(): void {
    // Clean up old events every 10 minutes
    setInterval(() => {
      const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour ago
      this.events = this.events.filter(event => event.timestamp > cutoff);
    }, 10 * 60 * 1000);
  }

  public getRecentEvents(minutes: number = 10): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  public getSecuritySummary(): {
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    recentEvents: SecurityEvent[];
  } {
    const recent = this.getRecentEvents(60); // Last hour
    
    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'CRITICAL').length,
      highSeverityEvents: this.events.filter(e => e.severity === 'HIGH').length,
      recentEvents: recent
    };
  }
}

// Export singleton instance
export const securityMonitor = SecurityMonitor.getInstance(); 