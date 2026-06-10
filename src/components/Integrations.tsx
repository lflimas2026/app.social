import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Video,
  Target,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  X
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook } from './SocialIcons';

export const Integrations = () => {
  const { currentUser, connectedAccounts, connectAccount, disconnectAccount, forceSync, addToast } = useApp();
  const [syncing, setSyncing] = useState(false);

  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [accountNameInput, setAccountNameInput] = useState('');

  const platformsList = [
    { id: 'instagram', name: 'Instagram Feed', icon: Instagram, color: '#e1306c', desc: 'Agende postagens orgânicas de imagens e vídeos.' },
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: '#1877F2', desc: 'Publique atualizações na sua página institucional.' },
    { id: 'tiktok', name: 'TikTok Videos', icon: Video, color: '#000000', desc: 'Poste vídeos curtos diretamente no feed do TikTok.' },
    { id: 'meta_ads', name: 'Meta Ads Manager', icon: Target, color: '#0080FF', desc: 'Sincronize campanhas, orçamentos e métricas de ROAS.' },
    { id: 'tiktok_ads', name: 'TikTok Ads', icon: Target, color: '#EE1D52', desc: 'Monitore cliques e conversões de anúncios em vídeo.' },
  ];

  const handleForceSync = async () => {
    setSyncing(true);
    await forceSync();
    setSyncing(false);
  };

  const handleOpenConnect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setAccountNameInput('');
    setConnectModalOpen(true);
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNameInput.trim()) return;

    // Plan Limit Check for Social Networks
    const isSocialPlatform = selectedPlatform === 'instagram' || selectedPlatform === 'facebook' || selectedPlatform === 'tiktok';
    if (isSocialPlatform) {
      const connectedSocials = connectedAccounts.filter(
        (c) => c.platform === 'instagram' || c.platform === 'facebook' || c.platform === 'tiktok'
      );
      
      const limit = currentUser?.features?.socialNetworksLimit ?? 1;
      if (connectedSocials.length >= limit) {
        addToast(`Limite atingido! Seu plano atual permite apenas ${limit} rede(s) social(ais) conectada(s). Faça upgrade nas Configurações!`, 'warning');
        setConnectModalOpen(false);
        return;
      }
    }

    connectAccount(selectedPlatform, accountNameInput.trim());
    setConnectModalOpen(false);
  };

  return (
    <div className="integrations-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Integrações</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Conecte suas redes sociais e contas de anúncio para sincronizar dados
          </p>
        </div>
      </div>

      {/* PLATFORMS GRID */}
      <div className="integrations-grid">
        {platformsList.map((platform) => {
          // Find if this platform is currently in connectedAccounts
          const connection = connectedAccounts.find((c) => c.platform === platform.id);
          const PlatformIcon = platform.icon;

          return (
            <div key={platform.id} className={`card integration-card ${connection ? 'connected' : ''}`}>
              <div className="card-top-row">
                <div className="platform-logo-box" style={{ backgroundColor: `${platform.color}12`, color: platform.color }}>
                  <PlatformIcon size={24} />
                </div>
                <div className="platform-meta">
                  <h3 className="platform-title">{platform.name}</h3>
                  <p className="platform-desc">{platform.desc}</p>
                </div>
              </div>

              <div className="card-middle-row">
                {connection ? (
                  connection.is_active ? (
                    <div className="status-indicator success">
                      <CheckCircle size={14} />
                      <div className="status-details">
                        <span className="status-text">Conectado</span>
                        <span className="status-account-name">{connection.account_name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="status-indicator error">
                      <AlertTriangle size={14} />
                      <div className="status-details">
                        <span className="status-text">Erro de Token</span>
                        <span className="status-account-name">Expira em breve / Reautenticar</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="status-indicator inactive">
                    <HelpCircle size={14} />
                    <div className="status-details">
                      <span className="status-text">Não conectado</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-bottom-row">
                {connection ? (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      onClick={() => handleOpenConnect(platform.id)}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                    >
                      <RefreshCw size={12} />
                      Reconectar
                    </button>
                    <button
                      onClick={() => disconnectAccount(connection.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--color-error)' }}
                      title="Desconectar"
                    >
                      <Unlink size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if ((platform.id === 'meta_ads' || platform.id === 'tiktok_ads') && !currentUser?.features?.adsManager) {
                        addToast('O módulo de Gerenciamento de Anúncios está desativado no seu plano. Faça upgrade!', 'warning');
                        return;
                      }
                      handleOpenConnect(platform.id);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ 
                      width: '100%', 
                      opacity: ((platform.id === 'meta_ads' || platform.id === 'tiktok_ads') && !currentUser?.features?.adsManager) ? 0.6 : 1 
                    }}
                  >
                    <Link2 size={12} />
                    {((platform.id === 'meta_ads' || platform.id === 'tiktok_ads') && !currentUser?.features?.adsManager) ? 'Premium (Bloqueado)' : 'Conectar Conta'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SYNC HISTORY SECTION */}
      <div className="card sync-history-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="platform-title" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
          Histórico & Cron de Sincronização
        </h3>
        
        <div className="sync-history-layout">
          <div className="sync-info-item">
            <Clock size={16} color="var(--text-secondary)" />
            <div className="sync-info-text">
              <span className="sync-label">Última Sincronização Completa</span>
              <span className="sync-val">10 de junho de 2026, às 14:32</span>
            </div>
          </div>

          <div className="sync-info-item">
            <Clock size={16} color="var(--text-secondary)" />
            <div className="sync-info-text">
              <span className="sync-label">Agendamento Automático</span>
              <span className="sync-val">4x ao dia (Próxima em ~2 horas)</span>
            </div>
          </div>

          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="btn btn-outline force-sync-btn"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Forçar Sincronização Agora'}</span>
          </button>
        </div>
      </div>

      {/* CONNECT ACCOUNT DIALOG */}
      {connectModalOpen && (
        <div className="overlay">
          <form onSubmit={handleConnectSubmit} className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Conectar ao {selectedPlatform?.toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                Ao conectar a sua conta, o Social App receberá autorização de leitura de dados de perfil, feed e relatórios de anúncios pagos.
              </p>

              <div className="form-group">
                <label>Identificação da Conta / Perfil</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder={selectedPlatform === 'instagram' ? 'Ex: @minhaconta' : 'Ex: Nome da Conta'}
                  value={accountNameInput}
                  onChange={(e) => setAccountNameInput(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setConnectModalOpen(false)} className="btn btn-outline">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Confirmar Conexão
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        .integration-card {
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
          justify-content: space-between;
          height: 220px;
        }

        .card-top-row {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .platform-logo-box {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .platform-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .platform-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .platform-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .card-middle-row {
          margin: 1rem 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.775rem;
        }

        .status-indicator.success { color: var(--color-success); }
        .status-indicator.error { color: var(--color-error); }
        .status-indicator.inactive { color: var(--text-muted); }

        .status-details {
          display: flex;
          flex-direction: column;
        }

        .status-text {
          font-weight: 600;
        }

        .status-account-name {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        /* SYNC PANEL */
        .sync-history-layout {
          display: flex;
          align-items: center;
          gap: 2.5rem;
          flex-wrap: wrap;
        }

        .sync-info-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sync-info-text {
          display: flex;
          flex-direction: column;
        }

        .sync-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sync-val {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 1px;
        }

        .force-sync-btn {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 990px) {
          .integrations-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .force-sync-btn {
            margin-left: 0;
            width: 100%;
          }
        }
        @media (max-width: 650px) {
          .integrations-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
