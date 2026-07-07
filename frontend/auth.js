// Authentication management
class Auth {
  constructor() {
    this.apiBaseUrl = (window.SPEAKON_API_BASE_URL || '').replace(/\/$/, '');
    this.accessToken = sessionStorage.getItem('access_token');
    this.refreshToken = sessionStorage.getItem('refresh_token');
    try {
      this.user = JSON.parse(sessionStorage.getItem('user')) || null;
    } catch {
      this.user = null;
      sessionStorage.removeItem('user');
    }
    this.googleClientId = null;
  }

  apiUrl(url) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `${this.apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  async request(url, options = {}) {
    const response = await fetch(this.apiUrl(url), options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Authentication request failed');
    }

    return data;
  }

  // Sign up new user
  async signup(email, password, firstName = '', lastName = '') {
    try {
      const data = await this.request('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      this.setTokens(data.access_token, data.refresh_token);
      this.user = data.user;
      sessionStorage.setItem('user', JSON.stringify(this.user));

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const data = await this.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      this.setTokens(data.access_token, data.refresh_token);
      this.user = data.user;
      sessionStorage.setItem('user', JSON.stringify(this.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Google sign-in
  async googleSignIn(token) {
    try {
      const data = await this.request('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      this.setTokens(data.access_token, data.refresh_token);
      this.user = data.user;
      sessionStorage.setItem('user', JSON.stringify(this.user));

      return data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async initGoogleButton(element, callback, text = 'signin_with') {
    const config = await this.request('/api/auth/config');
    this.googleClientId = config.google_client_id;

    if (!this.googleClientId) {
      element.hidden = true;
      return;
    }

    await this.waitForGoogle();
    google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback,
    });
    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: Math.max(240, Math.floor(element.getBoundingClientRect().width)),
      text,
    });
  }

  waitForGoogle() {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - startedAt > 10000) {
          clearInterval(timer);
          reject(new Error('Google Sign-In could not be loaded'));
        }
      }, 100);
    });
  }

  // Set tokens
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    sessionStorage.setItem('access_token', accessToken);
    sessionStorage.setItem('refresh_token', refreshToken);
  }

  // Get current user
  async getCurrentUser() {
    if (!this.isLoggedIn()) {
      return null;
    }

    try {
      const response = await fetch(this.apiUrl('/api/auth/me'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          return this.getCurrentUser();
        }
        throw new Error('Failed to get user');
      }

      const data = await response.json();
      this.user = data.user;
      sessionStorage.setItem('user', JSON.stringify(this.user));

      return this.user;
    } catch (error) {
      console.error('Get user error:', error);
      this.logout();
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    try {
      const response = await fetch(this.apiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.refreshToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.access_token, this.refreshToken);

      return data.access_token;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.logout();
      throw error;
    }
  }

  // Logout user
  logout(redirectToLogin = true) {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    if (redirectToLogin) {
      window.location.href = '/login.html';
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!this.accessToken && !!this.user;
  }

  // Get authorization header
  getAuthHeader() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
    };
  }

  // Fetch with auth (auto-refresh token if needed)
  async fetchWithAuth(url, options = {}) {
    options.headers = {
      ...options.headers,
      ...this.getAuthHeader(),
    };

    let response = await fetch(this.apiUrl(url), options);

    if (response.status === 401) {
      try {
        await this.refreshAccessToken();
        options.headers = {
          ...options.headers,
          ...this.getAuthHeader(),
        };
        response = await fetch(this.apiUrl(url), options);
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    return response;
  }
}

// Create global auth instance
const auth = new Auth();
