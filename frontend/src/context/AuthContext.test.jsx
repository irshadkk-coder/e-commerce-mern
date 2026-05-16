import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';

vi.mock('../services/tokenStorage', () => ({
  getToken: vi.fn(() => 'token'),
  getUser: vi.fn(() => ({ name: 'Test User', role: 'user' })),
  removeToken: vi.fn()
}));

vi.mock('../services/cartService', () => ({
  getCart: vi.fn(() => Promise.resolve({
    products: [{ quantity: 2 }, { quantity: 3 }]
  }))
}));

const Consumer = () => {
  const { user, loading, cartCount } = useAuth();
  if (loading) return <div>Loading</div>;
  return <div>{user?.name}: {cartCount}</div>;
};

describe('AuthContext', () => {
  test('hydrates user and cart count from stored token', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User: 5')).toBeInTheDocument();
    });
  });
});
