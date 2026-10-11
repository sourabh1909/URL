import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../features/auth/AuthContext';

describe('Nordic UI Critical Flows & Accessibility', () => {
  it('renders LandingPage hero, interactive preview, and feature cards', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Short links\./i)).toBeDefined();
    expect(screen.getByText(/Clear insights\./i)).toBeDefined();
    expect(screen.getByText(/Scandinavian Minimalist SaaS/i)).toBeDefined();
    expect(screen.getByText(/Interactive Preview/i)).toBeDefined();
    expect(screen.getByText(/Secure OAuth Sign-In/i)).toBeDefined();
    expect(screen.getAllByText(/Instant QR Codes/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Privacy-First Analytics/i)).toBeDefined();
  });

  it('allows user to interact with the demo shortening preview', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const input = screen.getByLabelText(/Destination URL/i);
    fireEvent.change(input, { target: { value: 'https://example.com/test' } });
    const generateBtn = screen.getByText(/Generate Preview/i);
    fireEvent.click(generateBtn);

    expect(screen.getByText(/Short Link Preview/i)).toBeDefined();
  });

  it('renders LoginPage with Google and GitHub OAuth buttons without mock credentials', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign in to NordLink/i)).toBeDefined();
    expect(screen.getByText(/Continue with Google/i)).toBeDefined();
    expect(screen.getByText(/Continue with GitHub/i)).toBeDefined();
    expect(screen.getByText(/Passwordless OAuth 2\.0 \/ OpenID Connect/i)).toBeDefined();
  });
});
