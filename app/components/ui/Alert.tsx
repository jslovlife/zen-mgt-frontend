import { useEffect, useState } from "react";
import { AlertMessage, AlertType, GlobalAlertMessageHandler } from "~/utils/alert.util";

interface AlertProps {
  alert: AlertMessage;
  onClose: (id: string) => void;
}

const alertStyles: Record<AlertType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles: Record<AlertType, string> = {
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

const AlertIcon = ({ type }: { type: AlertType }) => {
  const icons = {
    success: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    ),
    error: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    warning: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
    info: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  };

  return (
    <svg
      className={`h-5 w-5 ${iconStyles[type]}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {icons[type]}
    </svg>
  );
};

export function Alert({ alert, onClose }: AlertProps) {
  return (
    <div
      className={`p-4 border rounded-lg shadow-sm transition-all duration-300 ${
        alertStyles[alert.type]
      }`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertIcon type={alert.type} />
        </div>
        <div className="ml-3 flex-1">
          {alert.title && (
            <h3 className="text-sm font-medium mb-1">{alert.title}</h3>
          )}
          <p className="text-sm">{alert.message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => onClose(alert.id)}
            className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-600"
          >
            <span className="sr-only">Dismiss</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertContainer() {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  useEffect(() => {
    const alertHandler = GlobalAlertMessageHandler.getInstance();
    const unsubscribe = alertHandler.subscribe(setAlerts);
    
    // Initialize with current alerts
    setAlerts(alertHandler.getAlerts());

    return unsubscribe;
  }, []);

  const handleClose = (id: string) => {
    GlobalAlertMessageHandler.getInstance().removeAlert(id);
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {alerts.map((alert) => (
        <Alert key={alert.id} alert={alert} onClose={handleClose} />
      ))}
    </div>
  );
} 