import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SupplierDashboard from '../SupplierDashboard';
import apiService from '../../services/api';

jest.mock('../../services/api');

describe('SupplierDashboard', () => {
  beforeEach(() => {
    (apiService.getSupplierDashboardMetrics as jest.Mock).mockResolvedValue({
      pending_orders: 0,
      active_groups: 0,
      monthly_revenue: 0,
      total_savings_generated: 0,
      top_products: []
    });
    (apiService.getSupplierOrders as jest.Mock).mockResolvedValue([]);
    (apiService.getSupplierInvoices as jest.Mock).mockResolvedValue([]);
    (apiService.getSupplierPayments as jest.Mock).mockResolvedValue([]);
    (apiService.getSupplierNotifications as jest.Mock).mockResolvedValue([]);
  });

  test('renders without crashing and fetches data', async () => {
    render(<SupplierDashboard />);
    await waitFor(() => expect(apiService.getSupplierDashboardMetrics).toHaveBeenCalled());
    expect(screen.getByText(/Group Management/i)).toBeInTheDocument();
  });
});
