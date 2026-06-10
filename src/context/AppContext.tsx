import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// --- DATA TYPES & INTERFACES ---

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  avatar_url: string | null;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  plan: 'free' | 'starter' | 'professional' | 'agency';
  subscription_status: 'active' | 'canceled' | 'expired';
  next_billing_date: string | null;
  created_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'meta_ads' | 'tiktok_ads';
  account_name: string;
  account_id: string;
  account_avatar: string | null;
  is_active: boolean;
  last_synced: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  hashtags: string;
  scheduled_at: string;
  published_at: string | null;
  platforms: ('instagram' | 'facebook' | 'tiktok')[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  preview_text: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  platform: 'meta_ads' | 'tiktok_ads';
  objective: 'traffic' | 'conversions' | 'awareness';
  status: 'active' | 'paused' | 'completed' | 'failed';
  budget: number;
  spent: number;
  start_date: string;
  end_date: string | null;
  audience_age_min: number;
  audience_age_max: number;
  audience_location: string[];
  creative_text: string;
  creative_image_url: string | null;
  cta_button_text: string;
  landing_url: string;
  campaign_external_id: string;
  created_at: string;
  // Metrics pre-joined for simplicity in views
  conversions: number;
  clicks: number;
  impressions: number;
  reach: number;
  cpc: number;
  cpm: number;
  roas: number;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  type: 'auto_pause_low_roas' | 'auto_increase_budget' | 'auto_pause_low_ctr' | 'suggestion';
  trigger_condition: string;
  action: string;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'post_published' | 'campaign_optimized' | 'low_performance' | 'new_comment';
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: 'campaign' | 'post' | 'account';
  resource_id: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  connectedAccounts: ConnectedAccount[];
  posts: Post[];
  campaigns: Campaign[];
  automations: Automation[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  toasts: ToastItem[];
  theme: 'light' | 'dark';
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setActiveTab: (tab: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Auth API
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, first_name: string, last_name: string, company_name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  updatePassword: (currentPass: string, newPass: string) => Promise<boolean>;
  
  // Posts API
  addPost: (post: Omit<Post, 'id' | 'user_id' | 'created_at' | 'published_at' | 'impressions' | 'reach' | 'likes' | 'comments' | 'shares' | 'saves' | 'clicks' | 'engagement_rate'>) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  
  // Campaigns API
  addCampaign: (campaign: Omit<Campaign, 'id' | 'user_id' | 'spent' | 'conversions' | 'clicks' | 'impressions' | 'reach' | 'cpc' | 'cpm' | 'roas' | 'campaign_external_id' | 'created_at'>) => void;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void;
  toggleCampaignStatus: (id: string) => void;
  deleteCampaign: (id: string) => void;
  
  // Automations API
  toggleAutomation: (id: string) => void;
  
  // Connected Accounts API
  connectAccount: (platform: ConnectedAccount['platform'], accountName: string) => void;
  disconnectAccount: (id: string) => void;
  forceSync: () => Promise<void>;
  
  // Notifications API
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper for generating UUID-like strings
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Theme Setup
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Toasts State
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = uuid();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- DATABASE STATES ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('social_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Initial Theme load
  useEffect(() => {
    const savedTheme = localStorage.getItem('social_theme') as 'light' | 'dark' | null;
    const finalTheme = savedTheme || 'dark';
    setThemeState(finalTheme);
    document.documentElement.setAttribute('data-theme', finalTheme);
  }, []);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('social_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    addToast(`Tema alterado para modo ${newTheme === 'dark' ? 'escuro' : 'claro'}`, 'info');
  };

  // --- LOAD MOCK DATABASE ON SIGNIN ---
  useEffect(() => {
    if (!currentUser) {
      // Clear data if logged out
      setConnectedAccounts([]);
      setPosts([]);
      setCampaigns([]);
      setAutomations([]);
      setNotifications([]);
      setAuditLogs([]);
      return;
    }

    // Try loading from LocalStorage, otherwise load initial mock data
    const localAccounts = localStorage.getItem(`social_accounts_${currentUser.id}`);
    const localPosts = localStorage.getItem(`social_posts_${currentUser.id}`);
    const localCampaigns = localStorage.getItem(`social_campaigns_${currentUser.id}`);
    const localAutomations = localStorage.getItem(`social_automations_${currentUser.id}`);
    const localNotifications = localStorage.getItem(`social_notifications_${currentUser.id}`);
    const localAudit = localStorage.getItem(`social_audit_${currentUser.id}`);

    if (localAccounts && localPosts && localCampaigns && localAutomations && localNotifications && localAudit) {
      setConnectedAccounts(JSON.parse(localAccounts));
      setPosts(JSON.parse(localPosts));
      setCampaigns(JSON.parse(localCampaigns));
      setAutomations(JSON.parse(localAutomations));
      setNotifications(JSON.parse(localNotifications));
      setAuditLogs(JSON.parse(localAudit));
    } else {
      // INITIAL SEED DATA
      const userId = currentUser.id;
      const initialAccounts: ConnectedAccount[] = [
        { id: uuid(), user_id: userId, platform: 'instagram', account_name: '@suabrand', account_id: 'ig_1029', account_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&h=80&q=80', is_active: true, last_synced: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: uuid(), user_id: userId, platform: 'tiktok', account_name: 'suabrand_oficial', account_id: 'tt_3920', account_avatar: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=80&h=80&q=80', is_active: true, last_synced: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: uuid(), user_id: userId, platform: 'meta_ads', account_name: 'Meta Business - Brand Inc', account_id: 'meta_ads_9921', account_avatar: null, is_active: true, last_synced: new Date().toISOString(), created_at: new Date().toISOString() },
        { id: uuid(), user_id: userId, platform: 'tiktok_ads', account_name: 'TikTok Ads - Brand Inc', account_id: 'tt_ads_1234', account_avatar: null, is_active: false, last_synced: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString() }, // Connection Error card
      ];

      // Setup preloaded posts
      const initialPosts: Post[] = [
        {
          id: uuid(),
          user_id: userId,
          content: 'Confira os bastidores do desenvolvimento do nosso novo produto! Cada detalhe foi pensado para simplificar a sua rotina de marketing digital. 🚀✨',
          media_urls: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'],
          hashtags: 'marketing,bastidores,produtividade,digital',
          scheduled_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // Published 12h ago
          published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          platforms: ['instagram', 'facebook'],
          status: 'published',
          preview_text: 'Confira os bastidores do desenvolvimento do nosso novo produto! Cada detalhe...',
          impressions: 4210,
          reach: 3820,
          likes: 342,
          comments: 29,
          shares: 14,
          saves: 42,
          clicks: 112,
          engagement_rate: 9.8,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: uuid(),
          user_id: userId,
          content: 'Atenção ao prazo: Nossa promoção especial de Verão termina nesta sexta-feira! Aproveite descontos exclusivos de até 40% em todo o site.',
          media_urls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'],
          hashtags: 'verao,promocao,descontos,ecommerce',
          scheduled_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Published 4h ago
          published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          platforms: ['instagram', 'tiktok'],
          status: 'published',
          preview_text: 'Atenção ao prazo: Nossa promoção especial de Verão termina nesta sexta-feira!...',
          impressions: 8900,
          reach: 7600,
          likes: 892,
          comments: 65,
          shares: 55,
          saves: 110,
          clicks: 432,
          engagement_rate: 11.4,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: uuid(),
          user_id: userId,
          content: 'Dica do dia: Use a regra do 80/20 no seu feed de rede social. 80% conteúdo educativo e de valor, 20% promoção direta dos seus serviços. Isso ajuda a construir autoridade.',
          media_urls: [],
          hashtags: 'dicas,redessociais,marketingdeconteudo',
          scheduled_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Scheduled in 6h
          published_at: null,
          platforms: ['instagram', 'facebook'],
          status: 'scheduled',
          preview_text: 'Dica do dia: Use a regra do 80/20 no seu feed de rede social. 80% conteúdo educativo...',
          impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, engagement_rate: 0,
          created_at: new Date().toISOString()
        },
        {
          id: uuid(),
          user_id: userId,
          content: 'Como as automações inteligentes podem economizar até 15 horas semanais na sua agência de marketing? Arrasta pro lado para ver o infográfico completo. 📊🤖',
          media_urls: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80'],
          hashtags: 'automacao,agencias,ia,marketing',
          scheduled_at: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(), // Scheduled in 1.5 days
          published_at: null,
          platforms: ['instagram'],
          status: 'scheduled',
          preview_text: 'Como as automações inteligentes podem economizar até 15 horas semanais na sua...',
          impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, engagement_rate: 0,
          created_at: new Date().toISOString()
        },
        {
          id: uuid(),
          user_id: userId,
          content: 'Lançamento oficial da nossa ferramenta no Product Hunt! Venha nos apoiar e confira os brindes exclusivos para quem participar do nosso painel de discussão hoje.',
          media_urls: [],
          hashtags: 'producthunt,startup,lançamento,software',
          scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Scheduled in 3 days
          published_at: null,
          platforms: ['tiktok'],
          status: 'draft',
          preview_text: 'Lançamento oficial da nossa ferramenta no Product Hunt! Venha nos apoiar e...',
          impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, engagement_rate: 0,
          created_at: new Date().toISOString()
        }
      ];

      // Setup preloaded campaigns
      const initialCampaigns: Campaign[] = [
        {
          id: uuid(),
          user_id: userId,
          name: 'Verão Outlet 2026',
          platform: 'meta_ads',
          objective: 'conversions',
          status: 'active',
          budget: 500.00,
          spent: 450.00,
          start_date: '2026-06-01',
          end_date: '2026-06-25',
          audience_age_min: 22,
          audience_age_max: 45,
          audience_location: ['São Paulo, SP', 'Rio de Janeiro, RJ'],
          creative_text: 'Promoção imperdível de verão! Descontos especiais de até 40% nas roupas mais desejadas da estação. Clique e confira!',
          creative_image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80',
          cta_button_text: 'Comprar Agora',
          landing_url: 'https://suabrand.com/outlet-verao',
          campaign_external_id: 'cmp_meta_99182',
          created_at: new Date().toISOString(),
          conversions: 180,
          clicks: 2340,
          impressions: 48900,
          reach: 41200,
          cpc: 0.19,
          cpm: 9.20,
          roas: 2.5
        },
        {
          id: uuid(),
          user_id: userId,
          name: 'Black Friday Antecipada',
          platform: 'tiktok_ads',
          objective: 'conversions',
          status: 'active',
          budget: 300.00,
          spent: 200.00,
          start_date: '2026-06-05',
          end_date: '2026-06-12',
          audience_age_min: 18,
          audience_age_max: 30,
          audience_location: ['Brasil (Todo o país)'],
          creative_text: 'Os menores preços do ano chegaram antes! Acesse nosso app e garanta frete grátis + cupom extra. Corre que é por tempo limitado!',
          creative_image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80',
          cta_button_text: 'Saiba Mais',
          landing_url: 'https://suabrand.com/black-friday',
          campaign_external_id: 'cmp_tt_72312',
          created_at: new Date().toISOString(),
          conversions: 45,
          clicks: 1200,
          impressions: 32000,
          reach: 28500,
          cpc: 0.17,
          cpm: 6.25,
          roas: 1.15  // Lower ROAS to trigger automated rules
        },
        {
          id: uuid(),
          user_id: userId,
          name: 'Lançamento Novo Produto',
          platform: 'meta_ads',
          objective: 'traffic',
          status: 'active',
          budget: 600.00,
          spent: 310.00,
          start_date: '2026-06-08',
          end_date: null,
          audience_age_min: 25,
          audience_age_max: 55,
          audience_location: ['Brasil (Principais capitais)'],
          creative_text: 'Chegou o novo organizador inteligente Social App. Gerencie seu calendário, crie posts e otimize anúncios com ajuda da IA.',
          creative_image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80',
          cta_button_text: 'Inscrever-se',
          landing_url: 'https://app.social.runtime.ia.br/novidade',
          campaign_external_id: 'cmp_meta_88761',
          created_at: new Date().toISOString(),
          conversions: 98,
          clicks: 1890,
          impressions: 39500,
          reach: 32400,
          cpc: 0.16,
          cpm: 7.84,
          roas: 3.1
        }
      ];

      // Setup automations
      const initialAutomations: Automation[] = [
        { id: uuid(), user_id: userId, name: 'Pausar campanhas com ROAS baixo', type: 'auto_pause_low_roas', trigger_condition: 'roas < 1.2', action: 'pause_campaign', is_active: true, created_at: new Date().toISOString() },
        { id: uuid(), user_id: userId, name: 'Aumentar orçamento com CTR alto', type: 'auto_increase_budget', trigger_condition: 'ctr > 4%', action: 'increase_budget_20', is_active: true, created_at: new Date().toISOString() },
        { id: uuid(), user_id: userId, name: 'Pausar anúncios se CPM disparar', type: 'auto_pause_low_ctr', trigger_condition: 'cpm > 15', action: 'pause_campaign', is_active: false, created_at: new Date().toISOString() }
      ];

      // Setup notifications
      const initialNotifications: Notification[] = [
        { id: uuid(), user_id: userId, type: 'post_published', title: 'Post publicado com sucesso!', message: 'Seu post "Atenção ao prazo: Nossa promoção especial..." foi publicado no Instagram e TikTok.', related_id: initialPosts[1].id, is_read: false, created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
        { id: uuid(), user_id: userId, type: 'new_comment', title: 'Novo comentário no Instagram', message: '@marketing_expert comentou: "Adorei a dica, vou começar a aplicar hoje mesmo!"', related_id: initialPosts[0].id, is_read: false, created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
        { id: uuid(), user_id: userId, type: 'campaign_optimized', title: 'Campanha otimizada automaticamente', message: 'Variação do anúncio "Verão Outlet" está apresentando 45% mais CTR que a média.', related_id: initialCampaigns[0].id, is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
      ];

      // Setup audit logs
      const initialAuditLogs: AuditLog[] = [
        { id: uuid(), user_id: userId, action: 'Criou campanha "Lançamento Novo Produto"', resource_type: 'campaign', resource_id: initialCampaigns[2].id, old_value: null, new_value: initialCampaigns[2], created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuid(), user_id: userId, action: 'Conectou conta do Instagram @suabrand', resource_type: 'account', resource_id: initialAccounts[0].id, old_value: null, new_value: initialAccounts[0], created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      setConnectedAccounts(initialAccounts);
      setPosts(initialPosts);
      setCampaigns(initialCampaigns);
      setAutomations(initialAutomations);
      setNotifications(initialNotifications);
      setAuditLogs(initialAuditLogs);

      // Save to localStorage
      localStorage.setItem(`social_accounts_${userId}`, JSON.stringify(initialAccounts));
      localStorage.setItem(`social_posts_${userId}`, JSON.stringify(initialPosts));
      localStorage.setItem(`social_campaigns_${userId}`, JSON.stringify(initialCampaigns));
      localStorage.setItem(`social_automations_${userId}`, JSON.stringify(initialAutomations));
      localStorage.setItem(`social_notifications_${userId}`, JSON.stringify(initialNotifications));
      localStorage.setItem(`social_audit_${userId}`, JSON.stringify(initialAuditLogs));
    }
  }, [currentUser]);

  // Sync state modifications to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_accounts_${currentUser.id}`, JSON.stringify(connectedAccounts));
    }
  }, [connectedAccounts, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_posts_${currentUser.id}`, JSON.stringify(posts));
    }
  }, [posts, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_campaigns_${currentUser.id}`, JSON.stringify(campaigns));
    }
  }, [campaigns, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_automations_${currentUser.id}`, JSON.stringify(automations));
    }
  }, [automations, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_notifications_${currentUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`social_audit_${currentUser.id}`, JSON.stringify(auditLogs));
    }
  }, [auditLogs, currentUser]);


  // --- SIMULATED BACKGROUND WORKERS (RUNS ON TIMER) ---
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      // 1. AUTO-POSTING WORKER (Check scheduled posts whose time has passed)
      const now = new Date();
      setPosts((prevPosts) => {
        let changed = false;
        const updated = prevPosts.map((post) => {
          if (post.status === 'scheduled' && new Date(post.scheduled_at) <= now) {
            changed = true;
            addToast(`Post publicado no ${post.platforms.join(', ')}!`, 'success');
            
            // Add notification
            const notifId = uuid();
            const newNotif: Notification = {
              id: notifId,
              user_id: currentUser.id,
              type: 'post_published',
              title: 'Post publicado com sucesso!',
              message: `Seu post agendado "${post.content.substring(0, 45)}..." foi publicado.`,
              related_id: post.id,
              is_read: false,
              created_at: new Date().toISOString()
            };
            setNotifications((prev) => [newNotif, ...prev]);

            // Add Audit log
            const auditId = uuid();
            const newAudit: AuditLog = {
              id: auditId,
              user_id: currentUser.id,
              action: `Publicou post agendado automaticamente nas redes: ${post.platforms.join(', ')}`,
              resource_type: 'post',
              resource_id: post.id,
              old_value: { status: 'scheduled' },
              new_value: { status: 'published', published_at: new Date().toISOString() },
              created_at: new Date().toISOString()
            };
            setAuditLogs((prev) => [newAudit, ...prev]);

            return {
              ...post,
              status: 'published' as const,
              published_at: new Date().toISOString(),
              impressions: Math.floor(Math.random() * 500) + 100,
              reach: Math.floor(Math.random() * 400) + 80,
              likes: Math.floor(Math.random() * 40) + 5,
              comments: Math.floor(Math.random() * 5),
              engagement_rate: parseFloat((Math.random() * 5 + 4).toFixed(1))
            };
          }
          return post;
        });
        return changed ? updated : prevPosts;
      });

      // 2. CRON SYNC SIMULATION (Increment post and campaign metrics slightly to make dashboard look "alive")
      setPosts((prevPosts) => {
        return prevPosts.map((post) => {
          if (post.status === 'published') {
            // Increment metrics occasionally
            if (Math.random() > 0.6) {
              const addImp = Math.floor(Math.random() * 20) + 1;
              const addReach = Math.floor(addImp * 0.85);
              const addLikes = Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0;
              const addComments = Math.random() > 0.85 ? 1 : 0;
              const newImps = post.impressions + addImp;
              const newReach = post.reach + addReach;
              const newLikes = post.likes + addLikes;
              const newComments = post.comments + addComments;
              const newEng = newImps > 0 ? parseFloat((((newLikes + newComments) / newReach) * 100).toFixed(1)) : 0;

              return {
                ...post,
                impressions: newImps,
                reach: newReach,
                likes: newLikes,
                comments: newComments,
                engagement_rate: isNaN(newEng) ? post.engagement_rate : newEng
              };
            }
          }
          return post;
        });
      });

      setCampaigns((prevCamps) => {
        let changed = false;
        const updated = prevCamps.map((camp) => {
          if (camp.status === 'active') {
            changed = true;
            const spendInc = parseFloat((Math.random() * 1.5 + 0.2).toFixed(2));
            const newSpent = parseFloat((camp.spent + spendInc).toFixed(2));
            
            // Check budget overrun
            if (newSpent >= camp.budget) {
              addToast(`Orçamento atingido para a campanha: ${camp.name}`, 'warning');
              
              // Notification
              const newNotif: Notification = {
                id: uuid(),
                user_id: currentUser.id,
                type: 'campaign_optimized',
                title: 'Orçamento Atingido',
                message: `A campanha "${camp.name}" atingiu o orçamento de R$ ${camp.budget} e foi encerrada.`,
                related_id: camp.id,
                is_read: false,
                created_at: new Date().toISOString()
              };
              setNotifications((prev) => [newNotif, ...prev]);

              return {
                ...camp,
                spent: camp.budget,
                status: 'completed' as const
              };
            }

            const clickInc = Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
            const convInc = clickInc > 0 && Math.random() > 0.8 ? 1 : 0;
            const newClicks = camp.clicks + clickInc;
            const newConvs = camp.conversions + convInc;
            
            // Recompute ROAS dynamically
            let currentRoas = camp.roas;
            if (convInc > 0) {
              // Sells simulation: every conversion brings R$ 35
              const revenue = newConvs * 35.00;
              currentRoas = parseFloat((revenue / newSpent).toFixed(2));
            } else {
              // Natural drift
              currentRoas = parseFloat((Math.max(0.5, camp.roas + (Math.random() * 0.1 - 0.05))).toFixed(2));
            }

            return {
              ...camp,
              spent: newSpent,
              clicks: newClicks,
              conversions: newConvs,
              roas: currentRoas,
              impressions: camp.impressions + (clickInc * 15) + Math.floor(Math.random() * 10),
              reach: camp.reach + (clickInc * 12) + Math.floor(Math.random() * 8),
              cpc: newClicks > 0 ? parseFloat((newSpent / newClicks).toFixed(2)) : camp.cpc
            };
          }
          return camp;
        });

        // 3. AUTO-OPTIMIZATION RULES (Auto Pause campaign if ROAS < 1.2 and automation active)
        const activeRules = automations.filter((a) => a.is_active);
        const autoPauseActive = activeRules.some((r) => r.type === 'auto_pause_low_roas');
        const autoIncreaseActive = activeRules.some((r) => r.type === 'auto_increase_budget');

        if (autoPauseActive || autoIncreaseActive) {
          return updated.map((camp) => {
            if (camp.status === 'active') {
              // Auto Pause on low ROAS
              if (autoPauseActive && camp.roas < 1.2 && camp.spent > 50) {
                addToast(`Campanha paused por baixo ROAS: ${camp.name} (ROAS: ${camp.roas}x)`, 'warning');
                
                // Add Audit Log
                const newAudit: AuditLog = {
                  id: uuid(),
                  user_id: currentUser.id,
                  action: `Automação executada: Pausou campanha "${camp.name}" devido a ROAS < 1.2 (Atual: ${camp.roas}x)`,
                  resource_type: 'campaign',
                  resource_id: camp.id,
                  old_value: { status: 'active' },
                  new_value: { status: 'paused' },
                  created_at: new Date().toISOString()
                };
                setAuditLogs((prev) => [newAudit, ...prev]);

                // Notification
                const newNotif: Notification = {
                  id: uuid(),
                  user_id: currentUser.id,
                  type: 'low_performance',
                  title: 'Campanha suspensa por IA',
                  message: `A campanha "${camp.name}" foi pausada automaticamente pois o ROAS atingiu ${camp.roas}x.`,
                  related_id: camp.id,
                  is_read: false,
                  created_at: new Date().toISOString()
                };
                setNotifications((prev) => [newNotif, ...prev]);

                return { ...camp, status: 'paused' as const };
              }

              // Auto Increase Budget on high ROAS/CTR (CTR simulation click/imps > 4%)
              const ctr = camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0;
              if (autoIncreaseActive && ctr > 4 && camp.spent < camp.budget * 0.8 && Math.random() > 0.95) {
                const oldBudget = camp.budget;
                const newBudget = parseFloat((oldBudget * 1.2).toFixed(2));
                addToast(`Orçamento aumentado em 20% para: ${camp.name}`, 'success');

                const newAudit: AuditLog = {
                  id: uuid(),
                  user_id: currentUser.id,
                  action: `Automação executada: Aumentou orçamento da campanha "${camp.name}" em 20% por CTR alto (CTR: ${ctr.toFixed(1)}%)`,
                  resource_type: 'campaign',
                  resource_id: camp.id,
                  old_value: { budget: oldBudget },
                  new_value: { budget: newBudget },
                  created_at: new Date().toISOString()
                };
                setAuditLogs((prev) => [newAudit, ...prev]);

                return { ...camp, budget: newBudget };
              }
            }
            return camp;
          });
        }

        return changed ? updated : prevCamps;
      });

      // 4. RANDOM COMMENT WEBHOOK SIMULATION (every 60s occasionally adds a comment)
      if (Math.random() > 0.85) {
        setPosts((prevPosts) => {
          const published = prevPosts.filter((p) => p.status === 'published');
          if (published.length === 0) return prevPosts;
          const target = published[Math.floor(Math.random() * published.length)];
          
          const commentators = ['@julia_digital', '@rodrigo_mkt', '@carol_growth', '@lucas_agency', '@web_designer'];
          const messages = [
            'Excelente insights! Vou testar no meu perfil.',
            'Qual ferramenta vocês usam para esses designs?',
            'Muito bom! Posta mais sobre tráfego pago depois.',
            'Concordo 100%! Conteúdo é rei.',
            'Estava precisando ler isso hoje, obrigado!'
          ];

          const userCommentator = commentators[Math.floor(Math.random() * commentators.length)];
          const commentMsg = messages[Math.floor(Math.random() * messages.length)];

          const newNotif: Notification = {
            id: uuid(),
            user_id: currentUser.id,
            type: 'new_comment',
            title: `Novo comentário no ${target.platforms[0] === 'tiktok' ? 'TikTok' : 'Instagram'}`,
            message: `${userCommentator} comentou: "${commentMsg}"`,
            related_id: target.id,
            is_read: false,
            created_at: new Date().toISOString()
          };

          setNotifications((prev) => [newNotif, ...prev]);
          addToast(`Novo comentário de ${userCommentator}`, 'info');

          return prevPosts.map((p) => {
            if (p.id === target.id) {
              return { ...p, comments: p.comments + 1 };
            }
            return p;
          });
        });
      }

    }, 10000); // ticks every 10 seconds

    return () => clearInterval(interval);
  }, [currentUser, automations]);

  // --- AUTH OPERATIONS ---
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // Basic verification simulation
    if (password && (email === 'fernando@runtime.ia.br' || email.includes('@'))) {
      const mockUser: User = {
        id: 'usr_f1293',
        email: email,
        first_name: email === 'fernando@runtime.ia.br' ? 'Luiz Fernando' : email.split('@')[0],
        last_name: 'Lima',
        company_name: 'runtime.ia.br',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
        plan: 'professional',
        subscription_status: 'active',
        next_billing_date: '2026-07-15',
        created_at: new Date().toISOString()
      };
      setCurrentUser(mockUser);
      localStorage.setItem('social_user', JSON.stringify(mockUser));
      addToast('Bem-vindo de volta!', 'success');
      return true;
    }
    addToast('E-mail ou senha incorretos.', 'error');
    return false;
  };

  const signup = async (email: string, password: string, first_name: string, last_name: string, company_name: string): Promise<boolean> => {
    if (!password) return false;
    const mockUser: User = {
      id: 'usr_' + uuid().substring(0, 6),
      email,
      first_name,
      last_name,
      company_name,
      avatar_url: null,
      timezone: 'America/Sao_Paulo',
      theme: 'dark',
      plan: 'starter',
      subscription_status: 'active',
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    setCurrentUser(mockUser);
    localStorage.setItem('social_user', JSON.stringify(mockUser));
    addToast('Conta criada com sucesso!', 'success');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('social_user');
    addToast('Você saiu da sua conta.', 'info');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('social_user', JSON.stringify(updated));
    addToast('Perfil atualizado!', 'success');
  };

  const updatePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    if (currentPass && newPass) {
      addToast('Senha alterada com sucesso!', 'success');
      return true;
    }
    return false;
  };

  // --- POST OPERATIONS ---

  const addPost = (postData: Omit<Post, 'id' | 'user_id' | 'created_at' | 'published_at' | 'impressions' | 'reach' | 'likes' | 'comments' | 'shares' | 'saves' | 'clicks' | 'engagement_rate'>) => {
    if (!currentUser) return;
    const isNow = new Date(postData.scheduled_at) <= new Date();
    const newPost: Post = {
      ...postData,
      id: uuid(),
      user_id: currentUser.id,
      published_at: isNow ? new Date().toISOString() : null,
      status: isNow ? 'published' : 'scheduled',
      impressions: isNow ? Math.floor(Math.random() * 50) + 10 : 0,
      reach: isNow ? Math.floor(Math.random() * 40) + 8 : 0,
      likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, engagement_rate: 0,
      created_at: new Date().toISOString()
    };

    setPosts((prev) => [newPost, ...prev]);
    addToast(isNow ? 'Post publicado com sucesso!' : 'Post agendado com sucesso!', 'success');

    // Add Audit Log
    const newAudit: AuditLog = {
      id: uuid(),
      user_id: currentUser.id,
      action: isNow ? `Publicou post instantâneo nas redes: ${postData.platforms.join(', ')}` : `Agendou post para ${new Date(postData.scheduled_at).toLocaleString()}`,
      resource_type: 'post',
      resource_id: newPost.id,
      old_value: null,
      new_value: newPost,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const updatePost = (id: string, updatedFields: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === id) {
          const isNow = updatedFields.scheduled_at && new Date(updatedFields.scheduled_at) <= new Date();
          return {
            ...post,
            ...updatedFields,
            status: isNow ? 'published' : (updatedFields.status || post.status),
            published_at: isNow ? new Date().toISOString() : post.published_at
          };
        }
        return post;
      })
    );
    addToast('Post atualizado!', 'success');
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    addToast('Post excluído.', 'info');
  };

  // --- CAMPAIGNS OPERATIONS ---

  const addCampaign = (campData: Omit<Campaign, 'id' | 'user_id' | 'spent' | 'conversions' | 'clicks' | 'impressions' | 'reach' | 'cpc' | 'cpm' | 'roas' | 'campaign_external_id' | 'created_at'>) => {
    if (!currentUser) return;
    const newCamp: Campaign = {
      ...campData,
      id: uuid(),
      user_id: currentUser.id,
      spent: 0.00,
      conversions: 0,
      clicks: 0,
      impressions: 0,
      reach: 0,
      cpc: 0.00,
      cpm: 0.00,
      roas: 0.00,
      campaign_external_id: 'cmp_' + campData.platform.substring(0, 2) + '_' + Math.floor(Math.random() * 90000 + 10000),
      created_at: new Date().toISOString()
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    addToast('Campanha criada com sucesso!', 'success');

    // Audit Log
    const newAudit: AuditLog = {
      id: uuid(),
      user_id: currentUser.id,
      action: `Criou campanha de anúncios "${newCamp.name}" no ${campData.platform === 'meta_ads' ? 'Meta Ads' : 'TikTok Ads'}`,
      resource_type: 'campaign',
      resource_id: newCamp.id,
      old_value: null,
      new_value: newCamp,
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const updateCampaign = (id: string, updatedFields: Partial<Campaign>) => {
    setCampaigns((prev) =>
      prev.map((camp) => {
        if (camp.id === id) {
          return { ...camp, ...updatedFields };
        }
        return camp;
      })
    );
    addToast('Campanha atualizada!', 'success');
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((camp) => {
        if (camp.id === id) {
          const newStatus = camp.status === 'active' ? 'paused' : 'active';
          addToast(`Campanha ${newStatus === 'active' ? 'retomada' : 'pausada'}`, 'info');
          
          // Log
          const newAudit: AuditLog = {
            id: uuid(),
            user_id: currentUser?.id || '',
            action: `${newStatus === 'active' ? 'Retomou' : 'Pausou'} campanha "${camp.name}"`,
            resource_type: 'campaign',
            resource_id: camp.id,
            old_value: { status: camp.status },
            new_value: { status: newStatus },
            created_at: new Date().toISOString()
          };
          setAuditLogs((p) => [newAudit, ...p]);

          return { ...camp, status: newStatus };
        }
        return camp;
      })
    );
  };

  const deleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    addToast('Campanha removida.', 'info');
  };

  // --- AUTOMATIONS API ---
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) => {
        if (auto.id === id) {
          const newStatus = !auto.is_active;
          addToast(`Automação "${auto.name}" ${newStatus ? 'ativada' : 'desativada'}`, 'success');
          return { ...auto, is_active: newStatus };
        }
        return auto;
      })
    );
  };

  // --- CONNECTED ACCOUNTS API ---
  const connectAccount = (platform: ConnectedAccount['platform'], accountName: string) => {
    if (!currentUser) return;
    const id = uuid();
    const newAccount: ConnectedAccount = {
      id,
      user_id: currentUser.id,
      platform,
      account_name: accountName,
      account_id: platform.substring(0, 2) + '_' + Math.floor(Math.random() * 9000 + 1000),
      account_avatar: null,
      is_active: true,
      last_synced: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    setConnectedAccounts((prev) => [...prev, newAccount]);
    addToast(`Conta ${platform.toUpperCase()} conectada!`, 'success');

    // Audit Log
    const newAudit: AuditLog = {
      id: uuid(),
      user_id: currentUser.id,
      action: `Conectou conta do ${platform.toUpperCase()} "${accountName}"`,
      resource_type: 'account',
      resource_id: newAccount.id,
      old_value: null,
      new_value: newAccount,
      created_at: new Date().toISOString()
    };
    setAuditLogs((p) => [newAudit, ...p]);
  };

  const disconnectAccount = (id: string) => {
    const target = connectedAccounts.find((c) => c.id === id);
    if (!target) return;
    setConnectedAccounts((prev) => prev.filter((c) => c.id !== id));
    addToast(`Conta ${target.platform.toUpperCase()} desconectada.`, 'info');

    // Audit Log
    const newAudit: AuditLog = {
      id: uuid(),
      user_id: currentUser?.id || '',
      action: `Desconectou conta do ${target.platform.toUpperCase()} "${target.account_name}"`,
      resource_type: 'account',
      resource_id: target.id,
      old_value: target,
      new_value: null,
      created_at: new Date().toISOString()
    };
    setAuditLogs((p) => [newAudit, ...p]);
  };

  const forceSync = async () => {
    addToast('Sincronização forçada iniciada...', 'info');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Force sync metrics updates
    setConnectedAccounts((prev) =>
      prev.map((c) => ({ ...c, is_active: true, last_synced: new Date().toISOString() }))
    );
    
    // Update stats slightly
    setPosts((prev) =>
      prev.map((post) => {
        if (post.status === 'published') {
          return {
            ...post,
            impressions: post.impressions + Math.floor(Math.random() * 100) + 10,
            reach: post.reach + Math.floor(Math.random() * 80) + 8,
            likes: post.likes + Math.floor(Math.random() * 20),
            comments: post.comments + Math.floor(Math.random() * 2)
          };
        }
        return post;
      })
    );

    addToast('Todas as contas e métricas sincronizadas com sucesso!', 'success');
  };

  // --- NOTIFICATIONS API ---
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    addToast('Todas as notificações marcadas como lidas.', 'success');
  };

  const clearNotifications = () => {
    setNotifications([]);
    addToast('Notificações limpas.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        connectedAccounts,
        posts,
        campaigns,
        automations,
        notifications,
        auditLogs,
        toasts,
        theme,
        activeTab,
        searchQuery,
        setSearchQuery,
        setActiveTab,
        setTheme,
        addToast,
        removeToast,
        login,
        signup,
        logout,
        updateProfile,
        updatePassword,
        addPost,
        updatePost,
        deletePost,
        addCampaign,
        updateCampaign,
        toggleCampaignStatus,
        deleteCampaign,
        toggleAutomation,
        connectAccount,
        disconnectAccount,
        forceSync,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
