import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as AuthContextModule from '../../context/AuthContext';

// Mock the AuthContext
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('Login Component', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    AuthContextModule.useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false
    });
  });

  test('renders login form with email, password inputs and submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('updates input values when typing', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { name: 'email', value: 'alice@example.com' } });
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'Password123!' } });

    expect(emailInput.value).toBe('alice@example.com');
    expect(passwordInput.value).toBe('Password123!');
  });

  test('calls login with email and password on form submission', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { name: 'email', value: 'test@university.edu' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { name: 'password', value: 'Secret123!' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@university.edu', 'Secret123!');
    });
  });

  test('shows spinner when authLoading is true', () => {
    AuthContextModule.useAuth.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: true
    });

    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(container.querySelector('.ds-spinner')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
