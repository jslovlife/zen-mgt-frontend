import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { getRouteConfig } from '../config/routes';
import { DataTable, ColumnConfig, ActionButton } from '../components/ui/DataTable';
import { SearchFilter } from '../components/ui/SearchFilter';
import { DateTimeUtil } from '../utils';
import { PageLayout } from '../components/layout/PageLayout';
import { Site } from '../types/site.type';

const SiteManagement: React.FC = () => {
  const navigate = useNavigate();
  // Get route configuration
  const routeConfig = getRouteConfig('site-management');
  
  // State
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample data - this would normally come from API
  const allSites: Site[] = [
    {
      id: '1',
      name: 'Main Commerce Site',
      url: 'https://commerce.example.com',
      status: 'active',
      merchantId: 'MCH001',
      description: 'Primary e-commerce platform for online sales and customer management',
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: 'John Doe',
      modifiedAt: '2024-02-20T14:45:00Z',
      modifiedBy: 'Jane Doe'
    },
    {
      id: '2',
      name: 'Mobile App Site',
      url: 'https://mobile.example.com',
      status: 'active',
      merchantId: 'MCH002',
      description: 'Mobile application backend API and administration portal',
      createdAt: '2024-02-01T09:15:00Z',
      createdBy: 'John Doe',
      modifiedAt: '2024-03-10T16:20:00Z',
      modifiedBy: 'Jane Doe'
    },
    {
      id: '3',
      name: 'Beta Testing Site',
      url: 'https://beta.example.com',
      status: 'inactive',
      merchantId: 'MCH003',
      description: 'Beta testing environment for new features and experimental functionality',
      createdAt: '2024-03-05T11:00:00Z',
      createdBy: 'John Doe',
      modifiedAt: '2024-03-15T13:30:00Z',
      modifiedBy: 'Jane Doe'
    },
    {
      id: '4',
      name: 'Analytics Dashboard',
      url: 'https://analytics.example.com',
      status: 'active',
      merchantId: 'MCH001',
      description: 'Business intelligence and analytics dashboard for data visualization',
      createdAt: '2024-01-20T08:45:00Z',
      createdBy: 'John Doe',
      modifiedAt: '2024-03-05T10:15:00Z',
      modifiedBy: 'Jane Doe'
    },
    {
      id: '5',
      name: 'Legacy Support Site',
      url: 'https://legacy.example.com',
      status: 'inactive',
      merchantId: 'MCH004',
      description: 'Legacy system support and maintenance portal for older applications',
      createdAt: '2023-12-10T14:20:00Z',
      createdBy: 'John Doe',
      modifiedAt: '2024-02-28T16:40:00Z',
      modifiedBy: 'Jane Doe'
    }
  ];

  // Column configuration for DataTable
  const columns: ColumnConfig<Site>[] = [
    {
      key: 'name',
      title: 'Site Name',
      dataType: 'string',
      sortable: true,
      filterable: true, // Will show instant filter in DataTable
      searchable: true, // Will show in SearchFilter - BOTH places
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      dataType: 'string',
      searchable: true, // Only show in SearchFilter, not in DataTable
      filterable: false // searchable-only column
    },
    {
      key: 'url',
      title: 'URL',
      dataType: 'string',
      sortable: true,
      filterable: true, // Will show instant filter in DataTable
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'merchantId',
      title: 'Merchant ID',
      dataType: 'string',
      sortable: true,
      filterable: true, // Will show instant filter in DataTable
      searchable: true, // Will show in SearchFilter - BOTH places
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      dataType: 'string',
      sortable: true,
      filterable: true, // Will show instant filter in DataTable
      searchable: true, // Will show in SearchFilter - BOTH places
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ],
      render: (value) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        const statusClasses = value === 'active' 
          ? `${baseClasses} bg-green-100 text-green-800`
          : `${baseClasses} bg-red-100 text-red-800`;
        
        return (
          <span className={statusClasses}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataType: 'timestamp',
      sortable: true,
      filterable: true, // Only show instant filter in DataTable
      render: (value) => (
        <div className="text-gray-600">
          {DateTimeUtil.toCustomFormat(value, 'YYYY-MM-DD')}
        </div>
      )
    },
    {
      key: 'createdBy',
      title: 'Created By',
      dataType: 'string',
      sortable: true,
      filterable: true, // Only show instant filter in DataTable
      render: (value) => (
        <div className="text-gray-600">{value}</div>
      )
    },
    {
      key: 'modifiedAt',
      title: 'Last Modified',
      dataType: 'timestamp',
      sortable: true,
      filterable: true, // Only show instant filter in DataTable
      render: (value) => (
        <div className="text-gray-600">
          {DateTimeUtil.toCustomFormat(value, 'YYYY-MM-DD')}
        </div>
      )
    },
    {
      key: 'actions' as keyof Site,
      title: 'Actions',
      dataType: 'string',
      sortable: false,
      filterable: false,
      searchable: false,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <ActionButton
            variant="primary"
            onClick={() => handleViewSite(record.id)}
          >
            View
          </ActionButton>
          <ActionButton
            variant="error"
            onClick={() => handleDeleteSite(record.id, record.name)}
          >
            Delete
          </ActionButton>
        </div>
      )
    }
  ];

  // Initialize sites data on component mount
  React.useEffect(() => {
    setSites(allSites);
  }, []);

  // Handle search from SearchFilter component
  const handleSearch = async (searchValues: Record<string, string>) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter data based on search values - this would normally be an API call
    const filteredData = allSites.filter(site => {
      return Object.entries(searchValues).every(([key, searchValue]) => {
        if (!searchValue) return true;
        
        const column = columns.find(col => col.key === key);
        const cellValue = site[key as keyof Site];
        
        if (column?.filterOptions) {
          // Exact match for dropdown filters
          return searchValue === cellValue?.toString();
        } else {
          // Partial match for text search
          return cellValue?.toString().toLowerCase().includes(searchValue.toLowerCase());
        }
      });
    });
    
    setSites(filteredData);
    setLoading(false);
    console.log('Search executed with values:', searchValues);
  };

  // Event handlers
  const handleAddSite = () => {
    navigate('/dashboard/site/site-management/insert');
  };

  const handleViewSite = (siteId: string) => {
    // Navigate to site detail page
    window.location.href = `/dashboard/site/site-management/${siteId}`;
  };

  const handleDeleteSite = (siteId: string, siteName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the site "${siteName}"?\n\nThis action cannot be undone.`
    );
    
    if (confirmed) {
      // Filter out the deleted site from the current sites state
      const updatedSites = sites.filter(site => site.id !== siteId);
      setSites(updatedSites);
      
      // In a real application, you would make an API call here
      console.log(`Deleting site with ID: ${siteId}`);
      
      // Optional: Show success message
      alert(`Site "${siteName}" has been deleted successfully.`);
    }
  };

  if (!routeConfig) {
    return <div>Route configuration not found</div>;
  }

  return (
    <PageLayout
      title={routeConfig?.title || 'Site Management'}
      icon={<Building2 />}
      addButtonText={routeConfig?.addButtonText}
      onAddClick={handleAddSite}
    >
      {/* Search and Filter Section */}
      <SearchFilter
        data={columns}
        onSearch={handleSearch}
      />

      {/* Data Table */}
      <div className="">
        <DataTable
          data={sites}
          columns={columns}
          loading={loading}
          enableFilter={true} // Enable instant filtering for filterable columns
          enableSorter={true}
          enablePagination={true}
          pageSize={10}
          rowKey="id"
          emptyText="No sites found"
          className="border rounded-lg min-w-full"
        />
      </div>
    </PageLayout>
  );
};

export default SiteManagement; 