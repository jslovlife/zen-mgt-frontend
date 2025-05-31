import { Button } from "~/components";
import { ModuleMetadata } from "~/config/routes";

// Sample payment order data
interface PaymentOrder {
  id: string;
  orderNumber: string;
  amount: number;
  currency: string;
  merchant: string;
  customer: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
}

const samplePaymentOrders: PaymentOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    amount: 299.99,
    currency: 'USD',
    merchant: 'TechStore Inc.',
    customer: 'John Doe',
    status: 'Completed',
    paymentMethod: 'Credit Card',
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:32:15Z'
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    amount: 1250.00,
    currency: 'USD',
    merchant: 'Fashion Hub',
    customer: 'Sarah Johnson',
    status: 'Processing',
    paymentMethod: 'Bank Transfer',
    createdAt: '2024-01-15T14:20:00Z'
  },
  {
    id: '3',
    orderNumber: 'PO-2024-003',
    amount: 89.50,
    currency: 'USD',
    merchant: 'BookWorld',
    customer: 'Mike Davis',
    status: 'Pending',
    paymentMethod: 'Digital Wallet',
    createdAt: '2024-01-15T16:45:00Z'
  },
  {
    id: '4',
    orderNumber: 'PO-2024-004',
    amount: 450.75,
    currency: 'USD',
    merchant: 'Electronics Plus',
    customer: 'Emma Wilson',
    status: 'Failed',
    paymentMethod: 'Credit Card',
    createdAt: '2024-01-15T09:15:00Z'
  },
  {
    id: '5',
    orderNumber: 'PO-2024-005',
    amount: 199.99,
    currency: 'USD',
    merchant: 'Home & Garden',
    customer: 'Alex Brown',
    status: 'Cancelled',
    paymentMethod: 'Debit Card',
    createdAt: '2024-01-14T18:30:00Z'
  }
];

export default function PaymentOrder() {
  const moduleData = ModuleMetadata['payment-order'];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'status-badge status-active';
      case 'Processing':
        return 'status-badge status-warning';
      case 'Pending':
        return 'status-badge status-info';
      case 'Failed':
        return 'status-badge status-error';
      case 'Cancelled':
        return 'status-badge status-inactive';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
              placeholder="Search payment orders..."
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
              <th className="data-table-th">Order Number</th>
              <th className="data-table-th">Amount</th>
              <th className="data-table-th">Merchant</th>
              <th className="data-table-th">Customer</th>
              <th className="data-table-th">Payment Method</th>
              <th className="data-table-th">Status</th>
              <th className="data-table-th">Created</th>
              <th className="data-table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="data-table-body">
            {samplePaymentOrders.map((order) => (
              <tr key={order.id} className="data-table-row">
                <td className="data-table-td">
                  <div className="table-cell-content">
                    <span className="order-number">{order.orderNumber}</span>
                  </div>
                </td>
                <td className="data-table-td">
                  <span className="amount">{formatCurrency(order.amount, order.currency)}</span>
                </td>
                <td className="data-table-td">{order.merchant}</td>
                <td className="data-table-td">{order.customer}</td>
                <td className="data-table-td">{order.paymentMethod}</td>
                <td className="data-table-td">
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </td>
                <td className="data-table-td">{formatDateTime(order.createdAt)}</td>
                <td className="data-table-td">
                  <div className="table-actions">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Process
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
          Showing 1 to {samplePaymentOrders.length} of {samplePaymentOrders.length} entries
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