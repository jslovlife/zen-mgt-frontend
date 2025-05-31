import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

export default function Reports() {
  const moduleData = ModuleMetadata['reports'];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="empty-state-title">No Reports Available</h3>
        <p className="empty-state-description">
          Get started by generating your first system report.
        </p>
        <Button variant="primary" size="md">
          {moduleData.addButtonText}
        </Button>
      </div>
    </div>
  );
} 