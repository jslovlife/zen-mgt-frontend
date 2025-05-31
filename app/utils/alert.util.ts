export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertMessage {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export class GlobalAlertMessageHandler {
  private static instance: GlobalAlertMessageHandler;
  private alerts: AlertMessage[] = [];
  private listeners: ((alerts: AlertMessage[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): GlobalAlertMessageHandler {
    if (!GlobalAlertMessageHandler.instance) {
      GlobalAlertMessageHandler.instance = new GlobalAlertMessageHandler();
    }
    return GlobalAlertMessageHandler.instance;
  }

  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }

  public subscribe(listener: (alerts: AlertMessage[]) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public addAlert(alert: Omit<AlertMessage, 'id'>): string {
    const id = this.generateId();
    const newAlert: AlertMessage = {
      id,
      duration: 5000, // Default 5 seconds
      persistent: false,
      ...alert,
    };

    this.alerts.push(newAlert);
    this.notifyListeners();

    // Auto-remove non-persistent alerts
    if (!newAlert.persistent && newAlert.duration && newAlert.duration > 0) {
      setTimeout(() => {
        this.removeAlert(id);
      }, newAlert.duration);
    }

    return id;
  }

  public removeAlert(id: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.notifyListeners();
  }

  public clearAll(): void {
    this.alerts = [];
    this.notifyListeners();
  }

  public getAlerts(): AlertMessage[] {
    return [...this.alerts];
  }

  // Convenience methods
  public success(message: string, title?: string, options?: Partial<AlertMessage>): string {
    return this.addAlert({
      type: 'success',
      message,
      title,
      ...options,
    });
  }

  public error(message: string, title?: string, options?: Partial<AlertMessage>): string {
    return this.addAlert({
      type: 'error',
      message,
      title,
      persistent: true, // Errors should be persistent by default
      ...options,
    });
  }

  public warning(message: string, title?: string, options?: Partial<AlertMessage>): string {
    return this.addAlert({
      type: 'warning',
      message,
      title,
      ...options,
    });
  }

  public info(message: string, title?: string, options?: Partial<AlertMessage>): string {
    return this.addAlert({
      type: 'info',
      message,
      title,
      ...options,
    });
  }
} 