import React, { useState, useEffect } from 'react';
import { useApp, getDefaultFeaturesForPlan } from '../context/AppContext';
import {
  Users,
  DollarSign,
  Plus,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Settings,
  Sparkles,
  BarChart3,
  Video
} from 'lucide-react';

export const Admin = () => {
  const { allUsers, adminCreateCompany, adminUpdateCompanyFeatures, addToast, getFinancialMetrics } = useApp();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for manual creation
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newPlan, setNewPlan] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');

  // Resource Editor Modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editPlan, setEditPlan] = useState<'free' | 'starter' | 'professional' | 'enterprise'>('free');
  const [editIsBlocked, setEditIsBlocked] = useState(false);
  const [editSocialLimit, setEditSocialLimit] = useState(3);
  const [editSchedulingLimit, setEditSchedulingLimit] = useState(10);
  const [editAutoPosting, setEditAutoPosting] = useState(true);
  const [editAdsManager, setEditAdsManager] = useState(true);
  const [editAiOpt, setEditAiOpt] = useState(true);
  const [editGemini, setEditGemini] = useState(true);
  const [editExportableReports, setEditExportableReports] = useState(true);

  // Financial KPIs states
  const [financialMetrics, setFinancialMetrics] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoadingMetrics(true);
      const res = await getFinancialMetrics();
      if (res) {
        setFinancialMetrics(res);
      }
      setIsLoadingMetrics(false);
    };
    fetchMetrics();
  }, []);

  // Stats calculation
  const totalCompanies = allUsers.filter(u => !u.isAdmin).length;
  const blockedCompanies = allUsers.filter(u => u.isBlocked).length;
  const activeCompanies = totalCompanies - blockedCompanies;
  
  const monthlyRevenue = allUsers
    .filter(u => !u.isBlocked && !u.isAdmin)
    .reduce((acc, u) => {
      if (u.plan === 'starter') return acc + 99;
      if (u.plan === 'professional') return acc + 149;
      if (u.plan === 'enterprise') return acc + 499;
      return acc;
    }, 0);

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newFirstName || !newCompanyName) {
      addToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }
    adminCreateCompany(newEmail, newFirstName, newLastName, newCompanyName, newPlan);
    
    // Reset Form
    setNewEmail('');
    setNewFirstName('');
    setNewLastName('');
    setNewCompanyName('');
    setNewPlan('free');
  };

  const handleOpenEditor = (user: any) => {
    setEditingUser(user);
    setEditPlan(user.plan);
    setEditIsBlocked(!!user.isBlocked);
    setEditSocialLimit(user.features?.socialNetworksLimit ?? 3);
    setEditSchedulingLimit(user.features?.schedulingsLimit ?? 10);
    setEditAutoPosting(user.features?.autoPosting ?? true);
    setEditAdsManager(user.features?.adsManager ?? true);
    setEditAiOpt(user.features?.aiOptimization ?? true);
    setEditGemini(user.features?.geminiIntegration ?? true);
    setEditExportableReports(user.features?.exportableReports ?? true);
  };

  // Sync editor fields with selected plan when plan changes in the dropdown (defaults helper)
  const handlePlanChange = (plan: 'free' | 'starter' | 'professional' | 'enterprise') => {
    setEditPlan(plan);
    const defaults = getDefaultFeaturesForPlan(plan);
    setEditSocialLimit(defaults.socialNetworksLimit);
    setEditSchedulingLimit(defaults.schedulingsLimit);
    setEditAutoPosting(defaults.autoPosting);
    setEditAdsManager(defaults.adsManager);
    setEditAiOpt(defaults.aiOptimization);
    setEditGemini(defaults.geminiIntegration);
    setEditExportableReports(defaults.exportableReports);
  };

  const handleSaveFeatures = () => {
    if (!editingUser) return;
    
    adminUpdateCompanyFeatures(editingUser.id, {
      plan: editPlan,
      isBlocked: editIsBlocked,
      features: {
        socialNetworksLimit: Number(editSocialLimit),
        schedulingsLimit: Number(editSchedulingLimit),
        autoPosting: editAutoPosting,
        adsManager: editAdsManager,
        aiOptimization: editAiOpt,
        geminiIntegration: editGemini,
        exportableReports: editExportableReports
      }
    });

    setEditingUser(null);
  };

  const filteredUsers = allUsers
    .filter(u => !u.isAdmin)
    .filter(u => 
      u.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="admin-page animate-fade-in">
      {/* HEADER */}
      <div className="flex-between header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={26} color="var(--color-primary)" />
            Painel do Administrador
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Gerencie empresas, planos e controle o acesso granular de recursos
          </p>
        </div>
      </div>

        {/* METRICS ROW */}
        <div className="admin-stats-grid">
          <div className="card admin-stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)' }}>
              <Users size={20} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Total de Empresas</span>
              <span className="stat-value">{totalCompanies}</span>
            </div>
          </div>

          {financialMetrics && (
            <>
              <div className="card admin-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                  <BarChart3 size={20} />
                </div>
                <div className="stat-meta">
                  <span className="stat-label">MRR (Receita Mensal Recorrente)</span>
                  <span className="stat-value">R$ {financialMetrics.mrr?.toLocaleString('pt-BR') ?? '—'}</span>
                </div>
              </div>

              <div className="card admin-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                  <DollarSign size={20} />
                </div>
                <div className="stat-meta">
                  <span className="stat-label">ARR (Receita Anual Recorrente)</span>
                  <span className="stat-value">R$ {financialMetrics.arr?.toLocaleString('pt-BR') ?? '—'}</span>
                </div>
              </div>

              <div className="card admin-stat-card">
                <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)' }}>
                  <AlertTriangle size={20} />
                </div>
                <div className="stat-meta">
                  <span className="stat-label">Churn (%)</span>
                  <span className="stat-value">{financialMetrics.churn != null ? `${financialMetrics.churn}%` : '—'}</span>
                </div>
              </div>
            </>
          )}

          {/* Fallback simulated revenue card when metrics not loaded */}
          {!financialMetrics && (
            <div className="card admin-stat-card">
              <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                <DollarSign size={20} />
              </div>
              <div className="stat-meta">
                <span className="stat-label">Faturamento Simulado</span>
                <span className="stat-value">R$ {monthlyRevenue}/mês</span>
              </div>
            </div>
          )}

          <div className="card admin-stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={20} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Empresas Bloqueadas</span>
              <span className="stat-value">{blockedCompanies}</span>
            </div>
          </div>

          <div className="card admin-stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-secondary)' }}>
              <CheckCircle size={20} />
            </div>
            <div className="stat-meta">
              <span className="stat-label">Empresas Ativas</span>
              <span className="stat-value">{activeCompanies}</span>
            </div>
          </div>
        </div>
        

      {/* MAIN TWO COLUMN CONTENT */}
      <div className="admin-content-layout">
        {/* LEFT COLUMN: MANUAL ADD COMPANY */}
        <div className="card admin-form-card">
          <h3 className="section-title">
            <Plus size={16} />
            Incluir Nova Empresa Manualmente
          </h3>
          <p className="section-desc">Adicione empresas diretamente à plataforma sem passar pelo fluxo de checkout</p>

          <form onSubmit={handleCreateCompany} className="admin-form">
            <div className="form-group">
              <label>Nome do Responsável *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Ex: Fernando"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Sobrenome</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Lima"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Nome da Empresa *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Ex: Runtime IA"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>E-mail *</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="Ex: contato@empresa.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Plano Inicial</label>
              <select
                className="input-field"
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as any)}
                style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                <option value="free">Plano Free (Grátis)</option>
                <option value="starter">Plano Starter (R$ 99/mês)</option>
                <option value="professional">Plano Professional (R$ 149/mês)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }}>
              <Plus size={16} />
              Criar Empresa
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: COMPANIES LIST */}
        <div className="card admin-list-card">
          <div className="flex-between list-header" style={{ marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Empresas Cadastradas</h3>
            
            <div className="admin-search-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar empresa, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>E-mail</th>
                  <th>Responsável</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Nenhuma empresa cadastrada ou encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.company_name}</td>
                      <td>{user.email}</td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>
                        <span className={`badge badge-${
                          user.plan === 'professional' ? 'success' : user.plan === 'starter' ? 'primary' : 'muted'
                        }`}>
                          {user.plan.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${user.isBlocked ? 'danger' : 'success'}`}>
                          {user.isBlocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenEditor(user)}
                          className="btn btn-outline btn-sm flex-center"
                          style={{ gap: '4px', padding: '4px 8px' }}
                        >
                          <Settings size={12} />
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FEATURE CONTROLLERS MODAL */}
      {editingUser && (
        <div className="overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Gerenciar Recursos: {editingUser.company_name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Defina limites personalizados e bloqueie ou ative funcionalidades específicas
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Plan dropdown & block status */}
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Plano da Empresa</label>
                  <select
                    className="input-field"
                    value={editPlan}
                    onChange={(e) => handlePlanChange(e.target.value as any)}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status de Bloqueio Geral</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '1rem' }}>
                    <label className="checkbox-label" style={{ fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editIsBlocked}
                        onChange={(e) => setEditIsBlocked(e.target.checked)}
                      />
                      <span style={{ color: editIsBlocked ? 'var(--color-error)' : 'var(--color-success)' }}>
                        {editIsBlocked ? 'Bloquear Acesso' : 'Acesso Permitido'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

              {/* Resource Numerical Limits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Limites Numéricos
                </h4>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Limite de Redes Sociais Conectadas</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="input-field"
                      value={editSocialLimit}
                      onChange={(e) => setEditSocialLimit(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Limite de Agendamentos Mensais</label>
                    <input
                      type="number"
                      min={0}
                      className="input-field"
                      value={editSchedulingLimit}
                      onChange={(e) => setEditSchedulingLimit(Number(e.target.value))}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Use um número alto (como 99999) para ilimitados.</span>
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

              {/* Resource Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Acesso de Módulos & Funcionalidades
                </h4>
                
                <div className="admin-toggles-list">
                  <label className="admin-toggle-item">
                    <div className="toggle-meta">
                      <span className="toggle-title flex-center" style={{ gap: '6px' }}><Video size={14} /> Auto-posting Automático</span>
                      <span className="toggle-desc">Publicação agendada automática em segundo plano</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editAutoPosting}
                      onChange={(e) => setEditAutoPosting(e.target.checked)}
                      className="toggle-checkbox"
                    />
                  </label>

                  <label className="admin-toggle-item">
                    <div className="toggle-meta">
                      <span className="toggle-title flex-center" style={{ gap: '6px' }}><DollarSign size={14} /> Gerenciador de Anúncios</span>
                      <span className="toggle-desc">Integração de campanhas pagas do Meta Ads/TikTok Ads</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editAdsManager}
                      onChange={(e) => setEditAdsManager(e.target.checked)}
                      className="toggle-checkbox"
                    />
                  </label>

                  <label className="admin-toggle-item">
                    <div className="toggle-meta">
                      <span className="toggle-title flex-center" style={{ gap: '6px' }}><Sparkles size={14} /> IA de Otimização Básica</span>
                      <span className="toggle-desc">Sugestões de hashtags e análise preditiva básica</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editAiOpt}
                      onChange={(e) => setEditAiOpt(e.target.checked)}
                      className="toggle-checkbox"
                    />
                  </label>

                  <label className="admin-toggle-item">
                    <div className="toggle-meta">
                      <span className="toggle-title flex-center" style={{ gap: '6px' }}><Sparkles size={14} style={{ color: 'var(--color-primary)' }} /> Integração Gemini 2.5 Flash</span>
                      <span className="toggle-desc">Escritor de legendas inteligente premium com IA da Google</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editGemini}
                      onChange={(e) => setEditGemini(e.target.checked)}
                      className="toggle-checkbox"
                    />
                  </label>

                  <label className="admin-toggle-item">
                    <div className="toggle-meta">
                      <span className="toggle-title flex-center" style={{ gap: '6px' }}><BarChart3 size={14} /> Relatórios Exportáveis PDF/CSV</span>
                      <span className="toggle-desc">Permite exportar PDFs analíticos e baixar planilhas</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editExportableReports}
                      onChange={(e) => setEditExportableReports(e.target.checked)}
                      className="toggle-checkbox"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setEditingUser(null)} className="btn btn-outline">
                Cancelar
              </button>
              <button onClick={handleSaveFeatures} className="btn btn-primary">
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .admin-stat-card {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          gap: 1rem;
        }

        .stat-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-meta {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .admin-content-layout {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 1.25rem;
        }

        .section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .section-desc {
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin: 0 0 1.25rem 0;
          line-height: 1.4;
        }

        .admin-form-card {
          padding: 1.5rem;
          height: fit-content;
        }

        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .admin-list-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .admin-search-wrapper {
          position: relative;
          width: 220px;
        }

        .admin-search-wrapper .search-icon {
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .admin-search-wrapper input {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.775rem;
          color: var(--text-primary);
          padding: 4px 8px 4px 28px;
          width: 100%;
        }

        /* Toggles layout inside modal */
        .admin-toggles-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .admin-toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.625rem 0.75rem;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }

        .admin-toggle-item:hover {
          border-color: var(--text-secondary);
        }

        .toggle-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-title {
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .toggle-desc {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .toggle-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        @media (max-width: 990px) {
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .admin-content-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
