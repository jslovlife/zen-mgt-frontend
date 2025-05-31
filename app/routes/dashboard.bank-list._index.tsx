import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

export default function BankList() {
  const moduleData = ModuleMetadata['bank-list'];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        </div>
        <h3 className="empty-state-title">No Banks Listed</h3>
        <p className="empty-state-description">
          Get started by adding supported banks and financial institutions.
        </p>
        <Button variant="primary" size="md">
          {moduleData.addButtonText}
        </Button>
      </div>
    </div>
  );
} 