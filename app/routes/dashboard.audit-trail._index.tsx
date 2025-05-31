import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

export default function AuditTrail() {
  const moduleData = ModuleMetadata['audit-trail'];

  return (
    <div className="module-container">
      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">{moduleData.title}</h1>
          <p className="module-description">{moduleData.description}</p>
        </div>
        <div className="module-actions">
          <Button variant="primary" size="md">
            {moduleData.addButtonText}
          </Button>
        </div>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="empty-state-title">No Audit Logs</h3>
        <p className="empty-state-description">
          System audit logs will appear here as users perform actions.
        </p>
        <Button variant="primary" size="md">
          {moduleData.addButtonText}
        </Button>
      </div>
    </div>
  );
} 