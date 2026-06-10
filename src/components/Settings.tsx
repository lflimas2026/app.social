import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User as UserIcon,
  CreditCard,
  Bell,
  Lock,
  Sparkles,
  Save,
  Check,
  Building,
  Mail,
  Shield,
  Key
} from 'lucide-react';

export const Settings = () => {
  const { currentUser: user, updateProfile, addToast } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'plan' | 'alerts' | 'security'>('profile');

  // Form states - Profile
  const [firstName, setFirstName] = useState(user?.first_name || 'Fernando');
  const [lastName, setLastName] = useState(user?.last_name || 'Lima');
  const [companyName, setCompanyName] = useState(user?.company_name || 'Runtime IA');
  const [email, setEmail] = useState(user?.email || 'fernando@runtime.ia.br');

  // Form states - Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Form states - Alerts
  const [alertPublished, setAlertPublished] = useState(true);
  const [alertBudget, setAlertBudget] = useState(true);
  const [alertWeeklyReport, setAlertWeeklyReport] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      email: email
    });
    addToast('Perfil atualizado com sucesso!', 'success');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast('Por favor, preencha todos os campos de senha.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('A nova senha e a confirmação não coincidem.', 'error');
      return;
    }
    addToast('Senha atualizada com sucesso!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpgradePlan = (planName: string) => {
    addToast(`Redirecionando para o checkout do plano ${planName}...`, 'info');
  };

  return (
    <div className="settings-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Configurações</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Gerencie seu perfil, preferências e plano de assinatura
          </p>
        </div>
      </div>

      <div className="settings-container-grid">
        {/* SUB NAVIGATION SIDEBAR */}
        <div className="settings-nav-col">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`settings-nav-btn ${activeSubTab === 'profile' ? 'active' : ''}`}
          >
            <UserIcon size={16} />
            <span>Perfil</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('plan')}
            className={`settings-nav-btn ${activeSubTab === 'plan' ? 'active' : ''}`}
          >
            <CreditCard size={16} />
            <span>Assinatura & Plano</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`settings-nav-btn ${activeSubTab === 'alerts' ? 'active' : ''}`}
          >
            <Bell size={16} />
            <span>Alertas & Notificações</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`settings-nav-btn ${activeSubTab === 'security' ? 'active' : ''}`}
          >
            <Lock size={16} />
            <span>Segurança</span>
          </button>
        </div>

        {/* DETAILS CONFIG CARD */}
        <div className="settings-content-col">
          {/* TAB 1: USER PROFILE */}
          {activeSubTab === 'profile' && (
            <div className="card settings-panel-card">
              <h2 className="settings-panel-title">Meu Perfil</h2>
              <p className="settings-panel-subtitle">Edite suas informações pessoais e da sua empresa</p>

              <form onSubmit={handleSaveProfile} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome</label>
                    <input
                      type="text"
                      className="input-field"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sobrenome</label>
                    <input
                      type="text"
                      className="input-field"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>E-mail Corporativo</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="input-icon" />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nome da Empresa</label>
                  <div className="input-with-icon">
                    <Building size={16} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
                  <Save size={16} />
                  <span>Salvar Alterações</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PLANS & BILLING */}
          {activeSubTab === 'plan' && (
            <div className="card settings-panel-card">
              <h2 className="settings-panel-title">Plano de Assinatura</h2>
              <p className="settings-panel-subtitle">Gerencie suas mensalidades, upgrades e limite de posts</p>

              {/* Plans Compare Row */}
              <div className="plans-compare-grid">
                {/* Plan 1 */}
                <div className="plan-compare-card current">
                  <div className="plan-badge">Atual</div>
                  <span className="plan-title">Plano Starter</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">0</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> Até 2 contas conectadas</li>
                    <li><Check size={12} className="feat-ok" /> 10 postagens por mês</li>
                    <li><Check size={12} className="feat-ok" /> Analytics básico (7 dias)</li>
                  </ul>
                </div>

                {/* Plan 2 */}
                <div className="plan-compare-card premium">
                  <div className="plan-badge sparkles">
                    <Sparkles size={10} />
                    Popular
                  </div>
                  <span className="plan-title">Plano Pro</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">149</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> Contas conectadas ilimitadas</li>
                    <li><Check size={12} className="feat-ok" /> Postagens ilimitadas</li>
                    <li><Check size={12} className="feat-ok" /> Otimização de Anúncios por IA</li>
                    <li><Check size={12} className="feat-ok" /> Histórico de 90 dias de métricas</li>
                  </ul>
                  <button onClick={() => handleUpgradePlan('Pro')} className="btn btn-primary btn-sm upgrade-btn">
                    Fazer Upgrade
                  </button>
                </div>

                {/* Plan 3 */}
                <div className="plan-compare-card">
                  <span className="plan-title">Plano Agency</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">499</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> Tudo do Plano Pro</li>
                    <li><Check size={12} className="feat-ok" /> Relatórios em PDF Whitelabel</li>
                    <li><Check size={12} className="feat-ok" /> Suporte dedicado 24/7</li>
                    <li><Check size={12} className="feat-ok" /> Acesso multi-usuário (Times)</li>
                  </ul>
                  <button onClick={() => handleUpgradePlan('Agency')} className="btn btn-outline btn-sm upgrade-btn">
                    Falar com Vendas
                  </button>
                </div>
              </div>

              {/* Billing History */}
              <div style={{ marginTop: '2rem' }}>
                <h3 className="settings-panel-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Histórico de Faturamento</h3>
                <div className="table-container small">
                  <table>
                    <thead>
                      <tr>
                        <th>ID da Fatura</th>
                        <th>Data</th>
                        <th>Plano</th>
                        <th>Valor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontFamily: 'monospace' }}>#INV-9824</td>
                        <td>01/06/2026</td>
                        <td>Starter Trial</td>
                        <td>R$ 0,00</td>
                        <td><span className="badge badge-success">Pago</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATION ALERTS */}
          {activeSubTab === 'alerts' && (
            <div className="card settings-panel-card">
              <h2 className="settings-panel-title">Notificações & Alertas</h2>
              <p className="settings-panel-subtitle">Configure como e quando você quer receber notificações do sistema</p>

              <div className="alerts-preferences-list">
                <label className="alert-checkbox-row">
                  <input
                    type="checkbox"
                    checked={alertPublished}
                    onChange={(e) => setAlertPublished(e.target.checked)}
                  />
                  <div className="alert-details">
                    <span className="alert-pref-title">Confirmação de Publicação</span>
                    <span className="alert-pref-desc">Receber notificação em tempo real quando um post agendado for publicado.</span>
                  </div>
                </label>

                <label className="alert-checkbox-row">
                  <input
                    type="checkbox"
                    checked={alertBudget}
                    onChange={(e) => setAlertBudget(e.target.checked)}
                  />
                  <div className="alert-details">
                    <span className="alert-pref-title">Alerta de Orçamento de Anúncios</span>
                    <span className="alert-pref-desc">Avisar se o gasto diário de qualquer campanha atingir 80% do orçamento configurado.</span>
                  </div>
                </label>

                <label className="alert-checkbox-row">
                  <input
                    type="checkbox"
                    checked={alertWeeklyReport}
                    onChange={(e) => setAlertWeeklyReport(e.target.checked)}
                  />
                  <div className="alert-details">
                    <span className="alert-pref-title">Relatório de Performance Semanal</span>
                    <span className="alert-pref-desc">Receber no e-mail um resumo compilado contendo as métricas de engajamento e ROAS.</span>
                  </div>
                </label>
              </div>

              <button
                onClick={() => addToast('Configurações de alerta salvas!', 'success')}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '1.5rem' }}
              >
                Salvar Preferências
              </button>
            </div>
          )}

          {/* TAB 4: SECURITY PASSWORD CHANGING */}
          {activeSubTab === 'security' && (
            <div className="card settings-panel-card">
              <h2 className="settings-panel-title">Segurança da Conta</h2>
              <p className="settings-panel-subtitle">Altere sua senha e configure autenticação de dois fatores</p>

              <form onSubmit={handleUpdatePassword} className="settings-form">
                <div className="form-group">
                  <label>Senha Atual</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-icon" />
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nova Senha</label>
                    <input
                      type="password"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Nova Senha</label>
                    <input
                      type="password"
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem', marginBottom: '2rem' }}>
                  Atualizar Senha
                </button>
              </form>

              {/* 2FA MOCK */}
              <div className="security-divider"></div>
              <div className="two-factor-box flex-between">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Shield size={24} color="var(--color-primary)" />
                  <div>
                    <span className="two-factor-title">Autenticação de Dois Fatores (2FA)</span>
                    <span className="two-factor-desc" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Adicione uma camada extra de segurança usando o Google Authenticator ou 1Password.
                    </span>
                  </div>
                </div>
                
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => {
                      setTwoFactorEnabled(e.target.checked);
                      addToast(
                        e.target.checked 
                          ? '2FA Ativado! Salve o QR Code gerado.' 
                          : 'Autenticação de dois fatores desativada.', 
                        e.target.checked ? 'success' : 'info'
                      );
                    }}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .settings-container-grid {
          display: grid;
          grid-template-columns: 2fr 7fr;
          gap: 1.5rem;
          align-items: start;
        }

        .settings-nav-col {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .settings-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.875rem;
          border-radius: var(--radius-md);
          border: none;
          background: none;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.825rem;
          cursor: pointer;
          text-align: left;
          transition: var(--transition-fast);
        }

        .settings-nav-btn:hover {
          background-color: var(--hover-bg);
          color: var(--text-primary);
        }

        .settings-nav-btn.active {
          background-color: var(--bg-card);
          color: var(--color-primary);
          border: 1px solid var(--border-color);
          font-weight: 600;
        }

        .settings-content-col {
          min-height: 480px;
        }

        .settings-panel-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
        }

        .settings-panel-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .settings-panel-subtitle {
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin-top: 3px;
          margin-bottom: 1.75rem;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 500px;
        }

        /* PLANS COMPARE */
        .plans-compare-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .plan-compare-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: var(--transition-normal);
        }

        .plan-compare-card.current {
          background-color: var(--bg-card);
          border-color: var(--border-color);
        }

        .plan-compare-card.premium {
          background-color: var(--bg-card);
          border-color: var(--color-primary);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
        }

        .plan-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          background-color: var(--border-color);
          color: var(--text-secondary);
        }

        .plan-badge.sparkles {
          background-color: var(--color-primary);
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .plan-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .plan-price-row {
          display: flex;
          align-items: baseline;
          margin-bottom: 1rem;
        }

        .price-currency {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .price-num {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 2px;
        }

        .price-period {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }

        .plan-features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feat-ok {
          color: var(--color-success);
          margin-right: 4px;
        }

        .upgrade-btn {
          margin-top: auto;
          width: 100%;
          text-align: center;
          justify-content: center;
        }

        /* ALERTS PREF */
        .alerts-preferences-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .alert-checkbox-row {
          display: flex;
          gap: 0.875rem;
          align-items: flex-start;
          cursor: pointer;
        }

        .alert-checkbox-row input {
          margin-top: 3px;
        }

        .alert-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .alert-pref-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .alert-pref-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        /* SECURITY & 2FA Toggle switch */
        .security-divider {
          border-top: 1px solid var(--border-color);
          margin: 1.5rem 0;
        }

        .two-factor-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1rem;
        }

        .two-factor-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* TOGGLE SWITCH SWITCH */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 20px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-switch .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-color);
          transition: .3s;
        }

        .toggle-switch .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
        }

        .toggle-switch input:checked + .slider {
          background-color: var(--color-primary);
        }

        .toggle-switch input:checked + .slider:before {
          transform: translateX(18px);
        }

        .toggle-switch .slider.round {
          border-radius: 20px;
        }

        .toggle-switch .slider.round:before {
          border-radius: 50%;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .settings-container-grid {
            grid-template-columns: 1fr;
          }
          .plans-compare-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
