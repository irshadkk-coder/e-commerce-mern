import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import ProductsPage from './ProductsPage';

vi.mock('../services/productService', () => ({
  getCategories: vi.fn(() => Promise.resolve({ status: true, categories: ['Accessories'] })),
  getProducts: vi.fn((params = {}) => Promise.resolve({
    status: true,
    products: params.q === 'missing' ? [] : [{
      _id: '507f1f77bcf86cd799439011',
      name: 'Gaming Keyboard',
      description: 'RGB keyboard',
      category: 'Accessories',
      price: 2999
    }],
    pagination: {
      page: Number(params.page || 1),
      limit: 12,
      totalProducts: params.q === 'missing' ? 0 : 13,
      totalPages: params.q === 'missing' ? 1 : 2
    }
  }))
}));

describe('ProductsPage', () => {
  test('renders search, sort, pagination, and product results', async () => {
    renderWithProviders(<ProductsPage />, { route: '/products' });

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Gaming Keyboard')).toBeInTheDocument();
    });

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByText('13 products available')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  test('shows empty state for no results', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProductsPage />, { route: '/products' });

    await screen.findByText('Gaming Keyboard');
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'missing');

    await waitFor(() => {
      expect(screen.getByText('No products match your criteria')).toBeInTheDocument();
    });
  });
});
