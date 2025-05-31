import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

// Sample site data
interface Site {
  id: string;
  name: string;
  location: string;
  type: 'Headquarters' | 'Branch' | 'Remote';
  employees: number;
  status: 'Active' | 'Inactive';
  manager: string;
  established: string;
}

const sampleSites: Site[] = [
  {
    id: '1',
    name: 'Main Headquarters',
    location: 'New York, NY',
    type: 'Headquarters',
    employees: 250,
    status: 'Active',
    manager: 'John Smith',
    established: '2020-01-15'
  },
  {
    id: '2',
    name: 'West Coast Branch',
    location: 'Los Angeles, CA',
    type: 'Branch',
    employees: 85,
    status: 'Active',
    manager: 'Sarah Johnson',
    established: '2021-03-20'
  },
  {
    id: '3',
    name: 'Remote Office Hub',
    location: 'Austin, TX',
    type: 'Remote',
    employees: 45,
    status: 'Active',
    manager: 'Mike Davis',
    established: '2022-06-10'
  },
  {
    id: '4',
    name: 'European Branch',
    location: 'London, UK',
    type: 'Branch',
    employees: 120,
    status: 'Inactive',
    manager: 'Emma Wilson',
    established: '2019-11-05'
  }
];

export default function SiteManagement() {
  const moduleData = ModuleMetadata['site-management'];

  const getStatusBadgeClass = (status: string) => {
    return status === 'Active' ? 'status-badge status-active' : 'status-badge status-inactive';
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Headquarters':
        return 'type-badge type-headquarters';
      case 'Branch':
        return 'type-badge type-branch';
      case 'Remote':
        return 'type-badge type-remote';
      default:
        return 'type-badge';
    }
  };

  return (
    <div className="module-container">
      {/* Module Header */}
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

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <div className="search-box">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sites..."
              className="search-input"
            />
          </div>
        </div>
        <div className="action-bar-right">
          <Button variant="outline" size="sm">
            Export
          </Button>
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead className="data-table-header">
            <tr>
              <th className="data-table-th">Site Name</th>
              <th className="data-table-th">Location</th>
              <th className="data-table-th">Type</th>
              <th className="data-table-th">Employees</th>
              <th className="data-table-th">Manager</th>
              <th className="data-table-th">Status</th>
              <th className="data-table-th">Established</th>
              <th className="data-table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="data-table-body">
            {sampleSites.map((site) => (
              <tr key={site.id} className="data-table-row">
                <td className="data-table-td">
                  <div className="table-cell-content">
                    <div className="site-info">
                      <span className="site-name">{site.name}</span>
                    </div>
                  </div>
                </td>
                <td className="data-table-td">{site.location}</td>
                <td className="data-table-td">
                  <span className={getTypeBadgeClass(site.type)}>
                    {site.type}
                  </span>
                </td>
                <td className="data-table-td">{site.employees}</td>
                <td className="data-table-td">{site.manager}</td>
                <td className="data-table-td">
                  <span className={getStatusBadgeClass(site.status)}>
                    {site.status}
                  </span>
                </td>
                <td className="data-table-td">{new Date(site.established).toLocaleDateString()}</td>
                <td className="data-table-td">
                  <div className="table-actions">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-container">
        <div className="pagination-info">
          Showing 1 to {sampleSites.length} of {sampleSites.length} entries
        </div>
        <div className="pagination-controls">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="primary" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 