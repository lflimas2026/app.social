import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Post } from '../context/AppContext';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Upload,
  X,
  Video,
  List,
  Heart,
  MessageCircle,
  Clock,
  Grid
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook } from './SocialIcons';

const MOCK_MEDIA_OPTIONS = [
  { name: 'Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80' },
  { name: 'Marketing', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Office', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
  { name: 'Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80' },
  { name: 'Success', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' }
];

export const Calendar = () => {
  const { currentUser, posts, addPost, updatePost, deletePost, addToast } = useApp();

  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  
  // Filters
  const [platformFilter, setPlatformFilter] = useState({ instagram: true, facebook: true, tiktok: true });
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form States
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<('instagram' | 'facebook' | 'tiktok')[]>(['instagram']);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Get current week days for Week View (June 8 - June 14, 2026 for convenience based on current local time)
  // Current local time: 2026-06-10 (Wednesday)
  
  // We mock a fixed week: Mon Jun 8 to Sun Jun 14, 2026
  const weekDays = [
    { label: 'Seg', dateNum: 8, dateObj: new Date(2026, 5, 8) },
    { label: 'Ter', dateNum: 9, dateObj: new Date(2026, 5, 9) },
    { label: 'Qua', dateNum: 10, dateObj: new Date(2026, 5, 10) }, // Today
    { label: 'Qui', dateNum: 11, dateObj: new Date(2026, 5, 11) },
    { label: 'Sex', dateNum: 12, dateObj: new Date(2026, 5, 12) },
    { label: 'Sab', dateNum: 13, dateObj: new Date(2026, 5, 13) },
    { label: 'Dom', dateNum: 14, dateObj: new Date(2026, 5, 14) },
  ];

  // We mock a fixed month: June 2026 (Mon 1st to Sun 30th)
  // Let's create an array of 35 boxes (June 1st starts on Monday, so 30 days fit nicely in 5 rows of 7)
  const monthDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    return {
      dayNum,
      dateObj: new Date(2026, 5, dayNum)
    };
  });

  const filterPostFn = (p: Post) => {
    const platMatch = p.platforms.some((plat) => platformFilter[plat]);
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    return platMatch && statusMatch;
  };

  const activePosts = posts.filter(filterPostFn);

  // OPEN MODAL FOR NEW
  const handleOpenNew = (dateObj?: Date) => {
    setEditingPost(null);
    setContent('');
    setMediaUrls([]);
    setHashtags('');
    
    const targetDate = dateObj || new Date(2026, 5, 10);
    setScheduledDate(targetDate.toISOString().split('T')[0]);
    setScheduledTime('14:00');
    setSelectedPlatforms(['instagram']);
    setModalOpen(true);
  };

  // OPEN MODAL FOR EDIT
  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setContent(post.content);
    setMediaUrls(post.media_urls);
    setHashtags(post.hashtags);
    
    const date = new Date(post.scheduled_at);
    setScheduledDate(date.toISOString().split('T')[0]);
    setScheduledTime(date.toTimeString().substring(0, 5));
    setSelectedPlatforms(post.platforms);
    setModalOpen(true);
  };

  // SUBMIT FORM
  const handleSavePost = (publishNow = false) => {
    if (!content.trim()) {
      addToast('O conteúdo do post não pode estar vazio.', 'warning');
      return;
    }
    if (selectedPlatforms.length === 0) {
      addToast('Selecione pelo menos uma rede social.', 'warning');
      return;
    }

    // Monthly Scheduling Limit Check
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySchedulings = posts.filter(p => {
      const d = new Date(p.created_at || p.scheduled_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const limit = currentUser?.features?.schedulingsLimit ?? 10;
    if (!editingPost && monthlySchedulings >= limit) {
      addToast(`Limite atingido! Seu plano atual permite apenas ${limit} agendamentos mensais. Faça upgrade nas Configurações!`, 'warning');
      return;
    }

    const scheduledTimestamp = publishNow
      ? new Date().toISOString()
      : new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

    const postPayload = {
      content,
      media_urls: mediaUrls,
      hashtags,
      scheduled_at: scheduledTimestamp,
      platforms: selectedPlatforms,
      preview_text: content.substring(0, 100),
      status: (publishNow ? 'published' : 'scheduled') as Post['status']
    };

    if (editingPost) {
      updatePost(editingPost.id, postPayload);
      addToast('Post atualizado com sucesso!', 'success');
    } else {
      addPost(postPayload);
    }
    setModalOpen(false);
  };

  // AI HASHTAG SUGGESTIONS
  const handleGenerateHashtags = () => {
    if (!currentUser?.features?.aiOptimization) {
      addToast('A IA de Otimização Básica está desativada no seu plano. Faça upgrade para liberar!', 'warning');
      return;
    }

    if (!content.trim()) {
      addToast('Escreva algum conteúdo primeiro para obter sugestões.', 'info');
      return;
    }
    
    // Simulate Claude generating hashtags from text
    const words = content.toLowerCase().split(' ');
    const suggestionsSet = new Set<string>();
    
    if (words.some(w => w.includes('promo') || w.includes('desconto') || w.includes('outlet'))) {
      suggestionsSet.add('promocao').add('descontos').add('outlet').add('ecommerce');
    }
    if (words.some(w => w.includes('marketing') || w.includes('social') || w.includes('tráfego') || w.includes('post'))) {
      suggestionsSet.add('marketingdigital').add('redessociais').add('growth').add('marketing');
    }
    if (words.some(w => w.includes('trabalho') || w.includes('negócio') || w.includes('empresa') || w.includes('agência'))) {
      suggestionsSet.add('business').add('sucesso').add('produtividade').add('agencias');
    }
    if (mediaUrls.length > 0) {
      suggestionsSet.add('feed').add('photooftheday').add('instagram');
    }
    
    // Default fallback tags
    suggestionsSet.add('marketing').add('socialapp').add('digital');

    const result = Array.from(suggestionsSet).join(', ');
    setHashtags((prev) => prev ? `${prev}, ${result}` : result);
    addToast('Hashtags sugeridas por IA adicionadas!', 'success');
  };

  const handleGeminiGenerate = () => {
    if (!currentUser?.features?.geminiIntegration) {
      addToast('A integração Gemini 2.5 Flash está bloqueada no seu plano atual (apenas no plano Professional).', 'warning');
      return;
    }

    addToast('Gemini 2.5 Flash gerando legenda otimizada...', 'info');
    setTimeout(() => {
      const ideas = [
        "Transforme a gestão das suas redes sociais com simplicidade e inteligência! 🚀 Descubra como a nossa plataforma pode automatizar o seu agendamento de posts e gerar relatórios otimizados em segundos. Clique no link da bio para um teste gratuito! 🎯✨",
        "A consistência é a chave para o crescimento digital! 🔑 Com nossa ferramenta de auto-posting ativo, suas campanhas rodam no piloto automático enquanto você foca no que realmente importa: expandir seu negócio. 📈💡",
        "Criatividade + Dados = Sucesso Garantido. 📊 Descubra insights profundos do seu público com o nosso Analytics avançado. Pronto para elevar o nível do seu marketing? 🚀🔥"
      ];
      const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
      setContent(randomIdea);
      addToast('Legenda gerada pelo Gemini 2.5 Flash!', 'success');
    }, 1000);
  };

  // DRAG AND DROP
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDrop = (targetDate: Date) => {
    if (!draggedId) return;
    const post = posts.find((p) => p.id === draggedId);
    if (!post) return;

    // Preserve time, change date
    const origTime = new Date(post.scheduled_at).toTimeString().substring(0, 8);
    const newScheduledAt = new Date(`${targetDate.toISOString().split('T')[0]}T${origTime}`).toISOString();
    
    updatePost(draggedId, { scheduled_at: newScheduledAt });
    addToast(`Post reagendado para o dia ${targetDate.toLocaleDateString('pt-BR')}`, 'success');
    setDraggedId(null);
  };

  const getCharLimit = () => {
    if (selectedPlatforms.includes('tiktok')) return 2200;
    if (selectedPlatforms.includes('facebook')) return 2200;
    return 2200; // default Instagram
  };

  const charCount = content.length;
  const isOverLimit = charCount > getCharLimit();

  return (
    <div className="calendar-page animate-fade-in">
      {/* HEADER ROW */}
      <div className="flex-between header-row">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Calendário de Conteúdo</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Planeje, agende e gerencie suas postagens sociais
          </p>
        </div>
        <button onClick={() => handleOpenNew()} className="btn btn-primary">
          <Plus size={16} />
          <span>Novo Post</span>
        </button>
      </div>

      {/* FILTER BAR BAR */}
      <div className="card filter-bar">
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Platforms Checkboxes */}
          <div className="filter-group">
            <span className="filter-label">Plataformas:</span>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={platformFilter.instagram}
                onChange={(e) => setPlatformFilter({ ...platformFilter, instagram: e.target.checked })}
              />
              <span className="platform-icon ig"><Instagram size={12} /></span>
              Instagram
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={platformFilter.facebook}
                onChange={(e) => setPlatformFilter({ ...platformFilter, facebook: e.target.checked })}
              />
              <span className="platform-icon fb"><Facebook size={12} /></span>
              Facebook
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={platformFilter.tiktok}
                onChange={(e) => setPlatformFilter({ ...platformFilter, tiktok: e.target.checked })}
              />
              <span className="platform-icon tt"><Video size={12} /></span>
              TikTok
            </label>
          </div>

          {/* Status Dropdown */}
          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="select-filter"
            >
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="scheduled">Agendados</option>
              <option value="draft">Rascunhos</option>
            </select>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="view-modes">
          <button
            onClick={() => setViewMode('week')}
            className={viewMode === 'week' ? 'active' : ''}
            title="Visualização Semanal"
          >
            <Grid size={15} />
            <span>Semana</span>
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={viewMode === 'month' ? 'active' : ''}
            title="Visualização Mensal"
          >
            <CalendarIcon size={15} />
            <span>Mês</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
            title="Visualização em Lista"
          >
            <List size={15} />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* WEEK VIEW GRID */}
      {viewMode === 'week' && (
        <div className="week-grid">
          {weekDays.map((day, dIdx) => {
            const dateStr = day.dateObj.toISOString().split('T')[0];
            const isToday = day.dateNum === 10; // 10 is Qua/Today
            const dayPosts = activePosts.filter(
              (p) => new Date(p.scheduled_at).toISOString().split('T')[0] === dateStr
            );

            return (
              <div
                key={dIdx}
                className={`week-col ${isToday ? 'today' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(day.dateObj)}
              >
                <div className="week-col-header">
                  <span className="day-label">{day.label}</span>
                  <span className="day-number">{day.dateNum}</span>
                </div>
                
                <div className="week-col-body">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => handleDragStart(post.id)}
                      onClick={() => handleOpenEdit(post)}
                      className={`post-calendar-card ${post.status}`}
                    >
                      <div className="post-card-platforms">
                        {post.platforms.map((p) => (
                          <span key={p} className={`mini-platform ${p}`}></span>
                        ))}
                      </div>
                      <p className="post-card-text">{post.content}</p>
                      {post.media_urls.length > 0 && (
                        <div className="post-card-media-preview">
                          <img src={post.media_urls[0]} alt="Post thumb" />
                        </div>
                      )}
                      <div className="post-card-footer">
                        <span className="post-card-time">
                          <Clock size={10} />
                          {new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`post-card-status-dot ${post.status}`}></span>
                      </div>
                    </div>
                  ))}

                  <button onClick={() => handleOpenNew(day.dateObj)} className="add-post-col-btn">
                    <Plus size={14} />
                    <span>Novo Post</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className="month-grid-wrapper">
          <div className="month-grid-header">
            <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
          </div>
          <div className="month-grid">
            {monthDays.map((day, mIdx) => {
              const dateStr = day.dateObj.toISOString().split('T')[0];
              const isToday = day.dayNum === 10;
              const dayPosts = activePosts.filter(
                (p) => new Date(p.scheduled_at).toISOString().split('T')[0] === dateStr
              );

              return (
                <div
                  key={mIdx}
                  className={`month-cell ${isToday ? 'today' : ''}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(day.dateObj)}
                  onClick={() => handleOpenNew(day.dateObj)}
                >
                  <span className="month-day-num">{day.dayNum}</span>
                  <div className="month-cell-posts">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(post.id); }}
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(post); }}
                        className={`month-post-dot ${post.status}`}
                        title={post.content}
                      >
                        {post.platforms.map((p) => p[0].toUpperCase()).join('/')}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="card list-view-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Redes</th>
                  <th>Preview Conteúdo</th>
                  <th>Impressões</th>
                  <th>Engajamento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {activePosts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      Nenhum post corresponde aos filtros ativos.
                    </td>
                  </tr>
                ) : (
                  activePosts.map((post) => (
                    <tr key={post.id}>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(post.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={post.content}>
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
                          <button onClick={() => handleOpenEdit(post)} className="action-btn" title="Editar">
                            <Edit2 size={13} />
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
      )}

      {/* CREATE/EDIT MODAL OVERLAY */}
      {modalOpen && (
        <div className="overlay">
          <div className="modal-content large" style={{ maxWidth: '980px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {editingPost ? '✏️ Editar Postagem' : '✏️ Nova Postagem'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body modal-grid-layout">
              {/* LEFT INPUT FORM COLUMN */}
              <div className="modal-form-col">
                {/* Content Input */}
                <div className="form-group">
                  <div className="flex-between">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Legenda do Post</span>
                      <button 
                        type="button" 
                        onClick={handleGeminiGenerate} 
                        className="gemini-badge-btn animate-pulse"
                        style={{
                          backgroundColor: 'rgba(168, 85, 247, 0.12)',
                          color: '#a855f7',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        <Sparkles size={10} />
                        Gemini 2.5 Flash
                      </button>
                    </label>
                    <span className={`char-counter ${isOverLimit ? 'over' : ''}`}>
                      {charCount}/{getCharLimit()}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    className={`input-field ${isOverLimit ? 'input-error' : ''}`}
                    placeholder="Escreva seu conteúdo aqui..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* Media Selection (Cloudflare R2 Upload & Presets) */}
                <div className="form-group">
                  <label>Mídia da Postagem (Upload no Cloudflare R2 ou escolha um preset)</label>
                  
                  <div className="r2-upload-container" style={{ marginBottom: '12px' }}>
                    <input
                      type="file"
                      id="r2-file-input"
                      style={{ display: 'none' }}
                      accept="image/*,video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        addToast('Fazendo upload para Cloudflare R2...', 'info');
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        try {
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('social_user_id')}`
                            }
                          });
                          if (!res.ok) throw new Error('Falha no upload');
                          const data = await res.json();
                          setMediaUrls([data.url]);
                          addToast('Upload concluído com sucesso!', 'success');
                        } catch (err: any) {
                          addToast('Erro ao fazer upload da imagem: ' + err.message, 'error');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('r2-file-input')?.click()}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '2px dashed var(--border-color, #374151)',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary, #1f2937)',
                        color: 'var(--text-secondary, #9ca3af)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <Upload size={16} />
                      <span>Fazer upload de imagem/vídeo para R2</span>
                    </button>
                  </div>

                  <div className="preset-media-grid">
                    {MOCK_MEDIA_OPTIONS.map((media) => {
                      const isSelected = mediaUrls.includes(media.url);
                      return (
                        <div
                          key={media.name}
                          onClick={() => {
                            if (isSelected) {
                              setMediaUrls(mediaUrls.filter((url) => url !== media.url));
                            } else {
                              setMediaUrls([media.url]);
                            }
                          }}
                          className={`preset-media-card ${isSelected ? 'selected' : ''}`}
                        >
                          <img src={media.url} alt={media.name} />
                          <span className="media-name-label">{media.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Checkboxes - Platform */}
                <div className="form-group">
                  <label>Plataformas de Veiculação</label>
                  <div className="platforms-row">
                    {(['instagram', 'facebook', 'tiktok'] as const).map((plat) => {
                      const isSelected = selectedPlatforms.includes(plat);
                      return (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat));
                            } else {
                              setSelectedPlatforms([...selectedPlatforms, plat]);
                            }
                          }}
                          className={`platform-btn ${plat} ${isSelected ? 'selected' : ''}`}
                        >
                          <span className="plat-icon">
                            {plat === 'instagram' && <Instagram size={14} />}
                            {plat === 'facebook' && <Facebook size={14} />}
                            {plat === 'tiktok' && <Video size={14} />}
                          </span>
                          <span style={{ textTransform: 'capitalize' }}>{plat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Picker & Time Picker */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Data de Publicação</label>
                    <input
                      type="date"
                      className="input-field"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Hora</label>
                    <input
                      type="time"
                      className="input-field"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Hashtags Input & AI generator */}
                <div className="form-group">
                  <div className="flex-between">
                    <label>Hashtags</label>
                    <button type="button" onClick={handleGenerateHashtags} className="ai-suggest-btn">
                      <Sparkles size={12} />
                      <span>Sugestões IA</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="marketing, verao, promo (separados por vírgula)"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                </div>
              </div>

              {/* RIGHT PREVIEW COLUMN */}
              <div className="modal-preview-col">
                <span className="preview-label">Visualização do Feed (Instagram)</span>
                
                {/* Mock Instagram Feed Preview Box */}
                <div className="insta-preview-box">
                  <div className="insta-header">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80" alt="Avatar" className="insta-avatar" />
                    <div className="insta-user-meta">
                      <span className="insta-username">suabrand</span>
                      <span className="insta-location">São Paulo, Brazil</span>
                    </div>
                  </div>

                  <div className="insta-image">
                    {mediaUrls.length > 0 ? (
                      <img src={mediaUrls[0]} alt="Mock Instagram Post" />
                    ) : (
                      <div className="insta-image-placeholder">
                        <Upload size={36} color="var(--text-muted)" />
                        <p>Escolha uma imagem ao lado</p>
                      </div>
                    )}
                  </div>

                  <div className="insta-actions">
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Heart size={18} />
                      <MessageCircle size={18} />
                    </div>
                  </div>

                  <div className="insta-caption-area">
                    <p className="insta-caption-text">
                      <span className="bold-username">suabrand </span>
                      {content || 'Seu conteúdo aqui...'}
                    </p>
                    {hashtags && (
                      <p className="insta-caption-hashtags">
                        {hashtags.split(',').map((tag) => `#${tag.trim()}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {editingPost && (
                <button
                  type="button"
                  onClick={() => {
                    deletePost(editingPost.id);
                    setModalOpen(false);
                  }}
                  className="btn btn-danger"
                  style={{ marginRight: 'auto' }}
                >
                  Excluir Post
                </button>
              )}
              <button onClick={() => setModalOpen(false)} className="btn btn-outline">
                Cancelar
              </button>
              <button onClick={() => handleSavePost(true)} className="btn btn-secondary">
                Publicar Agora
              </button>
              <button onClick={() => handleSavePost(false)} className="btn btn-primary" disabled={isOverLimit}>
                Agendar Post
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* FILTER BAR */
        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-primary);
          cursor: pointer;
        }

        .platform-icon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .platform-icon.ig { background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); }
        .platform-icon.fb { background-color: #1877F2; }
        .platform-icon.tt { background-color: #000000; border: 1px solid #ffffff; }

        .select-filter {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.825rem;
        }

        .view-modes {
          display: flex;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 2px;
        }

        .view-modes button {
          border: none;
          background: none;
          padding: 0.5rem 0.875rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }

        .view-modes button:hover {
          color: var(--text-primary);
        }

        .view-modes button.active {
          background-color: var(--color-primary);
          color: #FFFFFF;
        }

        /* WEEK VIEW GRID */
        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.875rem;
          min-height: 520px;
        }

        .week-col {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          padding: 0.75rem;
          transition: var(--transition-normal);
        }

        .week-col.today {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 1px var(--color-primary), var(--shadow-md);
          background-color: rgba(59, 130, 246, 0.01);
        }

        .week-col-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
        }

        .day-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .day-number {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 1px;
        }

        .week-col-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex-grow: 1;
        }

        /* POST CARD CALENDAR */
        .post-calendar-card {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 0.625rem;
          cursor: grab;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: var(--transition-fast);
          user-select: none;
        }

        .post-calendar-card:hover {
          border-color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
        }

        .post-calendar-card.published { border-left: 3px solid var(--color-success); }
        .post-calendar-card.scheduled { border-left: 3px solid var(--color-primary); }
        .post-calendar-card.draft { border-left: 3px solid var(--text-muted); }

        .post-card-platforms {
          display: flex;
          gap: 3px;
        }

        .mini-platform {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .mini-platform.instagram { background-color: #e1306c; }
        .mini-platform.facebook { background-color: #1877F2; }
        .mini-platform.tiktok { background-color: #000000; }

        .post-card-text {
          font-size: 0.75rem;
          color: var(--text-primary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .post-card-media-preview {
          width: 100%;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
        }

        .post-card-media-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          color: var(--text-secondary);
          border-top: 1px solid var(--border-color);
          padding-top: 4px;
        }

        .post-card-time {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .post-card-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .post-card-status-dot.published { background-color: var(--color-success); }
        .post-card-status-dot.scheduled { background-color: var(--color-primary); }
        .post-card-status-dot.draft { background-color: var(--text-muted); }

        .add-post-col-btn {
          background: none;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          padding: 0.5rem;
          font-size: 0.725rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: var(--transition-fast);
        }

        .add-post-col-btn:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
          background-color: var(--hover-bg);
        }

        /* MONTH VIEW */
        .month-grid-wrapper {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .month-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          background-color: var(--hover-bg);
          border-bottom: 1px solid var(--border-color);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          padding: 0.5rem 0;
          text-transform: uppercase;
        }

        .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(5, 1fr);
        }

        .month-cell {
          min-height: 100px;
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .month-cell:nth-child(7n) { border-right: none; }
        .month-cell:nth-child(n+29) { border-bottom: none; }

        .month-cell:hover {
          background-color: var(--hover-bg);
        }

        .month-cell.today {
          background-color: rgba(59, 130, 246, 0.02);
          box-shadow: inset 0 0 0 1px var(--color-primary);
        }

        .month-day-num {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          align-self: flex-end;
        }

        .month-cell.today .month-day-num {
          color: var(--color-primary);
          font-weight: 700;
        }

        .month-cell-posts {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .month-post-dot {
          font-size: 0.6rem;
          font-weight: 600;
          color: #FFFFFF;
          padding: 1px 4px;
          border-radius: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .month-post-dot.published { background-color: var(--color-success); }
        .month-post-dot.scheduled { background-color: var(--color-primary); }
        .month-post-dot.draft { background-color: var(--text-muted); }

        /* LIST VIEW */
        .list-view-card {
          padding: 1rem;
        }

        /* MODAL LAYOUT GRID */
        .modal-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .char-counter {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }

        .char-counter.over {
          color: var(--color-error);
          font-weight: 600;
        }

        /* Preset Media selection */
        .preset-media-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          max-height: 140px;
          overflow-y: auto;
          padding: 2px;
        }

        .preset-media-card {
          height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          border: 2px solid transparent;
          transition: var(--transition-fast);
        }

        .preset-media-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preset-media-card.selected {
          border-color: var(--color-primary);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }

        .media-name-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          font-size: 0.6rem;
          background-color: rgba(0, 0, 0, 0.6);
          color: #ffffff;
          padding: 2px;
          text-align: center;
          font-weight: 500;
        }

        .platforms-row {
          display: flex;
          gap: 0.75rem;
        }

        .platform-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background-color: var(--bg-app);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .platform-btn:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }

        .platform-btn.selected.instagram {
          background-color: rgba(225, 48, 108, 0.08);
          border-color: #e1306c;
          color: #e1306c;
        }

        .platform-btn.selected.facebook {
          background-color: rgba(24, 119, 242, 0.08);
          border-color: #1877F2;
          color: #1877F2;
        }

        .platform-btn.selected.tiktok {
          background-color: rgba(0, 0, 0, 0.08);
          border-color: var(--text-primary);
          color: var(--text-primary);
        }

        .ai-suggest-btn {
          background: none;
          border: none;
          color: var(--color-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ai-suggest-btn:hover {
          text-decoration: underline;
        }

        /* INSTAGRAM FEED PREVIEW */
        .insta-preview-box {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-card);
          overflow: hidden;
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          box-shadow: var(--shadow-sm);
        }

        .insta-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .insta-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }

        .insta-user-meta {
          display: flex;
          flex-direction: column;
        }

        .insta-username {
          font-size: 0.775rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .insta-location {
          font-size: 0.65rem;
          color: var(--text-secondary);
        }

        .insta-image {
          width: 100%;
          aspect-ratio: 1;
          background-color: var(--bg-app);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .insta-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .insta-image-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .insta-actions {
          padding: 0.75rem 0.75rem 0.5rem;
          color: var(--text-primary);
        }

        .insta-caption-area {
          padding: 0 0.75rem 0.875rem;
          font-size: 0.775rem;
          line-height: 1.4;
        }

        .insta-caption-text {
          color: var(--text-primary);
        }

        .bold-username {
          font-weight: 700;
        }

        .insta-caption-hashtags {
          color: #00376b;
          margin-top: 4px;
        }

        /* Responsive */
        @media (max-width: 990px) {
          .week-grid {
            grid-template-columns: 1fr;
          }
          .month-grid-header, .month-grid {
            display: none;
          }
          .modal-grid-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
