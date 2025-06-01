import React from 'react';
import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Building2, CreditCard, Users, Settings, TrendingUp, Activity } from 'lucide-react';
import { PageLayout } from '~/components/layout/PageLayout';
import { APIUtil } from "~/utils/api.util";
import { requireAuth } from "~/config/session.server";

// Loader function to protect dashboard index route
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== DASHBOARD INDEX LOADER START ===");
  
  // Use the centralized authentication utility
  const session = requireAuth(request);
  
  console.log("Dashboard index auth token found:", session.authToken?.substring(0, 20) + "...");
  console.log("Dashboard index authentication passed, allowing access");
  
  return null;
}

const DashboardOverview: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Total Sites',
      value: '12',
      change: '+2 this month',
      icon: <Building2 className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Payment Platforms',
      value: '8',
      change: '+1 this week',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'System Users',
      value: '24',
      change: '+3 this month',
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: 'All systems operational',
      icon: <Activity className="w-6 h-6" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  const quickActions = [
    {
      title: 'Site Management',
      description: 'Manage your sites and their configurations',
      href: '/dashboard/site/site-management',
      icon: <Building2 className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Payment Platforms',
      description: 'Configure payment processing platforms',
      href: '/dashboard/platform/payment-platform',
      icon: <CreditCard className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'User Management',
      description: 'Manage system users and permissions',
      href: '/dashboard/user-administration/user-management',
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'System Settings',
      description: 'Configure system parameters and settings',
      href: '/dashboard/system-administration/system-parameter',
      icon: <Settings className="w-6 h-6" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      title: 'Reports',
      description: 'View system reports and analytics',
      href: '/dashboard/tools/reports',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <PageLayout title="Dashboard Overview">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome to Zen Management</h1>
          <p className="text-purple-100">
            Monitor your system, manage your sites, and configure your platforms all in one place.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${action.bgColor} ${action.color} p-2 rounded-lg group-hover:scale-105 transition-transform`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-50 text-green-600 p-1 rounded-full">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">New site added</p>
                    <p className="text-sm text-gray-500">Mobile App Site was created successfully</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-50 text-blue-600 p-1 rounded-full">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">User permissions updated</p>
                    <p className="text-sm text-gray-500">Admin permissions were modified for John Doe</p>
                    <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-50 text-purple-600 p-1 rounded-full">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">System configuration updated</p>
                    <p className="text-sm text-gray-500">Payment timeout settings were adjusted</p>
                    <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardOverview; 