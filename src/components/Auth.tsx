import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, User as UserIcon, Building2, ArrowRight } from 'lucide-react';

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

  const handleGoogleAuth = () => {
    setLoading(true);
    setTimeout(() => {
      login('fernando@runtime.ia.br', 'google-oauth-token');
      setLoading(false);
    }, 800);
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
            {mode === 'signup' && 'Comece seu teste grátis de 14 dias agora'}
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

            <button type="button" onClick={handleGoogleAuth} disabled={loading} className="google-auth-btn">
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
      `}</style>
    </div>
  );
};
