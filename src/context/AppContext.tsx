import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// --- DATA TYPES & INTERFACES ---

export interface UserFeatures {
  socialNetworksLimit: number;
  schedulingsLimit: number;
  autoPosting: boolean;
  adsManager: boolean;
  aiOptimization: boolean;
  geminiIntegration: boolean;
  exportableReports: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  avatar_url: string | null;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  plan: 'free' | 'starter' | 'professional';
  subscription_status: 'active' | 'canceled' | 'expired';
  next_billing_date: string | null;
  created_at: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
  features?: UserFeatures;
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

export interface Invoice {
  id: string;
  date: string;
  planName: string;
  amount: number;
  paymentMethod: 'pix' | 'credit_card' | 'boleto';
  status: 'Pago' | 'Pendente' | 'Vencido';
}

export const getDefaultFeaturesForPlan = (plan: 'free' | 'starter' | 'professional'): UserFeatures => {
  switch (plan) {
    case 'free':
      return {
        socialNetworksLimit: 1,
        schedulingsLimit: 10,
        autoPosting: false,
        adsManager: false,
        aiOptimization: false,
        geminiIntegration: false,
        exportableReports: false
      };
    case 'starter':
      return {
        socialNetworksLimit: 3,
        schedulingsLimit: 999999,
        autoPosting: true,
        adsManager: true,
        aiOptimization: true,
        geminiIntegration: false,
        exportableReports: false
      };
    case 'professional':
    default:
      return {
        socialNetworksLimit: 6,
        schedulingsLimit: 999999,
        autoPosting: true,
        adsManager: true,
        aiOptimization: true,
        geminiIntegration: true,
        exportableReports: true
      };
  }
};

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
  allUsers: User[];
  invoices: Invoice[];
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

  // Admin / Payments API
  adminCreateCompany: (email: string, firstName: string, lastName: string, companyName: string, plan: 'free' | 'starter' | 'professional') => void;
  adminUpdateCompanyFeatures: (userId: string, data: { plan: 'free' | 'starter' | 'professional'; features: UserFeatures; isBlocked: boolean }) => void;
  simulateAsaasUpgrade: (plan: 'starter' | 'professional', paymentMethod: 'pix' | 'credit_card' | 'boleto', value: number) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// API Fetch Helper
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const userId = localStorage.getItem('social_user_id');
  const headers = new Headers(options.headers || {});
  
  if (userId) {
    headers.set('Authorization', `Bearer ${userId}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Theme & Navigation
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

  // Cloudflare persistent states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Load User Data & Assets
  const loadUserData = async () => {
    try {
      const data = await apiFetch('/api/data');
      setConnectedAccounts(data.connectedAccounts);
      setPosts(data.posts);
      setCampaigns(data.campaigns);
      setAutomations(data.automations);
      setNotifications(data.notifications);
      setAuditLogs(data.auditLogs);
      setInvoices(data.invoices);
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  };

  // Load Admin list
  const loadAdminUsers = async () => {
    try {
      const data = await apiFetch('/api/admin/users');
      setAllUsers(data.users);
    } catch (err) {
      console.error('Erro ao carregar lista de usuários para admin:', err);
    }
  };

  // Re-fetch all data on user change
  useEffect(() => {
    if (currentUser) {
      loadUserData();
      if (currentUser.isAdmin) {
        loadAdminUsers();
      }
    } else {
      setConnectedAccounts([]);
      setPosts([]);
      setCampaigns([]);
      setAutomations([]);
      setNotifications([]);
      setAuditLogs([]);
      setInvoices([]);
      setAllUsers([]);
    }
  }, [currentUser]);

  // Initial authentication check
  useEffect(() => {
    const userId = localStorage.getItem('social_user_id');
    if (userId) {
      apiFetch('/api/auth/me')
        .then((data) => {
          setCurrentUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('social_user_id');
          setCurrentUser(null);
        });
    }
  }, []);

  // Theme Sync (keeps locally on user device)
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

  // --- BACKGROUND WORKERS SIMULATION (via APIs) ---
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      // 1. AUTO-POSTING CHECK & SYNC DRIFT
      const now = new Date();
      let hasPendingScheduledPost = false;

      posts.forEach((post) => {
        if (post.status === 'scheduled' && new Date(post.scheduled_at) <= now) {
          hasPendingScheduledPost = true;
          const isAutoPostingActive = currentUser.features?.autoPosting ?? true;

          if (!isAutoPostingActive) {
            apiFetch(`/api/posts/${post.id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'failed' })
            }).then(() => {
              addToast(`Falha na postagem automática: recurso bloqueado no plano.`, 'error');
              loadUserData();
            }).catch(() => {});
          } else {
            apiFetch(`/api/posts/${post.id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'published', scheduled_at: now.toISOString() })
            }).then(() => {
              addToast(`Post publicado com sucesso no ${post.platforms.join(', ')}!`, 'success');
              loadUserData();
            }).catch(() => {});
          }
        }
      });

      // 2. LIVE METRICS DRIFT (simulated metrics update in DB)
      if (!hasPendingScheduledPost && currentUser.features?.adsManager && campaigns.some(c => c.status === 'active')) {
        apiFetch('/api/connected-accounts/sync', { method: 'POST' })
          .then(() => {
            loadUserData();
          })
          .catch(() => {});
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [currentUser, posts, campaigns]);

  // --- AUTH OPERATIONS ---
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('social_user_id', data.user.id);
      setCurrentUser(data.user);
      addToast(data.user.isAdmin ? 'Bem-vindo, Administrador!' : `Bem-vindo de volta! (${data.user.company_name})`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Credenciais inválidas.', 'error');
      return false;
    }
  };

  const signup = async (email: string, password: string, first_name: string, last_name: string, company_name: string): Promise<boolean> => {
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, first_name, last_name, company_name })
      });
      localStorage.setItem('social_user_id', data.user.id);
      setCurrentUser(data.user);
      addToast(data.user.isAdmin ? 'Admin cadastrado com sucesso!' : 'Conta criada com sucesso!', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao efetuar cadastro.', 'error');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('social_user_id');
    setCurrentUser(null);
    addToast('Você saiu da sua conta.', 'info');
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await apiFetch('/api/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setCurrentUser(res.user);
      addToast('Perfil atualizado!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Erro ao atualizar perfil.', 'error');
    }
  };

  const updatePassword = async (currentPass: string, newPass: string): Promise<boolean> => {
    try {
      await apiFetch('/api/auth/update-password', {
        method: 'POST',
        body: JSON.stringify({ currentPass, newPass })
      });
      addToast('Senha alterada com sucesso!', 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro ao modificar senha.', 'error');
      return false;
    }
  };

  // --- POST OPERATIONS ---
  const addPost = async (postData: Omit<Post, 'id' | 'user_id' | 'created_at' | 'published_at' | 'impressions' | 'reach' | 'likes' | 'comments' | 'shares' | 'saves' | 'clicks' | 'engagement_rate'>) => {
    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
      });
      const isNow = new Date(postData.scheduled_at) <= new Date();
      addToast(isNow ? 'Post publicado com sucesso!' : 'Post agendado com sucesso!', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao agendar post.', 'error');
    }
  };

  const updatePost = async (id: string, updatedFields: Partial<Post>) => {
    try {
      await apiFetch(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      addToast('Post atualizado!', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao atualizar post.', 'error');
    }
  };

  const deletePost = async (id: string) => {
    try {
      await apiFetch(`/api/posts/${id}`, { method: 'DELETE' });
      addToast('Post excluído.', 'info');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao deletar post.', 'error');
    }
  };

  // --- CAMPAIGNS OPERATIONS ---
  const addCampaign = async (campData: Omit<Campaign, 'id' | 'user_id' | 'spent' | 'conversions' | 'clicks' | 'impressions' | 'reach' | 'cpc' | 'cpm' | 'roas' | 'campaign_external_id' | 'created_at'>) => {
    try {
      await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(campData)
      });
      addToast('Campanha criada com sucesso!', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao criar campanha.', 'error');
    }
  };

  const updateCampaign = async (id: string, updatedFields: Partial<Campaign>) => {
    try {
      await apiFetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      addToast('Campanha atualizada!', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao atualizar campanha.', 'error');
    }
  };

  const toggleCampaignStatus = async (id: string) => {
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;
    const newStatus = camp.status === 'active' ? 'paused' : 'active';
    try {
      await apiFetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      addToast(`Campanha ${newStatus === 'active' ? 'retomada' : 'pausada'}`, 'info');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao alternar status da campanha.', 'error');
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await apiFetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      addToast('Campanha removida.', 'info');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao deletar campanha.', 'error');
    }
  };

  // --- AUTOMATIONS API ---
  const toggleAutomation = async (id: string) => {
    const auto = automations.find(a => a.id === id);
    if (!auto) return;
    try {
      const res = await apiFetch(`/api/automations/${id}/toggle`, { method: 'PUT' });
      addToast(`Automação "${auto.name}" ${res.is_active ? 'ativada' : 'desativada'}`, 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao alternar automação.', 'error');
    }
  };

  // --- CONNECTED ACCOUNTS API ---
  const connectAccount = async (platform: ConnectedAccount['platform'], accountName: string) => {
    try {
      await apiFetch('/api/connected-accounts', {
        method: 'POST',
        body: JSON.stringify({ platform, accountName })
      });
      addToast(`Conta ${platform.toUpperCase()} conectada!`, 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao conectar conta.', 'error');
    }
  };

  const disconnectAccount = async (id: string) => {
    const target = connectedAccounts.find((c) => c.id === id);
    if (!target) return;
    try {
      await apiFetch(`/api/connected-accounts/${id}`, { method: 'DELETE' });
      addToast(`Conta ${target.platform.toUpperCase()} desconectada.`, 'info');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao desconectar conta.', 'error');
    }
  };

  const forceSync = async () => {
    addToast('Sincronização forçada iniciada...', 'info');
    try {
      await apiFetch('/api/connected-accounts/sync', { method: 'POST' });
      addToast('Todas as contas e métricas sincronizadas com sucesso!', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao sincronizar contas.', 'error');
    }
  };

  // --- NOTIFICATIONS API ---
  const markNotificationAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      addToast('Todas as notificações marcadas como lidas.', 'success');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao ler notificações.', 'error');
    }
  };

  const clearNotifications = async () => {
    try {
      await apiFetch('/api/notifications', { method: 'DELETE' });
      addToast('Notificações limpas.', 'info');
      loadUserData();
    } catch (err: any) {
      addToast(err.message || 'Erro ao limpar notificações.', 'error');
    }
  };

  // --- ADMIN AND ASAAS OPERATIONS ---
  const adminCreateCompany = async (
    email: string,
    firstName: string,
    lastName: string,
    companyName: string,
    plan: 'free' | 'starter' | 'professional'
  ) => {
    try {
      await apiFetch('/api/admin/users/create', {
        method: 'POST',
        body: JSON.stringify({ email, firstName, lastName, companyName, plan })
      });
      addToast(`Empresa "${companyName}" criada com sucesso!`, 'success');
      loadAdminUsers();
    } catch (err: any) {
      addToast(err.message || 'Erro ao cadastrar empresa.', 'error');
    }
  };

  const adminUpdateCompanyFeatures = async (
    userId: string,
    data: { plan: 'free' | 'starter' | 'professional'; features: UserFeatures; isBlocked: boolean }
  ) => {
    try {
      await apiFetch('/api/admin/users/update-features', {
        method: 'POST',
        body: JSON.stringify({ userId, plan: data.plan, features: data.features, isBlocked: data.isBlocked })
      });
      addToast('Recursos da empresa atualizados pelo admin.', 'success');
      loadAdminUsers();
      if (currentUser && currentUser.id === userId) {
        const me = await apiFetch('/api/auth/me');
        setCurrentUser(me.user);
      }
    } catch (err: any) {
      addToast(err.message || 'Erro ao atualizar dados da empresa.', 'error');
    }
  };

  const simulateAsaasUpgrade = async (
    plan: 'starter' | 'professional',
    paymentMethod: 'pix' | 'credit_card' | 'boleto',
    value: number
  ): Promise<boolean> => {
    addToast('Processando pagamento Asaas...', 'info');
    try {
      await apiFetch('/api/payments/asaas-upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan, paymentMethod, value })
      });
      const me = await apiFetch('/api/auth/me');
      setCurrentUser(me.user);
      loadUserData();
      addToast(`Fatura paga! Plano atualizado para ${plan.toUpperCase()}!`, 'success');
      return true;
    } catch (err: any) {
      addToast(err.message || 'Erro no pagamento Asaas.', 'error');
      return false;
    }
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
        allUsers,
        invoices,
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
        clearNotifications,
        adminCreateCompany,
        adminUpdateCompanyFeatures,
        simulateAsaasUpgrade
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
