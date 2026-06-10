import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  BarChart3,
  Link2,
  Settings,
  Bell,
  Sun,
  Moon,
  Search,
  LogOut,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  X,
  Shield
} from 'lucide-react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    theme,
    setTheme,
    logout,
    searchQuery,
    setSearchQuery
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Click outside hooks to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'ads', label: 'Anúncios', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integrations', label: 'Integrações', icon: Link2 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (currentUser?.isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  if (currentUser?.isBlocked) {
    return (
      <div className="blocked-screen">
        <div className="blocked-card animate-pop">
          <div className="blocked-icon-box">
            <AlertTriangle size={48} color="var(--color-error)" />
          </div>
          <h2>Conta Suspensa</h2>
          <p>
            Seu acesso ao <strong>Social App</strong> foi suspenso temporariamente pelo administrador do sistema ou por pendências financeiras.
          </p>
          <div className="blocked-details">
            <span>Empresa: {currentUser.company_name}</span>
            <span>E-mail: {currentUser.email}</span>
          </div>
          <button onClick={logout} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Sair da Conta
          </button>
        </div>
        <style>{`
          .blocked-screen {
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--bg-app);
            padding: 1.5rem;
          }
          .blocked-card {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 3rem 2rem;
            max-width: 480px;
            width: 100%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: var(--shadow-lg);
          }
          .blocked-icon-box {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: rgba(239, 68, 68, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
          }
          .blocked-card h2 {
            font-size: 1.5rem;
            color: var(--text-primary);
            margin-bottom: 0.75rem;
            font-weight: 700;
          }
          .blocked-card p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            line-height: 1.5;
            margin-bottom: 1.5rem;
          }
          .blocked-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: 2rem;
            background-color: var(--bg-app);
            padding: 0.75rem;
            border-radius: var(--radius-md);
            width: 100%;
            border: 1px solid var(--border-color);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Sparkles size={20} color="#FFFFFF" />
          </div>
          <span className="logo-text">Social</span>
          <span className="logo-badge">SaaS</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearchQuery(''); // reset search on tab change
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === 'calendar' && (
                  <span className="badge-count">Novo</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* UPGRADE PRO BANNER */}
        {currentUser?.plan !== 'professional' && !currentUser?.isAdmin && (
          <div className="upgrade-card">
            <div className="upgrade-header">
              <Sparkles size={16} className="upgrade-sparkle" />
              <span>Upgrade Pro</span>
            </div>
            <p className="upgrade-text">Liberte postagem ilimitada, automações IA e relatórios PDF.</p>
            <button onClick={() => setActiveTab('settings')} className="upgrade-btn">
              Atualizar Agora
            </button>
          </div>
        )}

        {/* USER PROFILE INFO BOTTOM */}
        <div className="sidebar-profile">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
            alt="Profile Avatar"
            className="profile-avatar"
            onClick={() => setActiveTab('settings')}
          />
          <div className="profile-info" onClick={() => setActiveTab('settings')}>
            <span className="profile-name">{currentUser?.first_name || 'Usuário'}</span>
            <span className="profile-company">{currentUser?.company_name || 'Sua Empresa'}</span>
          </div>
          <button onClick={logout} className="logout-btn" title="Sair da Conta">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN WRAPPER */}
      <div className="main-wrapper">
        {/* TOP BAR */}
        <header className="topbar">
          {/* SEARCH BAR */}
          <div className="search-bar">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar posts, campanhas ou automações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* TOP BAR ACTIONS */}
          <div className="topbar-actions">
            {/* THEME TOGGLE */}
            <button
              className="action-icon-btn"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* NOTIFICATIONS BELL */}
            <div className="notif-dropdown-wrapper" ref={notifRef}>
              <button
                className={`action-icon-btn ${unreadCount > 0 ? 'pulse-bell' : ''}`}
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notificações"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="notif-dropdown shadow-lg">
                  <div className="notif-header">
                    <span className="notif-title">Notificações</span>
                    <div className="notif-actions">
                      <button onClick={markAllNotificationsAsRead} className="notif-action-btn">
                        Lidas
                      </button>
                      <span className="notif-divider">|</span>
                      <button onClick={clearNotifications} className="notif-action-btn">
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <Bell size={28} className="notif-empty-icon" />
                        <p>Nenhuma notificação por aqui</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const Icon = {
                          post_published: CheckCircle2,
                          campaign_optimized: Sparkles,
                          low_performance: AlertTriangle,
                          new_comment: MessageCircle,
                        }[n.type] || HelpCircle;

                        const iconColor = {
                          post_published: 'var(--color-success)',
                          campaign_optimized: 'var(--color-primary)',
                          low_performance: 'var(--color-error)',
                          new_comment: 'var(--color-secondary)',
                        }[n.type] || 'var(--text-secondary)';

                        return (
                          <div
                            key={n.id}
                            className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              // Route to appropriate tab
                              if (n.type === 'post_published' || n.type === 'new_comment') {
                                setActiveTab('calendar');
                              } else if (n.type === 'campaign_optimized' || n.type === 'low_performance') {
                                setActiveTab('ads');
                              }
                              setNotifOpen(false);
                            }}
                          >
                            <div className="notif-item-icon" style={{ backgroundColor: `${iconColor}12`, color: iconColor }}>
                              <Icon size={16} />
                            </div>
                            <div className="notif-item-content">
                              <span className="notif-item-title">{n.title}</span>
                              <span className="notif-item-message">{n.message}</span>
                              <span className="notif-item-time">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.is_read && <span className="unread-dot"></span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK PROFILE MENU */}
            <div className="profile-menu-wrapper" ref={profileRef}>
              <div className="topbar-profile" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <img
                  src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80'}
                  alt="Profile"
                  className="profile-avatar-top"
                />
                <span className="profile-name-top">{currentUser?.first_name}</span>
              </div>

              {profileMenuOpen && (
                <div className="profile-menu shadow-lg">
                  <div className="profile-menu-header">
                    <span>{currentUser?.first_name} {currentUser?.last_name}</span>
                    <span className="profile-menu-email">{currentUser?.email}</span>
                  </div>
                  <div className="profile-menu-divider"></div>
                  <button onClick={() => { setActiveTab('settings'); setProfileMenuOpen(false); }} className="profile-menu-item">
                    <Settings size={14} /> Configurações
                  </button>
                  <button onClick={() => { setActiveTab('settings'); setProfileMenuOpen(false); }} className="profile-menu-item">
                    <HelpCircle size={14} /> Ajuda & Suporte
                  </button>
                  <div className="profile-menu-divider"></div>
                  <button onClick={() => { logout(); setProfileMenuOpen(false); }} className="profile-menu-item logout">
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGES MOUNT */}
        <main className="content-area animate-fade-in">
          {children}
        </main>
      </div>

      <style>{`
        .app-container {
          display: flex;
          width: 100vw;
          min-height: 100vh;
          overflow: hidden;
        }

        /* SIDEBAR STYLES */
        .sidebar {
          width: 260px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          flex-shrink: 0;
          height: 100vh;
          overflow-y: auto;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          padding-left: 0.5rem;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .logo-badge {
          font-size: 0.65rem;
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--color-primary);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
          font-weight: 600;
          text-transform: uppercase;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          flex-grow: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: left;
          width: 100%;
          transition: var(--transition-fast);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: var(--hover-bg);
        }

        .nav-item.active {
          color: var(--color-primary);
          background-color: rgba(59, 130, 246, 0.08);
          font-weight: 600;
        }

        .badge-count {
          margin-left: auto;
          background-color: var(--color-secondary);
          color: #FFFFFF;
          font-size: 0.65rem;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-weight: 600;
        }

        /* UPGRADE PRO CARD */
        .upgrade-card {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px dashed rgba(59, 130, 246, 0.3);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .upgrade-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .upgrade-sparkle {
          animation: pulse 2s infinite ease-in-out;
        }

        .upgrade-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .upgrade-btn {
          background-color: var(--color-primary);
          color: #FFFFFF;
          border: none;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
          width: 100%;
        }

        .upgrade-btn:hover {
          background-color: #2563EB;
          box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
        }

        /* SIDEBAR USER BOTTOM */
        .sidebar-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-color);
          margin-top: auto;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          object-fit: cover;
          cursor: pointer;
          border: 2px solid transparent;
          transition: var(--transition-fast);
        }
        .profile-avatar:hover {
          border-color: var(--color-primary);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow: hidden;
          cursor: pointer;
        }

        .profile-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-company {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.375rem;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout-btn:hover {
          color: var(--color-error);
          background-color: rgba(239, 68, 68, 0.08);
        }

        /* MAIN COLUMN WRAPPER */
        .main-wrapper {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* TOPBAR STYLES */
        .topbar {
          height: 70px;
          background-color: var(--bg-sidebar);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          flex-shrink: 0;
          z-index: 10;
          transition: background-color var(--transition-normal), border-color var(--transition-normal);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 0.5rem 1rem;
          width: 320px;
          max-width: 100%;
          transition: var(--transition-fast);
        }

        .search-bar:focus-within {
          width: 380px;
          border-color: var(--color-primary);
          background-color: var(--bg-card);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-icon {
          color: var(--text-secondary);
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          width: 100%;
        }

        .clear-search {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .action-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }

        .action-icon-btn:hover {
          background-color: var(--hover-bg);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .pulse-bell {
          animation: bellShake 1.5s ease infinite;
        }

        @keyframes bellShake {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(4deg); }
          60% { transform: rotate(-4deg); }
          75% { transform: rotate(2deg); }
        }

        .notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: var(--color-error);
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 700;
          height: 16px;
          min-width: 16px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-sidebar);
        }

        /* NOTIFICATIONS POPOVER DROPDOWN */
        .notif-dropdown-wrapper {
          position: relative;
        }

        .notif-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          width: 340px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          max-height: 400px;
          z-index: 100;
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .notif-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .notif-actions {
          display: flex;
          gap: 0.375rem;
          align-items: center;
        }

        .notif-action-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          color: var(--color-primary);
          cursor: pointer;
          font-weight: 500;
        }
        .notif-action-btn:hover {
          text-decoration: underline;
        }

        .notif-divider {
          font-size: 0.75rem;
          color: var(--border-color);
        }

        .notif-list {
          overflow-y: auto;
          flex-grow: 1;
        }

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1rem;
          color: var(--text-secondary);
          gap: 0.5rem;
        }

        .notif-empty-icon {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .notif-empty p {
          font-size: 0.8rem;
        }

        .notif-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
          position: relative;
          transition: var(--transition-fast);
        }

        .notif-item:hover {
          background-color: var(--hover-bg);
        }

        .notif-item.unread {
          background-color: rgba(59, 130, 246, 0.03);
        }

        .notif-item:last-child {
          border-bottom: none;
          border-bottom-left-radius: var(--radius-lg);
          border-bottom-right-radius: var(--radius-lg);
        }

        .notif-item-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-item-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          overflow: hidden;
        }

        .notif-item-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .notif-item-message {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-item-time {
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-primary);
          border-radius: var(--radius-full);
          position: absolute;
          top: 15px;
          right: 15px;
        }

        /* QUICK PROFILE MENU TOPBAR */
        .profile-menu-wrapper {
          position: relative;
        }

        .topbar-profile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          transition: var(--transition-fast);
        }

        .topbar-profile:hover {
          background-color: var(--hover-bg);
          border-color: var(--border-color);
        }

        .profile-avatar-top {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          object-fit: cover;
        }

        .profile-name-top {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .profile-menu {
          position: absolute;
          top: 45px;
          right: 0;
          width: 200px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          padding: 0.5rem 0;
          z-index: 100;
          animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .profile-menu-header {
          display: flex;
          flex-direction: column;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .profile-menu-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 400;
          margin-top: 1px;
        }

        .profile-menu-divider {
          height: 1px;
          background-color: var(--border-color);
          margin: 0.375rem 0;
        }

        .profile-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .profile-menu-item:hover {
          background-color: var(--hover-bg);
          color: var(--text-primary);
        }

        .profile-menu-item.logout {
          color: var(--color-error);
        }
        .profile-menu-item.logout:hover {
          background-color: rgba(239, 68, 68, 0.05);
        }

        /* MAIN CONTENT AREA BODY */
        .content-area {
          flex-grow: 1;
          overflow-y: auto;
          padding: 2rem;
          height: calc(100vh - 70px);
          background-color: var(--bg-app);
          transition: background-color var(--transition-normal);
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .sidebar {
            width: 70px;
            padding: 1rem 0.5rem;
          }
          .logo-text, .logo-badge, .nav-item span, .upgrade-card, .profile-info {
            display: none;
          }
          .logo-icon {
            margin: 0 auto;
          }
          .nav-item {
            justify-content: center;
            padding: 0.75rem;
          }
          .sidebar-profile {
            justify-content: center;
            border-top: none;
          }
          .logout-btn {
            display: none;
          }
          .profile-avatar {
            width: 32px;
            height: 32px;
          }
          .search-bar {
            width: 220px;
          }
          .profile-name-top {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
