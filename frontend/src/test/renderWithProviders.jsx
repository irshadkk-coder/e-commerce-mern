import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const defaultAuth = {
  user: null,
  loading: false,
  loginContext: vi.fn(),
  logoutContext: vi.fn(),
  cartCount: 0,
  fetchCartCount: vi.fn()
};

export const renderWithProviders = (ui, { route = '/', auth = {} } = {}) => (
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={{ ...defaultAuth, ...auth }}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  )
);
