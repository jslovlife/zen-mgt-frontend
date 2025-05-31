import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

export default function CustomizeBankList() {
  const moduleData = ModuleMetadata['customize-bank-list'];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="empty-state-title">No Custom Banks</h3>
        <p className="empty-state-description">
          Get started by customizing your bank list configurations.
        </p>
        <Button variant="primary" size="md">
          {moduleData.addButtonText}
        </Button>
      </div>
    </div>
  );
} 