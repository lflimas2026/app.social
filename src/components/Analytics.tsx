import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Download,
  Share2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export const Analytics = () => {
  const { posts, campaigns, addToast } = useApp();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedNetwork, setSelectedNetwork] = useState<'all' | 'instagram' | 'facebook' | 'tiktok'>('all');

  // AGGREGATE POST METRICS
  const publishedPosts = posts.filter((p) => p.status === 'published');
  
  const totalImpressions = publishedPosts.reduce((acc, p) => acc + p.impressions, 0);
  const totalReach = publishedPosts.reduce((acc, p) => acc + p.reach, 0);
  const totalEngagement = publishedPosts.reduce((acc, p) => acc + (p.likes + p.comments + p.shares + p.saves), 0);
  const avgEngagementRate = publishedPosts.length > 0 
    ? parseFloat((publishedPosts.reduce((acc, p) => acc + p.engagement_rate, 0) / publishedPosts.length).toFixed(2))
    : 0;

  // SUMMARY CARDS
  const summaries = [
    { label: 'Impressões', value: totalImpressions.toLocaleString(), change: '+12.4%', trend: 'up' },
    { label: 'Alcance', value: totalReach.toLocaleString(), change: '+8.2%', trend: 'up' },
    { label: 'Engajamento', value: totalEngagement.toLocaleString(), change: '+15.7%', trend: 'up' },
    { label: 'Taxa de Engaj.', value: `${avgEngagementRate}%`, change: '+0.8%', trend: 'up' },
  ];

  // CHART 1: STACKED AREA (IMPRESSIONS VS REACH TREND OVER 30 DAYS)
  const stackedTrendData = [
    { day: '11/05', reach: 4120, impressions: 5820 },
    { day: '13/05', reach: 5200, impressions: 7100 },
    { day: '15/05', reach: 4800, impressions: 6900 },
    { day: '17/05', reach: 6100, impressions: 8900 },
    { day: '19/05', reach: 7200, impressions: 9800 },
    { day: '21/05', reach: 6900, impressions: 9300 },
    { day: '23/05', reach: 8100, impressions: 11200 },
    { day: '25/05', reach: 9500, impressions: 13400 },
    { day: '27/05', reach: 11000, impressions: 14800 },
    { day: '29/05', reach: 10200, impressions: 13900 },
    { day: '31/05', reach: 12500, impressions: 16900 },
    { day: '02/06', reach: 14200, impressions: 19100 },
    { day: '04/06', reach: 13100, impressions: 17800 },
    { day: '06/06', reach: 15400, impressions: 21200 },
    { day: '08/06', reach: 18900, impressions: 25400 },
    { day: '10/06', reach: totalReach > 0 ? totalReach : 20500, impressions: totalImpressions > 0 ? totalImpressions : 28200 },
  ];

  // CHART 2: PIE CHART (ENGAGEMENT DISTRIBUTION BY NETWORK)
  const pieData = [
    { name: 'Instagram', value: 6200, color: 'var(--color-primary)' },
    { name: 'Facebook', value: 4100, color: 'var(--color-secondary)' },
    { name: 'TikTok', value: 2100, color: 'var(--color-success)' },
  ];

  // CHART 3: ENGAGEMENT BREAKDOWN (HORIZONTAL BARS)
  const breakdownData = [
    { name: 'Likes', valor: publishedPosts.reduce((acc, p) => acc + p.likes, 0) || 1234 },
    { name: 'Cliques', valor: campaigns.reduce((acc, c) => acc + c.clicks, 0) || 5430 },
    { name: 'Coment.', valor: publishedPosts.reduce((acc, p) => acc + p.comments, 0) || 294 },
    { name: 'Salvos', valor: publishedPosts.reduce((acc, p) => acc + p.saves, 0) || 152 },
    { name: 'Partilh.', valor: publishedPosts.reduce((acc, p) => acc + p.shares, 0) || 120 },
  ];

  // RANKINGS: Top performing posts
  const topPosts = [...publishedPosts]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  const handleExportPDF = () => {
    addToast('Preparando PDF para download...', 'info');
    setTimeout(() => {
      addToast('Relatório analítico exportado com sucesso!', 'success');
    }, 1200);
  };

  const handleShareReport = () => {
    addToast('Link público do relatório copiado para a área de transferência!', 'success');
  };

  return (
    <div className="analytics-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Métricas & Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Acompanhe o engajamento orgânico e retorno pago unificados
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Platform Network Filter selector */}
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value as any)}
            className="analytics-select-filter"
          >
            <option value="all">Todas as Redes</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
          </select>

          {/* Date Selector */}
          <div className="date-toggle-tabs">
            <button onClick={() => setDateRange('7d')} className={dateRange === '7d' ? 'active' : ''}>7D</button>
            <button onClick={() => setDateRange('30d')} className={dateRange === '30d' ? 'active' : ''}>30D</button>
            <button onClick={() => setDateRange('90d')} className={dateRange === '90d' ? 'active' : ''}>90D</button>
          </div>

          <button onClick={handleShareReport} className="btn btn-outline" style={{ padding: '0.5rem' }} title="Compartilhar Link">
            <Share2 size={15} />
          </button>
          <button onClick={handleExportPDF} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <Download size={14} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* SUMMARY PERIOD ROW */}
      <div className="analytics-summaries-grid">
        {summaries.map((s, idx) => (
          <div key={idx} className="card summary-kpi-card">
            <span className="summary-kpi-label">{s.label}</span>
            <div className="summary-kpi-row">
              <span className="summary-kpi-value">{s.value}</span>
              <span className="summary-kpi-change up">
                <TrendingUp size={12} />
                {s.change}
              </span>
            </div>
            <span className="summary-kpi-period">vs período anterior</span>
          </div>
        ))}
      </div>

      {/* CHARTS GRID LAYER */}
      <div className="analytics-charts-grid">
        {/* CHART 1: STACKED AREA CHART */}
        <div className="card analytics-chart-card">
          <h3 className="chart-title">Crescimento de Alcance e Impressões</h3>
          <p className="chart-subtitle">Análise cumulativa do desempenho orgânico das publicações</p>
          <div className="chart-container" style={{ minHeight: '260px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stackedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Area type="monotone" dataKey="impressions" name="Impressões" stroke="var(--color-secondary)" fillOpacity={1} fill="url(#colorImp)" strokeWidth={2} />
                <Area type="monotone" dataKey="reach" name="Alcance" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: PIE/DONUT CHART */}
        <div className="card analytics-chart-card">
          <h3 className="chart-title">Engajamento por Canal</h3>
          <p className="chart-subtitle">Distribuição das interações por rede conectada</p>
          <div className="donut-chart-container flex-between">
            <div style={{ width: '60%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} interações`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="donut-legend">
              {pieData.map((item, idx) => (
                <div key={idx} className="donut-legend-item">
                  <span className="donut-bullet" style={{ backgroundColor: item.color }}></span>
                  <span className="donut-label">{item.name}</span>
                  <span className="donut-val">{(item.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED STATS ROW */}
      <div className="analytics-details-grid">
        {/* TOP PERFORMING POSTS */}
        <div className="card rankings-card">
          <span className="rankings-title">Publicações em Destaque</span>
          <div className="table-container small">
            <table>
              <thead>
                <tr>
                  <th>Rede</th>
                  <th>Legenda Preview</th>
                  <th>Impressões</th>
                  <th>Likes</th>
                  <th>Eng. %</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Publique posts para gerar estatísticas.
                    </td>
                  </tr>
                ) : (
                  topPosts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        <span className={`platform-dot ${post.platforms[0]}`}>
                          {post.platforms[0][0].toUpperCase()}
                        </span>
                      </td>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.content}>
                        {post.content}
                      </td>
                      <td>{post.impressions.toLocaleString()}</td>
                      <td>{post.likes.toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{post.engagement_rate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ENGAGEMENT INTERACTIONS BREAKDOWN */}
        <div className="card rankings-card">
          <span className="rankings-title">Detalhamento de Interações</span>
          <p className="chart-subtitle" style={{ marginBottom: '0.75rem' }}>Cliques em anúncios, curtidas, salvos, compartilhamentos e comentários</p>
          <div className="chart-container" style={{ minHeight: '180px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={9} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={9} tickLine={false} width={50} />
                <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                <Bar dataKey="valor" fill="var(--color-secondary)" radius={[0, 3, 3, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-select-filter {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.825rem;
          cursor: pointer;
        }

        .date-toggle-tabs {
          display: flex;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 3px;
        }

        .date-toggle-tabs button {
          border: none;
          background: none;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .date-toggle-tabs button.active {
          background-color: var(--color-primary);
          color: #FFFFFF;
        }

        /* SUMMARIES GRID */
        .analytics-summaries-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .summary-kpi-card {
          padding: 1.25rem;
        }

        .summary-kpi-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-kpi-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .summary-kpi-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .summary-kpi-change.up {
          color: var(--color-success);
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .summary-kpi-period {
          font-size: 0.65rem;
          color: var(--text-secondary);
        }

        /* CHARTS GRID */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 5fr 3fr;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .analytics-chart-card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }

        .donut-chart-container {
          flex-grow: 1;
          height: 100%;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 38%;
        }

        .donut-legend-item {
          display: flex;
          align-items: center;
          font-size: 0.775rem;
          color: var(--text-primary);
        }

        .donut-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          flex-shrink: 0;
        }

        .donut-label {
          color: var(--text-secondary);
          margin-right: auto;
        }

        .donut-val {
          font-weight: 600;
        }

        /* DETAILS GRID */
        .analytics-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .rankings-card {
          padding: 1.25rem;
        }

        .rankings-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          display: block;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .analytics-summaries-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .analytics-charts-grid, .analytics-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
