import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/renderWithProviders';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  test('redirects unauthenticated users to login', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<div>Cart Page</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/cart' }
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('allows admin users through admin-only route', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Route>
      </Routes>,
      { route: '/admin', auth: { user: { name: 'Admin', role: 'admin' } } }
    );

    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });
});
