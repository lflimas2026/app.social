import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Post } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Trash2,
  Play,
  Pause,
  Download,
  Copy,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const Dashboard = () => {
  const {
    posts,
    campaigns,
    toggleCampaignStatus,
    deleteCampaign,
    deletePost,
    addPost,
    searchQuery,
    setActiveTab,
    addToast,
    connectedAccounts,
    currentUser
  } = useApp();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month'>('week');

  // DYNAMIC COUNTS
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const activeCampsCount = campaigns.filter((c) => c.status === 'active').length;
  const totalSpent = campaigns.reduce((acc, c) => acc + c.spent, 0);
  const totalReach = posts.reduce((acc, p) => acc + p.reach, 0) + campaigns.reduce((acc, c) => acc + c.reach, 0);

  // STATS CARDS
  const stats = [
    {
      label: 'Posts Agendados',
      value: scheduledCount,
      change: '+5',
      trend: 'up',
      period: 'esta semana',
      icon: CalendarIcon,
      color: 'var(--color-primary)'
    },
    {
      label: 'Gasto em Anúncios',
      value: `R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+12%',
      trend: 'up',
      period: 'este mês',
      icon: DollarSign,
      color: 'var(--color-secondary)'
    },
    {
      label: 'Campanhas Ativas',
      value: activeCampsCount,
      change: '+1',
      trend: 'up',
      period: 'esta semana',
      icon: Target,
      color: 'var(--color-success)'
    },
    {
      label: 'Alcance Total',
      value: totalReach.toLocaleString('pt-BR'),
      change: '-3%',
      trend: 'down',
      period: 'últimos 7d',
      icon: Users,
      color: 'var(--color-warning)'
    }
  ];

  // CHART 1: WEEKLY POSTS TREND (MOCKED)
  const weeklyData = [
    { name: 'Seg', impressoes: 1200, alcance: 890, engajamento: 145 },
    { name: 'Ter', impressoes: 1890, alcance: 1200, engajamento: 210 },
    { name: 'Qua', impressoes: 2400, alcance: 1900, engajamento: 320 },
    { name: 'Qui', impressoes: 1780, alcance: 1400, engajamento: 190 },
    { name: 'Sex', impressoes: 2900, alcance: 2300, engajamento: 410 },
    { name: 'Sab', impressoes: 3400, alcance: 2800, engajamento: 520 },
    { name: 'Dom', impressoes: 3100, alcance: 2500, engajamento: 480 },
  ];

  // CHART 2: CAMPAIGN ROAS (COMPUTED DYNAMICALLY)
  const roasData = campaigns.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
    gasto: c.spent,
    retorno: parseFloat((c.spent * c.roas).toFixed(2)),
    roas: c.roas
  }));

  // SEARCH FILTER APPLIED
  const filteredPosts = posts
    .filter((p) => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => {
      if (selectedAccountId === 'all') return true;
      const acc = connectedAccounts.find(a => a.id === selectedAccountId);
      if (!acc) return true;
      return p.platforms.includes(acc.platform);
    })
    .slice(0, 5);

  const filteredCampaigns = campaigns
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const handleDuplicatePost = (post: Post) => {
    addPost({
      content: `${post.content} (Cópia)`,
      media_urls: post.media_urls,
      hashtags: post.hashtags,
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // set to tomorrow
      platforms: post.platforms,
      status: 'draft',
      preview_text: post.preview_text
    });
    addToast('Post duplicado como rascunho para amanhã!', 'success');
  };

  const handleExportReport = () => {
    addToast('Relatório PDF gerado! Download iniciado...', 'success');
  };

  return (
    <div className="dashboard-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Visão geral de hoje • runtime.ia.br
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rede:</label>
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="input-field">
              <option value="all">Todas</option>
              {connectedAccounts.slice(0, currentUser?.features?.socialNetworksLimit ?? 1).map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.account_name} · {acc.platform}</option>
              ))}
            </select>
            {connectedAccounts.length > (currentUser?.features?.socialNetworksLimit ?? 1) && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginLeft: '8px' }}>Seu plano permite ver até {currentUser?.features?.socialNetworksLimit} rede(s)</span>
            )}
          </div>
          <div className="period-tabs">
            <button
              onClick={() => setPeriodFilter('today')}
              className={periodFilter === 'today' ? 'active' : ''}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={periodFilter === 'week' ? 'active' : ''}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={periodFilter === 'month' ? 'active' : ''}
            >
              Mês
            </button>
          </div>

          <button onClick={handleExportReport} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <Download size={14} />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card stat-card">
              <div className="stat-header">
                <span className="stat-label">{stat.label}</span>
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-footer">
                <span className={`stat-trend ${stat.trend}`}>
                  {stat.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {stat.change}
                </span>
                <span className="stat-period">vs {stat.period}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHARTS ROW */}
      <div className="charts-grid">
        {/* CHART 1: WEEKLY POSTS */}
        <div className="card chart-card">
          <h3 className="chart-title">Performance dos Seus Posts</h3>
          <p className="chart-subtitle">Impressões, alcance e engajamento nos últimos 7 dias</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Line type="monotone" dataKey="impressoes" name="Impressões" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="alcance" name="Alcance" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="engajamento" name="Engajamento" stroke="var(--color-success)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: ROAS */}
        <div className="card chart-card">
          <h3 className="chart-title">Return on Ad Spend (ROAS)</h3>
          <p className="chart-subtitle">Gasto vs Faturamento estimado por campanha activa</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roasData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  formatter={(value: any, name: any) => [`R$ ${value}`, name]}
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Bar dataKey="gasto" name="Investimento" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="retorno" name="Retorno" fill="var(--color-success)" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABLES ROW */}
      <div className="tables-grid">
        {/* POSTS TABLE */}
        <div className="card table-card">
          <div className="flex-between card-header">
            <div>
              <h3 className="chart-title" style={{ margin: 0 }}>Últimos Posts</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Postagens recentes e agendadas</p>
            </div>
            <button onClick={() => setActiveTab('calendar')} className="btn btn-outline btn-sm">
              <Plus size={12} />
              <span>Ver Calendário</span>
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Redes</th>
                  <th>Preview</th>
                  <th>Imp.</th>
                  <th>Eng. %</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Nenhum post localizado.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td style={{ fontSize: '0.8rem' }}>
                        {new Date(post.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {post.platforms.map((platform) => (
                            <span key={platform} className={`platform-dot ${platform}`} title={platform}>
                              {platform[0].toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.content}>
                        {post.content}
                      </td>
                      <td>{post.status === 'published' ? post.impressions.toLocaleString() : '-'}</td>
                      <td>{post.status === 'published' ? `${post.engagement_rate}%` : '-'}</td>
                      <td>
                        <span className={`badge badge-${
                          post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'primary' : 'muted'
                        }`}>
                          {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDuplicatePost(post)} className="action-btn" title="Duplicar">
                            <Copy size={13} />
                          </button>
                          <button onClick={() => deletePost(post.id)} className="action-btn delete" title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CAMPAIGNS TABLE */}
        <div className="card table-card">
          <div className="flex-between card-header">
            <div>
              <h3 className="chart-title" style={{ margin: 0 }}>Campanhas Ativas</h3>
              <p className="chart-subtitle" style={{ margin: 0 }}>Anúncios em veiculação no momento</p>
            </div>
            <button onClick={() => setActiveTab('ads')} className="btn btn-outline btn-sm">
              <span>Gerenciar</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Plataforma</th>
                  <th>Orçamento</th>
                  <th>Gasto</th>
                  <th>ROAS</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Nenhuma campanha ativa no momento.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => (
                    <tr key={camp.id}>
                      <td style={{ fontWeight: 500, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={camp.name}>
                        {camp.name}
                      </td>
                      <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
                        {camp.platform === 'meta_ads' ? 'Meta Ads' : 'TikTok Ads'}
                      </td>
                      <td>R$ {camp.budget}</td>
                      <td>R$ {parseFloat(camp.spent.toFixed(2))}</td>
                      <td style={{ fontWeight: 600, color: camp.roas >= 2 ? 'var(--color-success)' : camp.roas >= 1.2 ? 'var(--text-primary)' : 'var(--color-error)' }}>
                        {camp.roas}x
                      </td>
                      <td>
                        <span className={`badge badge-${
                          camp.status === 'active' ? 'success' : camp.status === 'completed' ? 'primary' : camp.status === 'paused' ? 'warning' : 'error'
                        }`}>
                          {camp.status === 'active' ? 'Ativo' : camp.status === 'completed' ? 'Concluído' : camp.status === 'paused' ? 'Pausado' : 'Falhou'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => toggleCampaignStatus(camp.id)}
                            className={`action-btn ${camp.status === 'active' ? 'pause' : 'play'}`}
                            title={camp.status === 'active' ? 'Pausar' : 'Retomar'}
                            disabled={camp.status === 'completed' || camp.status === 'failed'}
                          >
                            {camp.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                          <button onClick={() => deleteCampaign(camp.id)} className="action-btn delete" title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .header-row {
          margin-bottom: 1.75rem;
        }

        .period-tabs {
          display: flex;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .period-tabs button {
          border: none;
          background: none;
          padding: 0.375rem 0.875rem;
          font-size: 0.775rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .period-tabs button:hover {
          color: var(--text-primary);
        }

        .period-tabs button.active {
          background-color: var(--color-primary);
          color: #FFFFFF;
        }

        /* STATS GRID */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          padding: 1.25rem;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .stat-footer {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 2px;
          font-weight: 600;
        }

        .stat-trend.up {
          color: var(--color-success);
        }

        .stat-trend.down {
          color: var(--color-error);
        }

        .stat-period {
          color: var(--text-secondary);
        }

        /* CHARTS GRID */
        .charts-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .chart-card {
          display: flex;
          flex-direction: column;
        }

        .chart-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .chart-subtitle {
          font-size: 0.775rem;
          color: var(--text-secondary);
          margin-top: 2px;
          margin-bottom: 1.25rem;
        }

        .chart-container {
          flex-grow: 1;
          min-height: 240px;
        }

        /* TABLES GRID */
        .tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .table-card {
          padding: 1.25rem;
        }

        .card-header {
          margin-bottom: 1.25rem;
        }

        /* Platforms dots */
        .platform-dot {
          width: 18px;
          height: 18px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .platform-dot.instagram {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .platform-dot.facebook {
          background-color: #1877F2;
        }

        .platform-dot.tiktok {
          background-color: #000000;
          border: 1px solid #ffffff;
        }

        /* Action buttons in tables */
        .action-btn {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .action-btn:hover:not(:disabled) {
          color: var(--text-primary);
          background-color: var(--hover-bg);
          border-color: var(--text-secondary);
        }

        .action-btn.delete:hover {
          color: var(--color-error);
          background-color: rgba(239, 68, 68, 0.08);
          border-color: var(--color-error);
        }

        .action-btn.play:hover {
          color: var(--color-success);
          background-color: rgba(34, 197, 94, 0.08);
          border-color: var(--color-success);
        }

        .action-btn.pause:hover {
          color: var(--color-warning);
          background-color: rgba(234, 179, 8, 0.08);
          border-color: var(--color-warning);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .charts-grid, .tables-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
