import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../src/services/auth.service';
import { axiosInstance } from '../../src/lib/axios';

vi.mock('../../src/lib/axios', () => ({
  axiosInstance: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@fintech.com',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      };

      (axiosInstance.post as any).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'test@fintech.com',
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@fintech.com',
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'User',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error for duplicate email', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: { status: 409, data: { message: 'Email already exists' } },
      });

      await expect(
        authService.register({
          email: 'existing@fintech.com',
          password: 'Test1234',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });

    it('should throw error for weak password', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: { status: 400, data: { message: 'Password too weak' } },
      });

      await expect(
        authService.register({
          email: 'test@fintech.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@fintech.com',
            firstName: 'Test',
            lastName: 'User',
          },
        },
      };

      (axiosInstance.post as any).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@fintech.com',
        password: 'Test1234',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@fintech.com',
        password: 'Test1234',
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error for invalid credentials', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: { status: 401, data: { message: 'Invalid credentials' } },
      });

      await expect(
        authService.login({
          email: 'test@fintech.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: { status: 401, data: { message: 'User not found' } },
      });

      await expect(
        authService.login({
          email: 'nonexistent@fintech.com',
          password: 'Test1234',
        })
      ).rejects.toThrow();
    });
  });

  describe('getStoredUser', () => {
    it('should get stored user from localStorage', () => {
      const mockUser = {
        id: '1',
        email: 'test@fintech.com',
        firstName: 'Test',
        lastName: 'User',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));

      const result = authService.getStoredUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null if no user stored', () => {
      const result = authService.getStoredUser();
      expect(result).toBeNull();
    });
  });

  describe('getStoredToken', () => {
    it('should get stored token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      
      const result = authService.getStoredToken();
      
      expect(result).toBe('test-token');
    });

    it('should return null if no token stored', () => {
      const result = authService.getStoredToken();
      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage on logout', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: '1' }));

      authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('storeAuth', () => {
    it('should store token and user in localStorage', () => {
      const authResponse = {
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@fintech.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      authService.storeAuth(authResponse);

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(authResponse.user));
    });
  });
});
