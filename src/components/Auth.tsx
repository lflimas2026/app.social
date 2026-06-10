import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, User as UserIcon, Building2, ArrowRight, X } from 'lucide-react';

export const Auth = () => {
  const { login, signup, addToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('fernando@runtime.ia.br');
  const [password, setPassword] = useState('123456');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  // Google OAuth Popup states
  const [googlePopupOpen, setGooglePopupOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const success = await login(email, password);
        if (!success) setLoading(false);
      } else if (mode === 'signup') {
        if (!email || !password || !firstName || !companyName) {
          addToast('Preencha todos os campos obrigatórios.', 'error');
          setLoading(false);
          return;
        }
        await signup(email, password, firstName, lastName, companyName);
      } else {
        // Forgot password
        if (!email) {
          addToast('Digite o seu e-mail.', 'warning');
          setLoading(false);
          return;
        }
        addToast('Link de recuperação enviado! Verifique sua caixa de entrada.', 'success');
        setMode('login');
      }
    } catch (err) {
      addToast('Erro ao realizar a operação.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthClick = () => {
    setShowCustomEmailInput(false);
    setCustomGoogleEmail('');
    setGooglePopupOpen(true);
  };

  const handleSelectGoogleAccount = async (selectedEmail: string, isDefaultAdmin = false) => {
    setGooglePopupOpen(false);
    setLoading(true);
    addToast('Autenticando via Google...', 'info');
    
    // Simulate API delay
    setTimeout(async () => {
      const pass = isDefaultAdmin ? 'Bugs@@959' : 'google-oauth-token';
      const success = await login(selectedEmail, pass);
      setLoading(false);
      if (!success) {
        addToast('Erro ao fazer login com Google.', 'error');
      }
    }, 1000);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleEmail.includes('@')) {
      addToast('Digite um e-mail do Google válido.', 'warning');
      return;
    }
    handleSelectGoogleAccount(customGoogleEmail);
  };

  return (
    <div className="auth-page">
      <div className="auth-card shadow-lg">
        {/* LOGO */}
        <div className="auth-logo">
          <div className="logo-icon-lg">
            <Sparkles size={28} color="#FFFFFF" />
          </div>
          <h2>Social App</h2>
          <p className="auth-subtitle">
            {mode === 'login' && 'Faça login para gerenciar suas redes sociais'}
            {mode === 'signup' && 'Comece a centralizar seu marketing digital agora'}
            {mode === 'forgot' && 'Recupere o acesso à sua conta'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <div className="input-with-icon">
                  <UserIcon size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Luiz"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Sobrenome</label>
                <input
                  type="text"
                  placeholder="Lima"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label>Nome da Empresa</label>
              <div className="input-with-icon">
                <Building2 size={16} className="input-icon" />
                <input
                  type="text"
                  required
                  placeholder="Minha Agência LTDA"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Endereço de E-mail</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                placeholder="fernando@runtime.ia.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <div className="flex-between">
                <label>Senha</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-btn">
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary auth-submit-btn">
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Entrar no Dashboard'}
                  {mode === 'signup' && 'Criar Minha Conta'}
                  {mode === 'forgot' && 'Enviar Link de Reset'}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* OAUTH GOOGLE FOR LOGIN & SIGNUP */}
        {mode !== 'forgot' && (
          <>
            <div className="auth-divider">
              <span>ou continuar com</span>
            </div>

            <button type="button" onClick={handleGoogleAuthClick} disabled={loading} className="google-auth-btn">
              <svg className="google-svg" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.57 14.98 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.7 8.92 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.3 3.49l3.59 2.78c2.1-1.94 3.77-4.79 3.77-8.42z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 6.9c-.83 1.66-1.3 3.52-1.3 5.5s.47 3.84 1.3 5.5l3.86-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.59-2.78c-.99.66-2.26 1.05-3.59 1.05-3.08 0-5.73-2.66-6.64-5.46L1.28 15.8C3.17 19.65 7.13 23 12 23z"
                />
              </svg>
              <span>Google Workspace</span>
            </button>
          </>
        )}

        {/* SWITCH MODES */}
        <div className="auth-footer">
          {mode === 'login' && (
            <p>
              Não tem conta?{' '}
              <button onClick={() => setMode('signup')} className="text-btn bold">
                Cadastre-se grátis
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Já tem conta?{' '}
              <button onClick={() => setMode('login')} className="text-btn bold">
                Faça login
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="text-btn bold text-center-btn">
              Voltar para o Login
            </button>
          )}
        </div>
      </div>

      {/* GOOGLE INTERACTIVE POPUP SIMULATOR */}
      {googlePopupOpen && (
        <div className="google-overlay">
          <div className="google-popup animate-pop">
            <div className="google-popup-header">
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="google-modal-title">Fazer login com o Google</span>
              <button onClick={() => setGooglePopupOpen(false)} className="google-close-btn">
                <X size={16} />
              </button>
            </div>

            <div className="google-popup-body">
              <p className="google-popup-subtitle">Escolha uma conta para continuar no <strong>Social App</strong></p>
              
              {!showCustomEmailInput ? (
                <div className="google-accounts-list">
                  <button 
                    onClick={() => handleSelectGoogleAccount('lflimas2022@gmail.com', true)}
                    className="google-account-item"
                  >
                    <div className="google-avatar">L</div>
                    <div className="google-acc-info">
                      <span className="google-acc-name">Luiz Fernando (Admin)</span>
                      <span className="google-acc-email">lflimas2022@gmail.com</span>
                    </div>
                    <span className="badge badge-admin">Admin</span>
                  </button>

                  <button 
                    onClick={() => handleSelectGoogleAccount('fernando@runtime.ia.br')}
                    className="google-account-item"
                  >
                    <div className="google-avatar">F</div>
                    <div className="google-acc-info">
                      <span className="google-acc-name">Luiz Fernando</span>
                      <span className="google-acc-email">fernando@runtime.ia.br</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleSelectGoogleAccount('free@test.com')}
                    className="google-account-item"
                  >
                    <div className="google-avatar">C</div>
                    <div className="google-acc-info">
                      <span className="google-acc-name">Criador Iniciante</span>
                      <span className="google-acc-email">free@test.com</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setShowCustomEmailInput(true)}
                    className="google-account-item use-another"
                  >
                    <div className="google-avatar outline">+</div>
                    <div className="google-acc-info">
                      <span className="google-acc-name" style={{ color: 'var(--color-primary)' }}>Usar outra conta</span>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="google-custom-email-form">
                  <div className="form-group">
                    <label>E-mail do Google Workspace</label>
                    <input 
                      type="email"
                      required
                      placeholder="seu.email@gmail.com ou workspace"
                      className="input-field"
                      style={{ backgroundColor: '#fff', color: '#1f2937', border: '1px solid #d1d5db' }}
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCustomEmailInput(false)}
                      className="btn btn-outline"
                      style={{ border: '1px solid #d1d5db', color: '#4b5563', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Avançar
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="google-popup-footer">
              <span>Para continuar, o Google compartilhará seu nome, endereço de e-mail e foto do perfil com o Social App.</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .auth-page {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-app);
          background-image: 
            radial-gradient(at 10% 10%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 90% 90%, rgba(6, 182, 212, 0.08) 0px, transparent 50%);
          padding: 1.5rem;
          transition: background-color var(--transition-normal);
        }

        .auth-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .auth-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-icon-lg {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
        }

        .auth-logo h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: 0.825rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .input-with-icon {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-with-icon input {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.625rem 0.875rem 0.625rem 2.25rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          transition: var(--transition-fast);
          width: 100%;
        }

        .input-with-icon input:focus {
          border-color: var(--color-primary);
          background-color: var(--bg-card);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .text-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: 0.775rem;
          font-weight: 500;
          cursor: pointer;
        }
        .text-btn:hover {
          text-decoration: underline;
        }

        .text-btn.bold {
          font-weight: 600;
        }

        .text-center-btn {
          margin: 0 auto;
          display: block;
        }

        .auth-submit-btn {
          width: 100%;
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.725rem;
          text-transform: uppercase;
          margin: 1.5rem 0;
          width: 100%;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .auth-divider:not(:empty)::before {
          margin-right: .75em;
        }

        .auth-divider:not(:empty)::after {
          margin-left: .75em;
        }

        .google-auth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.625rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: var(--transition-fast);
          width: 100%;
        }

        .google-auth-btn:hover {
          background-color: var(--hover-bg);
          border-color: var(--text-secondary);
        }

        .google-svg {
          width: 16px;
          height: 16px;
        }

        .auth-footer {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.825rem;
          color: var(--text-secondary);
        }

        /* Loading Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #FFFFFF;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* GOOGLE POPUP SIMULATOR STYLES */
        .google-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .google-popup {
          width: 100%;
          max-width: 420px;
          background-color: #ffffff;
          color: #1f2937;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .google-popup-header {
          display: flex;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .google-modal-title {
          font-size: 0.95rem;
          font-weight: 500;
          color: #374151;
        }

        .google-close-btn {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
        }

        .google-close-btn:hover {
          color: #4b5563;
        }

        .google-popup-body {
          padding: 1.5rem;
          flex-grow: 1;
        }

        .google-popup-subtitle {
          font-size: 0.85rem;
          color: #4b5563;
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        .google-accounts-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .google-account-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          width: 100%;
          text-align: left;
        }

        .google-account-item:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }

        .google-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
        }

        .google-avatar.outline {
          background-color: transparent;
          color: #3b82f6;
          border: 1px dashed #3b82f6;
        }

        .google-acc-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .google-acc-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
        }

        .google-acc-email {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 1px;
        }

        .badge-admin {
          background-color: #fef3c7;
          color: #d97706;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .google-popup-footer {
          background-color: #f9fafb;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.7rem;
          color: #6b7280;
          line-height: 1.35;
        }

        .google-custom-email-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
};
