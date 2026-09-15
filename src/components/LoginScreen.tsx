import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { Employee } from '@/lib/types';

interface LoginScreenProps {
  onLoginSuccess: (user: Employee) => void;
  googleClientId?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  googleClientId = '',
}) => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const handleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Google authentication failed.');
        return;
      }

      onLoginSuccess(data.data);
    } catch (err: any) {
      setError(err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleClientId && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google) {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
          });
          (window as any).google.accounts.id.renderButton(
            document.getElementById('google-btn-container'),
            { theme: 'outline', size: 'large', width: '100%' }
          );
        }
      };
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '440px',
          width: '100%',
          padding: '2.5rem 2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--caa-navy)',
              color: '#FFFFFF',
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1.25rem',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            CAA
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Daily Task & EOD System
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Sign in with your CAA Google account
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* Google OAuth Button Container */}
        <div id="google-btn-container" style={{ display: 'flex', justifyContent: 'center' }}></div>




        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Lock size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Authorized Access Only. Role-based permissions mapped via EMPLOYEES sheet.
        </div>
      </div>
    </div>
  );
};
