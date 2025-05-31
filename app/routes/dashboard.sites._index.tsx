import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

// Type definitions
interface Site {
  id: number;
  name: string;
  location: string;
  type: string;
  status: string;
  employees: number;
}

// Sample data for the data table
const sampleSites: Site[] = [
  { id: 1, name: "Main Office", location: "New York", type: "Headquarters", status: "Active", employees: 150 },
  { id: 2, name: "West Coast Branch", location: "San Francisco", type: "Branch", status: "Active", employees: 75 },
  { id: 3, name: "East Coast Branch", location: "Boston", type: "Branch", status: "Active", employees: 50 },
  { id: 4, name: "Remote Hub", location: "Austin", type: "Remote", status: "Inactive", employees: 25 },
];

export default function SitesIndex() {
  const currentModuleMeta = ModuleMetadata['site-management'];
  const currentData = sampleSites;
  const currentColumns = ["Name", "Location", "Type", "Status", "Employees"];

  return (
    <>
      <div className="content-header">
        <h1 className="page-title">{currentModuleMeta.title}</h1>
        <p className="page-description">{currentModuleMeta.description}</p>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-bar-left">
          <Button
            variant="primary"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            {currentModuleMeta.addButtonText}
          </Button>
        </div>
        <div className="action-bar-right">
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
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead className="data-table-header">
              <tr>
                <th className="data-table-th">
                  <input type="checkbox" className="table-checkbox" />
                </th>
                {currentColumns.map((column) => (
                  <th key={column} className="data-table-th">
                    {column}
                  </th>
                ))}
                <th className="data-table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="data-table-body">
              {currentData.map((item) => (
                <tr key={item.id} className="data-table-row">
                  <td className="data-table-td">
                    <input type="checkbox" className="table-checkbox" />
                  </td>
                  <td className="data-table-td">
                    <div className="site-info">
                      <span className="site-name">{item.name}</span>
                    </div>
                  </td>
                  <td className="data-table-td">{item.location}</td>
                  <td className="data-table-td">
                    <span className="type-badge">{item.type}</span>
                  </td>
                  <td className="data-table-td">
                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="data-table-td">{item.employees}</td>
                  <td className="data-table-td">
                    <div className="action-buttons">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="action-btn action-btn-edit"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="action-btn action-btn-delete"
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        }
                      />
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
            Showing 1 to {currentData.length} of {currentData.length} results
          </div>
          <div className="pagination-controls">
            <Button variant="ghost" size="sm" disabled className="pagination-btn pagination-btn-disabled">
              Previous
            </Button>
            <Button variant="primary" size="sm" className="pagination-btn pagination-btn-active">
              1
            </Button>
            <Button variant="ghost" size="sm" className="pagination-btn">
              2
            </Button>
            <Button variant="ghost" size="sm" className="pagination-btn">
              3
            </Button>
            <Button variant="ghost" size="sm" className="pagination-btn">
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 