import { User, LoginCredentials, RegisterCredentials } from '../types/auth';

class AuthService {
  private setSession(user: User, token: string) {
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
  }

  private clearSession() {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  private getLocalToken() {
    return localStorage.getItem('auth_token');
  }
  
  private getLocalUser() {
    const u = localStorage.getItem('auth_user');
    return u ? JSON.parse(u) : null;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    this.setSession(data.user, data.token);
    return data.user;
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }

    const data = await res.json();
    this.setSession(data.user, data.token);
    return data.user;
  }

  async loginWithGoogle(): Promise<User> {
    // Real Google Auth requires backend OAuth flow.
    // For this demo/transition, we'll alert the user.
    console.warn("Google login requires OAuth setup. Please use Email/Password.");
    alert("Google login requires full OAuth setup. Please use Email/Password for now.");
    throw new Error("Google login not configured.");
  }

  async logout(): Promise<void> {
    const token = this.getLocalToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout failed", e);
      }
    }
    this.clearSession();
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getLocalToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const user = await res.json();
        // Update local user data
        localStorage.setItem('auth_user', JSON.stringify(user));
        return user;
      } else if (res.status === 401 || res.status === 403) {
        // Token invalid
        this.clearSession();
        return null;
      } else {
        console.warn(`Failed to fetch user: ${res.status}`);
        // For server errors, try to keep the local session active
        return this.getLocalUser();
      }
    } catch (e) {
      console.error("Failed to fetch current user", e);
      // Return local user if exists (offline mode?) or null
      return null;
    }
  }
}

export const authService = new AuthService();
