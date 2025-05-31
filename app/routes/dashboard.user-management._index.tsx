import { Button, DataTable } from "~/components";
import type { ColumnConfig } from "~/components";
import { ModuleMetadata } from "~/config/routes";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  avatar?: string;
}

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'Admin',
    status: 'Active',
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Manager',
    status: 'Active',
    lastLogin: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    role: 'User',
    status: 'Active',
    lastLogin: '2024-01-14T16:45:00Z'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    role: 'User',
    status: 'Inactive',
    lastLogin: '2024-01-10T14:20:00Z'
  }
];

export default function UserManagement() {
  const moduleData = ModuleMetadata['user-management'];

  // Column configuration
  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      title: 'User',
      dataType: 'string',
      sortable: true,
      filterable: true,
      render: (value, record) => (
        <div className="user-info">
          <div className="user-avatar">
            {record.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="user-name">{record.name}</span>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Email',
      dataType: 'string',
      sortable: true,
      filterable: true
    },
    {
      key: 'role',
      title: 'Role',
      dataType: 'string',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Admin', value: 'Admin' },
        { label: 'Manager', value: 'Manager' },
        { label: 'User', value: 'User' }
      ],
      render: (value) => (
        <span className={`role-badge role-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataType: 'string',
      sortable: true,
      filterable: true,
      filterOptions: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' }
      ],
      render: (value) => (
        <span className={`status-badge status-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'lastLogin',
      title: 'Last Login',
      dataType: 'timestamp',
      sortable: true,
      filterable: true
    }
  ];

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-title-section">
          <h1 className="module-title">{moduleData.title}</h1>
        </div>
        <div className="module-actions">
          <Button variant="primary" size="md">
            {moduleData.addButtonText}
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={sampleUsers}
        columns={columns}
        enableFilter={true}
        enableSorter={true}
        enablePagination={true}
        pageSize={10}
      />
    </div>
  );
} 