import api from './api';

const TOKEN_KEY = 'cv_enhancer_token';
const REFRESH_TOKEN_KEY = 'cv_enhancer_refresh_token';
const USER_KEY = 'cv_enhancer_user';

export const authService = {
  /**
   * Register a new user
   */
  async register(userData) {
    const response = await api.post('/v1/auth/register', userData);
    const payload = response.data?.data || response.data;
    return payload;
  },

  /**
   * Login user
   */
  /**
   * Login user
   */
  async login(email, password) {
    const response = await api.post('/v1/auth/login', { email, password });
    const payload = response.data?.data || response.data;

    if (payload.token) {
      this.setToken(payload.token);
      if (payload.refreshToken) {
        this.setRefreshToken(payload.refreshToken);
      }
      if (payload.user) {
        this.setUser(payload.user);
      }
    }

    return payload;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/v1/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/v1/auth/refresh', { refreshToken });
    const payload = response.data?.data || response.data;

    if (payload.token) {
      this.setToken(payload.token);
      if (payload.refreshToken) {
        this.setRefreshToken(payload.refreshToken);
      }
    }

    return payload;
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get('/v1/users/me');
    const payload = response.data?.data || response.data;

    // The payload itself is the user object in getMe response
    if (payload && payload.email) {
      this.setUser(payload);
    }
    return payload;
  },
  /**
   * Update user profile
   */
  async updateProfile(userData) {
    const response = await api.patch('/v1/users/profile', userData);
    const payload = response.data?.data || response.data;
    if (payload) {
      this.setUser(payload);
    }
    return payload;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Get stored token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set token
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Set refresh token
   */
  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Get stored user
   */
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  /**
   * Set user
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Clear all auth data
   */
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export default authService;

