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
  Key,
  ExternalLink,
  QrCode,
  X
} from 'lucide-react';

export const Settings = () => {
  const { 
    currentUser: user, 
    invoices, 
    simulateAsaasUpgrade, 
    updateProfile, 
    addToast,
    createPixPayment,
    createCardPayment,
    cancelSubscription
  } = useApp();
  
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'plan' | 'alerts' | 'security'>('profile');

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<'starter' | 'professional'>('starter');
  const [payMethod, setPayMethod] = useState<'pix' | 'credit_card' | 'boleto'>('pix');

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Real Asaas payment response states
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixCopyPaste, setPixCopyPaste] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');

  // Form states - Profile
  const [firstName, setFirstName] = useState(user?.first_name || 'Fernando');
  const [lastName, setLastName] = useState(user?.last_name || 'Lima');
  const [companyName, setCompanyName] = useState(user?.company_name || 'Runtime IA');
  const [email, setEmail] = useState(user?.email || 'fernando@runtime.ia.br');
  const [cpf, setCpf] = useState(user?.cpf || '');

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
      email: email,
      cpf: cpf
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

  const handleUpgradePlan = (planName: 'starter' | 'professional') => {
    setCheckoutPlan(planName);
    setPayMethod('pix');
    setPixQrCode('');
    setPixCopyPaste('');
    setInvoiceUrl('');
    setCheckoutModalOpen(true);
  };

  const handleConfirmAsaasPayment = async () => {
    setIsProcessingCheckout(true);
    try {
      if (payMethod === 'pix') {
        addToast('Gerando PIX no Asaas...', 'info');
        const res = await createPixPayment(checkoutPlan);
        if (res && res.qr_code) {
          setPixQrCode(res.qr_code);
          setPixCopyPaste(res.pix_copy_paste);
          addToast('PIX gerado! Aguardando pagamento no Asaas...', 'success');
        }
      } else if (payMethod === 'credit_card') {
        addToast('Redirecionando para o Gateway do Asaas...', 'info');
        const res = await createCardPayment(checkoutPlan);
        if (res && res.invoiceUrl) {
          setInvoiceUrl(res.invoiceUrl);
          window.open(res.invoiceUrl, '_blank');
          addToast('Conclua o pagamento na aba aberta para ativar o plano.', 'success');
        }
      } else {
        // Fallback for simulation/boleto
        const price = checkoutPlan === 'starter' ? 99 : checkoutPlan === 'professional' ? 149 : 499;
        const success = await simulateAsaasUpgrade(checkoutPlan, payMethod, price);
        if (success) {
          setCheckoutModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleSimulateQuickBypass = async () => {
    setIsProcessingCheckout(true);
    const price = checkoutPlan === 'starter' ? 99 : checkoutPlan === 'professional' ? 149 : 499;
    const success = await simulateAsaasUpgrade(checkoutPlan, payMethod, price);
    setIsProcessingCheckout(false);
    if (success) {
      setCheckoutModalOpen(false);
    }
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
            <span>Assinatura &amp; Plano</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`settings-nav-btn ${activeSubTab === 'alerts' ? 'active' : ''}`}
          >
            <Bell size={16} />
            <span>Alertas &amp; Notificações</span>
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

                <div className="form-group">
                  <label>CPF</label>
                  <div className="input-with-icon">
                    <Key size={16} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.25rem' }}
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value.replace(/[^0-9]/g, ''))}
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
            <div className="card settings-panel-card animate-fade-in">
              <h2 className="settings-panel-title">Plano de Assinatura & Faturamento</h2>
              <p className="settings-panel-subtitle">Gerencie seu plano atual, faça upgrades rápidos via checkout Asaas e veja faturas.</p>

              {/* Subscription Status details if not Free */}
              {user?.plan !== 'free' && (
                <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Sua Assinatura Ativa (Asaas)</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Plano Atual: <strong style={{ textTransform: 'uppercase' }}>{user?.plan}</strong> | 
                      Status: <span className={`badge badge-${user?.subscription_status === 'active' ? 'success' : 'warning'}`} style={{ marginLeft: '4px' }}>{user?.subscription_status}</span>
                    </p>
                    {user?.next_due_date && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Próximo Vencimento: <strong>{new Date(user.next_due_date).toLocaleDateString('pt-BR')}</strong>
                      </p>
                    )}
                    {user?.asaas_customer_id && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        Customer ID: {user.asaas_customer_id}
                      </p>
                    )}
                  </div>
                  {user?.subscription_status === 'active' && (
                    <button
                      onClick={async () => {
                        if (confirm('Tem certeza que deseja cancelar sua assinatura recorrente? Seu acesso aos recursos será limitado ao final do período pago.')) {
                          await cancelSubscription();
                        }
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                    >
                      Cancelar Assinatura
                    </button>
                  )}
                </div>
              )}

              {/* Plans Compare Row */}
              <div className="plans-compare-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Plan 1: Free */}
                <div className={`plan-compare-card ${user?.plan === 'free' ? 'current' : ''}`}>
                  {user?.plan === 'free' && <div className="plan-badge">Atual</div>}
                  <span className="plan-title">Plano Free</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">0</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> 1 rede social conectada</li>
                    <li><Check size={12} className="feat-ok" /> 10 agendamentos mensais</li>
                    <li><Check size={12} className="feat-ok" /> Analytics básico (7 dias)</li>
                    <li style={{ opacity: 0.5 }}><X size={12} style={{ color: 'var(--color-error)' }} /> Sem Auto-posting ativo</li>
                    <li style={{ opacity: 0.5 }}><X size={12} style={{ color: 'var(--color-error)' }} /> Sem IA / Gemini Integrada</li>
                  </ul>
                  {user?.plan !== 'free' && (
                    <button onClick={() => addToast('Entre em contato com o administrador para migrar para o plano grátis.', 'info')} className="btn btn-outline btn-sm upgrade-btn">
                      Downgrade
                    </button>
                  )}
                </div>

                {/* Plan 2: Starter */}
                <div className={`plan-compare-card ${user?.plan === 'starter' ? 'current' : ''}`}>
                  {user?.plan === 'starter' && <div className="plan-badge">Atual</div>}
                  <span className="plan-title">Plano Starter</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">99</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> 3 redes sociais conectadas</li>
                    <li><Check size={12} className="feat-ok" /> Agendamentos ilimitados</li>
                    <li><Check size={12} className="feat-ok" /> Auto-posting ativo</li>
                    <li><Check size={12} className="feat-ok" /> Gerenciador de Anúncios</li>
                    <li><Check size={12} className="feat-ok" /> IA de otimização básica</li>
                  </ul>
                  {user?.plan !== 'starter' && (
                    <button onClick={() => handleUpgradePlan('starter')} className="btn btn-primary btn-sm upgrade-btn">
                      Adquirir Starter
                    </button>
                  )}
                </div>

                {/* Plan 3: Professional */}
                <div className={`plan-compare-card premium ${user?.plan === 'professional' ? 'current' : ''}`}>
                  {user?.plan === 'professional' && <div className="plan-badge">Atual</div>}
                  <div className="plan-badge sparkles">
                    <Sparkles size={10} />
                    Completo
                  </div>
                  <span className="plan-title">Plano Professional</span>
                  <div className="plan-price-row">
                    <span className="price-currency">R$</span>
                    <span className="price-num">149</span>
                    <span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features-list">
                    <li><Check size={12} className="feat-ok" /> 6 redes sociais conectadas</li>
                    <li><Check size={12} className="feat-ok" /> Agendamentos ilimitados</li>
                    <li><Check size={12} className="feat-ok" /> Auto-posting ativo</li>
                    <li><Check size={12} className="feat-ok" /> Gerenciador de Anúncios avançado</li>
                    <li><Check size={12} className="feat-ok" /> Gemini 2.5 Flash integrada</li>
                    <li><Check size={12} className="feat-ok" /> Relatórios PDF exportáveis</li>
                  </ul>
                  {user?.plan !== 'professional' && (
                    <button onClick={() => handleUpgradePlan('professional')} className="btn btn-primary btn-sm upgrade-btn">
                      Upgrade Pro
                    </button>
                  )}
                </div>

                {/* Enterprise removed per request (corporate plan) */}
              </div>

              {/* Official Asaas Integration Step-by-Step Guide */}
              <div className="asaas-guide-section" style={{ marginTop: '2rem' }}>
                <h3 className="settings-panel-title flex-center" style={{ fontSize: '0.95rem', gap: '8px', color: 'var(--color-primary)' }}>
                  <ExternalLink size={16} />
                  Guia Oficial de Integração Asaas (Fluxo de Produção Real)
                </h3>
                <p className="settings-panel-subtitle" style={{ marginBottom: '1rem' }}>
                  Siga este passo a passo para conectar os pagamentos do Social App com a sua conta oficial do Asaas.
                </p>

                <div className="asaas-steps-layout">
                  <div className="asaas-step-card">
                    <div className="step-num">1</div>
                    <div className="step-body">
                      <strong>Criar conta Sandbox ou Produção:</strong>
                      <p>Acesse <a href="https://www.asaas.com" target="_blank" rel="noreferrer">asaas.com</a> e crie uma conta. Use o ambiente de testes em <a href="https://sandbox.asaas.com" target="_blank" rel="noreferrer">sandbox.asaas.com</a> durante o desenvolvimento.</p>
                    </div>
                  </div>

                  <div className="asaas-step-card">
                    <div className="step-num">2</div>
                    <div className="step-body">
                      <strong>Gerar Token de Acesso (API Key):</strong>
                      <p>Vá em <i>Minha Conta &gt; Integrações &gt; Gerar Chave de API</i>. Guarde essa chave secreta de forma segura em suas variáveis de ambiente (ASAAS_API_KEY).</p>
                    </div>
                  </div>

                  <div className="asaas-step-card">
                    <div className="step-num">3</div>
                    <div className="step-body">
                      <strong>Configurar Webhook para Notificação de Pagamento:</strong>
                      <p>Nas configurações de integração, cadastre a URL de Webhook de retorno para a sua API Cloudflare Worker/Next.js (ex: https://api.socialapp.com/webhooks/asaas). Ative o envio de eventos para:</p>
                      <ul style={{ paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <li><code>PAYMENT_RECEIVED</code> (Pagamento recebido)</li>
                        <li><code>PAYMENT_CONFIRMED</code> (Pagamento confirmado via cartão/PIX)</li>
                        <li><code>PAYMENT_OVERDUE</code> (Mensalidade atrasada - bloqueia a empresa via API)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="asaas-step-card">
                    <div className="step-num">4</div>
                    <div className="step-body">
                      <strong>Criar Clientes e Assinaturas (Backend):</strong>
                      <p>Ao registrar uma empresa na plataforma, faça uma requisição POST para <code>/v3/customers</code> do Asaas para criar o cliente. Em seguida, utilize <code>/v3/subscriptions</code> definindo o valor do plano, forma de pagamento (Pix/Credit Card/Boleto) e ciclo de cobrança.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing History */}
              <div style={{ marginTop: '2rem' }}>
                <h3 className="settings-panel-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Histórico de Faturamento (Simulação Asaas)</h3>
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
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                            Nenhuma transação financeira registrada até o momento.
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.id}</td>
                            <td>{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
                                {inv.planName}
                              </span>
                            </td>
                            <td>R$ {inv.amount.toFixed(2)}</td>
                            <td>
                              <span className={`badge badge-${inv.status === 'Pago' ? 'success' : 'warning'}`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

                        {/* ASAAS CHECKOUT MODAL */}
              {checkoutModalOpen && (
                <div className="overlay">
                  <div className="modal-content" style={{ maxWidth: '520px' }}>
                    <div className="modal-header">
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <QrCode size={18} color="var(--color-primary)" />
                          Checkout Asaas Payment Gateway
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Adquira com segurança o plano {checkoutPlan.toUpperCase()}
                        </p>
                      </div>
                      <button onClick={() => setCheckoutModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={18} />
                      </button>
                    </div>

                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {/* Summary box */}
                      <div className="checkout-summary-box">
                        <div className="flex-between">
                          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Plano Selecionado</span>
                          <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Plano {checkoutPlan.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-between" style={{ marginTop: '4px' }}>
                          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Valor Mensal</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            R$ {checkoutPlan === 'starter' ? '99,00' : checkoutPlan === 'professional' ? '149,00' : '499,00'}
                          </span>
                        </div>
                      </div>

                      {/* Payment method selector tabs */}
                      <div className="payment-method-tabs">
                        <button
                          type="button"
                          className={payMethod === 'pix' ? 'active' : ''}
                          onClick={() => setPayMethod('pix')}
                        >
                          Pix
                        </button>
                        <button
                          type="button"
                          className={payMethod === 'credit_card' ? 'active' : ''}
                          onClick={() => setPayMethod('credit_card')}
                        >
                          Cartão de Crédito / Boleto
                        </button>
                      </div>

                      {/* Payment method content screen */}
                      <div className="payment-method-screen">
                        {/* PIX SCREEN */}
                        {payMethod === 'pix' && (
                          <div className="pix-screen-wrapper flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                            {!pixQrCode ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleConfirmAsaasPayment}
                                disabled={isProcessingCheckout}
                                style={{ width: '100%', padding: '0.75rem' }}
                              >
                                {isProcessingCheckout ? 'Gerando PIX no Asaas...' : 'Gerar QR Code PIX via Asaas'}
                              </button>
                            ) : (
                              <>
                                <div className="pix-qr-box" style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <img
                                    src={`data:image/png;base64,${pixQrCode}`}
                                    alt="Pix QR Code Asaas"
                                    style={{ width: '150px', height: '150px' }}
                                  />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0, maxWidth: '320px' }}>
                                  Escaneie o QR Code acima com o app do seu banco. O plano será ativado assim que o pagamento for detectado pelo webhook.
                                </p>
                                <div style={{ width: '100%' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                                    Código Copia e Cola:
                                  </label>
                                  <textarea
                                    readOnly
                                    value={pixCopyPaste}
                                    style={{ width: '100%', height: '60px', padding: '6px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', resize: 'none' }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(pixCopyPaste);
                                    addToast('Código Pix copiado!', 'success');
                                  }}
                                  className="btn btn-outline btn-sm"
                                  style={{ width: '100%' }}
                                >
                                  Copiar Código Pix
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* CREDIT CARD & BOLETO SCREEN */}
                        {payMethod === 'credit_card' && (
                          <div className="pix-screen-wrapper flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem 0', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                              Para sua total segurança, o faturamento por Cartão ou Boleto é processado pelo checkout seguro e criptografado do Asaas.
                            </p>
                            {!invoiceUrl ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleConfirmAsaasPayment}
                                disabled={isProcessingCheckout}
                                style={{ width: '100%', padding: '0.75rem' }}
                              >
                                {isProcessingCheckout ? 'Gerando link seguro...' : 'Gerar Fatura / Link de Pagamento'}
                              </button>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                <a
                                  href={invoiceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-primary"
                                  style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                  <span>Ir para Faturamento Asaas</span>
                                  <ExternalLink size={14} />
                                </a>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  Uma nova guia foi aberta. Caso não tenha visto, clique no botão acima para abrir a fatura.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                      <button
                        onClick={handleSimulateQuickBypass}
                        className="btn btn-outline"
                        style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                        disabled={isProcessingCheckout}
                      >
                        Bypass Rápido (Sandbox)
                      </button>
                      <button onClick={() => setCheckoutModalOpen(false)} className="btn btn-outline" disabled={isProcessingCheckout}>
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATION ALERTS */}
          {activeSubTab === 'alerts' && (
            <div className="card settings-panel-card">
              <h2 className="settings-panel-title">Notificações &amp; Alertas</h2>
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

        /* Asaas steps integration guide */
        .asaas-guide-section {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
        }
        .asaas-steps-layout {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }
        .asaas-step-card {
          display: flex;
          gap: 12px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.875rem;
        }
        .step-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: var(--color-primary);
          color: white;
          font-weight: 700;
          font-size: 0.775rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-body strong {
          display: block;
          font-size: 0.8rem;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .step-body p {
          font-size: 0.725rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
        }
        .step-body a {
          color: var(--color-primary);
          text-decoration: underline;
        }

        /* Checkout Simulator */
        .checkout-summary-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.875rem;
        }
        .payment-method-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }
        .payment-method-tabs button {
          padding: 0.5rem;
          font-size: 0.775rem;
          font-weight: 600;
          background-color: var(--bg-app);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .payment-method-tabs button.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        .payment-method-screen {
          min-height: 160px;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .settings-container-grid {
            grid-template-columns: 1fr;
          }
          .plans-compare-grid {
            grid-template-columns: 1fr;
          }
          .asaas-steps-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
