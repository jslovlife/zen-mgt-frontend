import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

export default function RoleManagement() {
  const moduleData = ModuleMetadata['role-management'];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h3 className="empty-state-title">No Roles Defined</h3>
        <p className="empty-state-description">
          Get started by creating your first user role.
        </p>
        <Button variant="primary" size="md">
          {moduleData.addButtonText}
        </Button>
      </div>
    </div>
  );
} 