import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import AdminOrdersPage from './AdminOrdersPage';
import { updateAdminOrderStatus } from '../services/adminService';

vi.mock('../services/adminService', () => ({
  getAdminOrder: vi.fn(() => Promise.resolve({
    status: true,
    order: {
      _id: '507f1f77bcf86cd799439011',
      products: [{
        item: '507f1f77bcf86cd799439012',
        quantity: 2,
        product: { name: 'Gaming Keyboard', category: 'Accessories', price: 1999 }
      }]
    }
  })),
  getAdminOrders: vi.fn(() => Promise.resolve({
    status: true,
    orders: [{
      _id: '507f1f77bcf86cd799439011',
      date: new Date('2026-01-01T10:00:00Z').toISOString(),
      status: 'paid',
      paymentStatus: 'paid',
      paymentMethod: 'ONLINE',
      totalAmount: 1999,
      deliveryDetails: {
        mobile: '9999999999',
        address: '123 Test Street',
        pincode: '600001'
      },
      products: [{ quantity: 2 }]
    }],
    pagination: { page: 1, limit: 10, totalPages: 1, totalOrders: 1 }
  })),
  updateAdminOrderStatus: vi.fn(() => Promise.resolve({
    status: true,
    order: { status: 'shipped' }
  }))
}));

describe('AdminOrdersPage', () => {
  test('renders orders and updates status', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminOrdersPage />, {
      route: '/admin/orders',
      auth: { user: { name: 'Admin', role: 'admin' } }
    });

    await waitFor(() => {
      expect(screen.getByText(/order #99439011/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getAllByRole('combobox')[1], 'shipped');
    expect(updateAdminOrderStatus).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'shipped');
  });
});
