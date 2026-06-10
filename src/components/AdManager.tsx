import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Layers,
  Info,
  X,
  PlusCircle
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
  Tooltip
} from 'recharts';

export const AdManager = () => {
  const {
    campaigns,
    addCampaign,
    toggleCampaignStatus,
    deleteCampaign,
    searchQuery,
    addToast
  } = useApp();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    campaigns.length > 0 ? campaigns[0].id : null
  );

  const [modalOpen, setModalOpen] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'meta_ads' | 'tiktok_ads'>('meta_ads');
  const [objective, setObjective] = useState<'traffic' | 'conversions' | 'awareness'>('conversions');
  const [budget, setBudget] = useState('500');
  const [startDate, setStartDate] = useState('2026-06-10');
  const [endDate, setEndDate] = useState('');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [locationInput, setLocationInput] = useState('');
  const [locations, setLocations] = useState<string[]>(['São Paulo, SP']);
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>(['E-commerce', 'Fashion']);
  const [creativeText, setCreativeText] = useState('');
  const [creativeUrl, setCreativeUrl] = useState('');
  const [ctaText, setCtaText] = useState('Saiba Mais');
  const [landingUrl, setLandingUrl] = useState('');

  // Selected Campaign details
  const selectedCamp = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  // Mocked Daily Performance for charts
  const mockDailyPerformance = [
    { day: '01/06', spent: 15, conv: 2 },
    { day: '02/06', spent: 22, conv: 3 },
    { day: '03/06', spent: 20, conv: 4 },
    { day: '04/06', spent: 35, conv: 5 },
    { day: '05/06', spent: 30, conv: 4 },
    { day: '06/06', spent: 42, conv: 7 },
    { day: '07/06', spent: 48, conv: 8 },
    { day: '08/06', spent: 55, conv: 10 },
    { day: '09/06', spent: 65, conv: 12 },
    { day: '10/06', spent: 80, conv: 15 },
  ];

  // Ad Variations Mock Data
  const adVariations = [
    { id: 1, copy: 'Descontos imperdíveis de até 40% na nova coleção. Aproveite!', ctr: 4.8, conv: 28, roas: 3.2, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=80&h=80&q=80' },
    { id: 2, copy: 'Chegou a coleção de Verão! Frete grátis em compras acima de R$199.', ctr: 3.2, conv: 12, roas: 1.8, image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=80&h=80&q=80' },
    { id: 3, copy: 'Estilo e sofisticação no seu guarda-roupa. Descubra agora.', ctr: 2.1, conv: 5, roas: 1.1, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=80&h=80&q=80' },
  ];

  const handleAddLocation = () => {
    if (locationInput.trim()) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput('');
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim()) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Digite o nome da campanha.', 'warning');
      return;
    }

    addCampaign({
      name,
      platform,
      objective,
      budget: parseFloat(budget) || 100,
      start_date: startDate,
      end_date: endDate || null,
      audience_age_min: ageMin,
      audience_age_max: ageMax,
      audience_location: locations,
      creative_text: creativeText,
      creative_image_url: creativeUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
      cta_button_text: ctaText,
      landing_url: landingUrl || 'https://runtime.ia.br/ads',
      status: 'active'
    });

    setModalOpen(false);
    // Reset Form
    setName('');
    setBudget('500');
    setCreativeText('');
    setLandingUrl('');
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ads-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Gerenciador de Anúncios</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure e otimize suas campanhas patrocinadas
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="ads-layout-grid">
        {/* LEFT COLUMN: CAMPAIGNS LIST */}
        <div className="ads-list-col">
          <div className="card list-card-container">
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span className="section-title">Campanhas ({filteredCampaigns.length})</span>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Rede</th>
                    <th>Invest.</th>
                    <th>ROAS</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        Nenhuma campanha correspondente localizada.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((camp) => {
                      const isSelected = selectedCampaignId === camp.id;
                      return (
                        <tr
                          key={camp.id}
                          className={`campaign-tr ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCampaignId(camp.id)}
                        >
                          <td style={{ fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {camp.name}
                          </td>
                          <td style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                            {camp.platform === 'meta_ads' ? 'Meta Ads' : 'TikTok Ads'}
                          </td>
                          <td>R$ {camp.budget}</td>
                          <td style={{ fontWeight: 700, color: camp.roas >= 2.0 ? 'var(--color-success)' : camp.roas >= 1.2 ? 'var(--text-primary)' : 'var(--color-error)' }}>
                            {camp.roas}x
                          </td>
                          <td>
                            <span className={`badge badge-${
                              camp.status === 'active' ? 'success' : camp.status === 'completed' ? 'primary' : camp.status === 'paused' ? 'warning' : 'error'
                            }`}>
                              {camp.status === 'active' ? 'Ativo' : camp.status === 'completed' ? 'Fim' : camp.status === 'paused' ? 'Pausado' : 'Erro'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleCampaignStatus(camp.id)}
                                className={`action-btn ${camp.status === 'active' ? 'pause' : 'play'}`}
                                disabled={camp.status === 'completed'}
                              >
                                {camp.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                              </button>
                              <button onClick={() => deleteCampaign(camp.id)} className="action-btn delete">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED CAMPAIGN DETAILS */}
        <div className="ads-details-col">
          {selectedCamp ? (
            <div className="card details-panel-card">
              {/* PANEL HEADER */}
              <div className="details-panel-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{selectedCamp.name}</h2>
                    <span className={`badge badge-${selectedCamp.status === 'active' ? 'success' : 'warning'}`}>
                      {selectedCamp.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedCamp.platform === 'meta_ads' ? 'Meta Ads Platform' : 'TikTok Ads Manager'} • ID: {selectedCamp.campaign_external_id}
                  </p>
                </div>
              </div>

              {/* KPI CARD ROW */}
              <div className="kpis-row">
                <div className="kpi-card">
                  <span className="kpi-label">Gasto Total</span>
                  <span className="kpi-value">R$ {parseFloat(selectedCamp.spent.toFixed(2))}</span>
                  <span className="kpi-meta">de R$ {selectedCamp.budget}</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">Cliques</span>
                  <span className="kpi-value">{selectedCamp.clicks.toLocaleString()}</span>
                  <span className="kpi-meta">CTR: {selectedCamp.impressions > 0 ? ((selectedCamp.clicks / selectedCamp.impressions) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">CPM</span>
                  <span className="kpi-value">R$ {selectedCamp.cpm}</span>
                  <span className="kpi-meta">por 1K impressões</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">CPC Médio</span>
                  <span className="kpi-value">R$ {selectedCamp.cpc}</span>
                  <span className="kpi-meta">custo por clique</span>
                </div>
              </div>

              {/* CHARTS LAYER */}
              <div className="charts-kpis-wrapper">
                <div className="panel-chart-box">
                  <span className="box-title">Gasto Diário (R$)</span>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={mockDailyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={9} />
                      <YAxis stroke="var(--text-secondary)" fontSize={9} />
                      <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                      <Line type="monotone" dataKey="spent" name="Gasto" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="panel-chart-box">
                  <span className="box-title">Conversões por Dia</span>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={mockDailyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={9} />
                      <YAxis stroke="var(--text-secondary)" fontSize={9} />
                      <Tooltip contentStyle={{ fontSize: '10px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                      <Bar dataKey="conv" name="Conversões" fill="var(--color-success)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AD VARIATIONS AUDIT */}
              <div className="details-section">
                <span className="box-title" style={{ marginBottom: '0.5rem' }}>Variações do Anúncio (Criativos)</span>
                <div className="table-container small">
                  <table>
                    <thead>
                      <tr>
                        <th>Imagem</th>
                        <th>Texto (Copy)</th>
                        <th>CTR</th>
                        <th>Conv.</th>
                        <th>ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adVariations.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div className="variation-thumb">
                              <img src={v.image} alt="Creative Thumb" />
                            </div>
                          </td>
                          <td style={{ fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal' }}>
                            {v.copy}
                          </td>
                          <td>{v.ctr}%</td>
                          <td>{v.conv}</td>
                          <td style={{ fontWeight: 600 }}>{v.roas}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI RECOMMENDATIONS BOX */}
              <div className="details-section ai-recommendations-wrapper">
                <span className="box-title" style={{ color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} />
                  Recomendações Claude AI
                </span>
                <div className="recommendation-list">
                  <div className="rec-item">
                    <Info size={14} className="rec-icon" />
                    <p className="rec-text">
                      A variação de anúncio #1 está performando <strong>45% melhor</strong> que a média. Sugerimos realocar R$ 150 do orçamento para este criativo.
                    </p>
                  </div>
                  <div className="rec-item">
                    <Info size={14} className="rec-icon" />
                    <p className="rec-text">
                      O CPC da sua campanha está em R$ {selectedCamp.cpc}. Aumentar o orçamento total em 20% aumentará as conversões em até 14%.
                    </p>
                  </div>
                  {selectedCamp.roas < 1.2 && (
                    <div className="rec-item alert">
                      <Info size={14} className="rec-icon warning" />
                      <p className="rec-text">
                        Atenção: O ROAS atual ({selectedCamp.roas}x) está abaixo do threshold saudável. Revise a segmentação de público em {selectedCamp.audience_location.join(', ')}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card empty-panel-card">
              <Layers size={48} className="empty-icon" />
              <h3>Nenhuma campanha selecionada</h3>
              <p>Selecione uma campanha à esquerda para ver relatórios e otimizações IA.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW CAMPAIGN DIALOG */}
      {modalOpen && (
        <div className="overlay">
          <form onSubmit={handleSaveCampaign} className="modal-content large" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>🎯 Criar Nova Campanha de Anúncios</h3>
              <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body modal-scrollable">
              {/* Row 1: Name & Platform */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nome da Campanha</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: Verão Outlet 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Plataforma</label>
                  <div className="platform-radio-row">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="campaign_platform"
                        checked={platform === 'meta_ads'}
                        onChange={() => setPlatform('meta_ads')}
                      />
                      Meta Ads
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="campaign_platform"
                        checked={platform === 'tiktok_ads'}
                        onChange={() => setPlatform('tiktok_ads')}
                      />
                      TikTok Ads
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 2: Objective & Budget */}
              <div className="form-row">
                <div className="form-group">
                  <label>Objetivo de Campanha</label>
                  <select
                    className="input-field"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value as any)}
                  >
                    <option value="conversions">Conversão (Vendas/Leads)</option>
                    <option value="traffic">Tráfego para o site</option>
                    <option value="awareness">Reconhecimento de Marca</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Orçamento Diário (R$)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    className="input-field"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label>Data de Início</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Data de Término (Opcional)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* AUDIENCE SECTION */}
              <div className="modal-section-divider">Audiência (Público-Alvo)</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Idade Mínima ({ageMin} anos)</label>
                  <input
                    type="range"
                    min={13}
                    max={65}
                    className="slider-field"
                    value={ageMin}
                    onChange={(e) => setAgeMin(parseInt(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Idade Máxima ({ageMax} anos)</label>
                  <input
                    type="range"
                    min={18}
                    max={65}
                    className="slider-field"
                    value={ageMax}
                    onChange={(e) => setAgeMax(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Localizações</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ex: São Paulo, SP"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                    <button type="button" onClick={handleAddLocation} className="btn btn-outline" style={{ padding: '0 0.75rem' }}>
                      <PlusCircle size={14} />
                    </button>
                  </div>
                  <div className="tags-row">
                    {locations.map((loc) => (
                      <span key={loc} className="tag-badge">
                        {loc}
                        <X size={12} onClick={() => setLocations(locations.filter((l) => l !== loc))} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Interesses</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ex: E-commerce"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                    />
                    <button type="button" onClick={handleAddInterest} className="btn btn-outline" style={{ padding: '0 0.75rem' }}>
                      <PlusCircle size={14} />
                    </button>
                  </div>
                  <div className="tags-row">
                    {interests.map((int) => (
                      <span key={int} className="tag-badge secondary">
                        {int}
                        <X size={12} onClick={() => setInterests(interests.filter((i) => i !== int))} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CREATIVE SECTION */}
              <div className="modal-section-divider">Criativo do Anúncio</div>
              <div className="form-group">
                <label>Legenda do Anúncio (Máx 125 caracteres)</label>
                <textarea
                  rows={2}
                  maxLength={125}
                  className="input-field"
                  placeholder="Escreva a legenda atrativa do seu anúncio..."
                  value={creativeText}
                  onChange={(e) => setCreativeText(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL da Imagem do Criativo (Opcional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://images.unsplash.com/..."
                    value={creativeUrl}
                    onChange={(e) => setCreativeUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Texto do Botão CTA</label>
                  <select
                    className="input-field"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  >
                    <option value="Saiba Mais">Saiba Mais</option>
                    <option value="Comprar Agora">Comprar Agora</option>
                    <option value="Inscrever-se">Inscrever-se</option>
                    <option value="Fale Conosco">Fale Conosco</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>URL de Destino (Landing Page)</label>
                <input
                  type="url"
                  required
                  className="input-field"
                  placeholder="https://seusite.com/oferta"
                  value={landingUrl}
                  onChange={(e) => setLandingUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Criar Campanha
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .ads-layout-grid {
          display: grid;
          grid-template-columns: 4fr 5fr;
          gap: 1.5rem;
          height: calc(100vh - 170px);
          min-height: 500px;
        }

        .ads-list-col {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .list-card-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
        }

        .section-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .campaign-tr {
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .campaign-tr.selected td {
          background-color: var(--hover-bg);
          font-weight: 600;
        }

        .ads-details-col {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
        }

        .details-panel-card {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          gap: 1.25rem;
        }

        .details-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .empty-panel-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
          height: 100%;
          gap: 0.75rem;
        }

        .empty-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }

        /* KPIs Row */
        .kpis-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .kpi-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }

        .kpi-value {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        .kpi-meta {
          font-size: 0.65rem;
          color: var(--text-secondary);
          margin-top: 1px;
        }

        /* Charts inner wrapper */
        .charts-kpis-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .panel-chart-box {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .box-title {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .details-section {
          display: flex;
          flex-direction: column;
        }

        /* Creative Variations Table thumbnail */
        .variation-thumb {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          overflow: hidden;
        }

        .variation-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* AI Recommendations Panel */
        .ai-recommendations-wrapper {
          background-color: rgba(6, 182, 212, 0.04);
          border: 1px solid rgba(6, 182, 212, 0.2);
          border-radius: var(--radius-md);
          padding: 1rem;
          gap: 0.75rem;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .rec-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .rec-icon {
          color: var(--color-secondary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .rec-icon.warning {
          color: var(--color-error);
        }

        .rec-text {
          font-size: 0.775rem;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0;
        }

        /* NEW CAMPAIGN WIZARD FORMS */
        .platform-radio-row {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          height: 38px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          color: var(--text-primary);
        }

        .modal-scrollable {
          max-height: 60vh;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .modal-section-divider {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.25rem;
          margin-top: 1rem;
          margin-bottom: 0.875rem;
        }

        .slider-field {
          width: 100%;
          height: 6px;
          background: var(--border-color);
          outline: none;
          border-radius: var(--radius-full);
          cursor: pointer;
        }

        /* Tags Row Input */
        .tags-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.5rem;
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.725rem;
          background-color: rgba(59, 130, 246, 0.08);
          color: var(--color-primary);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 500;
        }

        .tag-badge.secondary {
          background-color: rgba(6, 182, 212, 0.08);
          color: var(--color-secondary);
        }

        .tag-badge svg {
          cursor: pointer;
          color: var(--text-secondary);
        }
        .tag-badge svg:hover {
          color: var(--color-error);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .ads-layout-grid {
            grid-template-columns: 1fr;
            height: auto;
          }
          .ads-details-col {
            margin-top: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
