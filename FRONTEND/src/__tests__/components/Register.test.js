import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';
import * as AuthContextModule from '../../context/AuthContext';
import { toast } from 'react-toastify';

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

describe('Register Component', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    AuthContextModule.useAuth.mockReturnValue({
      register: mockRegister,
      user: null,
      loading: false
    });
  });

  test('renders step 1 with account details fields', () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(container.querySelector('input[name="firstName"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="lastName"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="username"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue to academic profile/i })).toBeInTheDocument();
  });

  test('validates password mismatch on step 1', () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(container.querySelector('input[name="firstName"]'), { target: { name: 'firstName', value: 'Alice' } });
    fireEvent.change(container.querySelector('input[name="lastName"]'), { target: { name: 'lastName', value: 'Smith' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'alice@uni.edu' } });
    fireEvent.change(container.querySelector('input[name="username"]'), { target: { name: 'username', value: 'alice.smith' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { name: 'password', value: 'Password123!' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { name: 'confirmPassword', value: 'DifferentPass1!' } });

    fireEvent.click(screen.getByRole('button', { name: /continue to academic profile/i }));

    expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
  });

  test('advances to step 2 when step 1 inputs are valid', () => {
    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(container.querySelector('input[name="firstName"]'), { target: { name: 'firstName', value: 'Alice' } });
    fireEvent.change(container.querySelector('input[name="lastName"]'), { target: { name: 'lastName', value: 'Smith' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'alice@uni.edu' } });
    fireEvent.change(container.querySelector('input[name="username"]'), { target: { name: 'username', value: 'alice.smith' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { name: 'password', value: 'Password123!' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { name: 'confirmPassword', value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /continue to academic profile/i }));

    expect(container.querySelector('input[name="institution"]')).toBeInTheDocument();
    expect(container.querySelector('select[name="designation"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete registration/i })).toBeInTheDocument();
  });

  test('submits registration successfully on step 2', async () => {
    mockRegister.mockResolvedValue({ success: true });

    const { container } = render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    // Step 1
    fireEvent.change(container.querySelector('input[name="firstName"]'), { target: { name: 'firstName', value: 'Alice' } });
    fireEvent.change(container.querySelector('input[name="lastName"]'), { target: { name: 'lastName', value: 'Smith' } });
    fireEvent.change(container.querySelector('input[name="email"]'), { target: { name: 'email', value: 'alice@uni.edu' } });
    fireEvent.change(container.querySelector('input[name="username"]'), { target: { name: 'username', value: 'alice.smith' } });
    fireEvent.change(container.querySelector('input[name="password"]'), { target: { name: 'password', value: 'Password123!' } });
    fireEvent.change(container.querySelector('input[name="confirmPassword"]'), { target: { name: 'confirmPassword', value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /continue to academic profile/i }));

    // Step 2
    fireEvent.change(container.querySelector('input[name="institution"]'), {
      target: { name: 'institution', value: 'MIT' }
    });
    fireEvent.change(container.querySelector('input[name="researchInterests"]'), {
      target: { name: 'researchInterests', value: 'AI, ML, Robotics' }
    });

    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@uni.edu',
          username: 'alice.smith',
          institution: 'MIT',
          researchInterests: ['AI', 'ML', 'Robotics']
        })
      );
    });
  });
});
