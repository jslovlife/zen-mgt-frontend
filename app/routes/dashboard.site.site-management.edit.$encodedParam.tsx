import React, { useState, useEffect } from 'react';
import { type LoaderFunctionArgs, type ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { useParams, useNavigate, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { Building2, ArrowLeft } from 'lucide-react';
import { PageLayout, Form, FormField, ButtonGroup } from '~/components';
import type { ButtonConfig } from '~/components';
import { Site } from '~/types/site.type';
import { EncryptionUtil } from '~/utils/encryption.util';
import { APIUtil } from "~/utils/api.util";
import { requireAuth } from "~/config/session.server";

// Loader function to protect the route and load site data
// Loader function to protect site management edit route
export async function loader({ request }: LoaderFunctionArgs) {
  const apiUtil = APIUtil.getInstance();
  
  // Check if user is authenticated
  if (!apiUtil.isAuthenticated()) {
    // If not authenticated, redirect to login
    return redirect("/login");
  }
  
  // If authenticated, allow access to site management edit
  return null;
}

const SiteEdit: React.FC = () => {
  const { encodedParam } = useParams();
  const navigate = useNavigate();

  // State
  const [siteId, setSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [site, setSite] = useState<Site | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    status: 'active',
    merchantId: '',
    description: ''
  });

  // Sample data - in real app, this would come from API
  const sampleSites: Site[] = [
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
    }
  ];

  // Decrypt parameter and load site data
  useEffect(() => {
    const loadSiteData = async () => {
      if (!encodedParam) {
        setError('No site parameter provided');
        setLoading(false);
        return;
      }

      try {
        // Decrypt the site ID
        const decryptedId = EncryptionUtil.decryptParam(encodedParam);
        setSiteId(decryptedId);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find the site data (in real app, this would be an API call)
        const foundSite = sampleSites.find(s => s.id === decryptedId);
        
        if (!foundSite) {
          setError(`Site with ID "${decryptedId}" not found`);
          setLoading(false);
          return;
        }

        // Set site data and form data
        setSite(foundSite);
        setFormData({
          name: foundSite.name,
          url: foundSite.url,
          status: foundSite.status,
          merchantId: foundSite.merchantId,
          description: foundSite.description
        });

        setLoading(false);
      } catch (err) {
        console.error('Failed to decrypt site ID:', err);
        setError('Invalid site parameter. The link may be corrupted or expired.');
        setLoading(false);
      }
    };

    loadSiteData();
  }, [encodedParam]);

  // Handle form field changes
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real app, make API call to update site
      console.log('Updating site:', { id: siteId, ...formData });

      // Navigate back to site management page
      navigate('/dashboard/site/site-management');
    } catch (err) {
      setError('Failed to update site. Please try again.');
      setSaving(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    navigate('/dashboard/site/site-management');
  };

  // Button configuration
  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'secondary',
      onClick: handleCancel,
      disabled: saving
    },
    {
      label: saving ? 'Saving...' : 'Save Changes',
      variant: 'primary',
      type: 'submit',
      disabled: saving,
      loading: saving
    }
  ];

  // Loading state
  if (loading) {
    return (
      <PageLayout title="Loading Site..." icon={<Building2 />}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading site data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout title="Error" icon={<Building2 />}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Site</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary-600)',
                  borderColor: 'var(--color-primary-600)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Site Management
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`Edit Site: ${site?.name || 'Unknown'}`} icon={<Building2 />}>
      <div className="max-w-4xl mx-auto">
        {/* Site Info Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Site Information</h3>
          <p className="text-blue-700 text-sm">
            Site ID: <span className="font-mono">{siteId}</span> | 
            Created: {site?.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'Unknown'} | 
            Last Modified: {site?.modifiedAt ? new Date(site.modifiedAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Site Details</h2>
          
          <Form onSubmit={handleSubmit}>
            <FormField
              label="Site Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              placeholder="Enter site name"
              required
            />

            <FormField
              label="Site URL"
              name="url"
              type="url"
              value={formData.url}
              onChange={(value) => handleInputChange('url', value)}
              placeholder="https://example.com"
              required
            />

            <FormField
              label="Merchant ID"
              name="merchantId"
              type="text"
              value={formData.merchantId}
              onChange={(value) => handleInputChange('merchantId', value)}
              placeholder="Enter merchant ID"
              required
            />

            <FormField
              label="Status"
              name="status"
              type="select"
              value={formData.status}
              onChange={(value) => handleInputChange('status', value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              required
            />

            <FormField
              label="Description"
              name="description"
              type="textarea"
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Enter site description"
              rows={4}
            />

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form Buttons */}
            <ButtonGroup buttons={buttons} className="pt-4" />
          </Form>
        </div>
      </div>
    </PageLayout>
  );
};

export default SiteEdit; 