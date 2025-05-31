import { ModuleMetadata } from "~/config/routes";

export default function RolesIndex() {
  const currentModuleMeta = ModuleMetadata.roles;

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">{currentModuleMeta.title}</h1>
        <p className="page-description">{currentModuleMeta.description}</p>
      </div>

      <div className="data-table-container">
        <div className="page-content" style={{ textAlign: 'center', padding: '4rem' }}>
          <h3>Role Management Module</h3>
          <p>This module is ready for implementation.</p>
          <p>Features to implement:</p>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>Create and manage user roles</li>
            <li>Define permission levels</li>
            <li>Assign roles to users</li>
            <li>Role hierarchy management</li>
          </ul>
        </div>
      </div>
    </>
  );
} 