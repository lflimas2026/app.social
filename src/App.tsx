import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { AdManager } from './components/AdManager';
import { Analytics } from './components/Analytics';
import { Integrations } from './components/Integrations';
import { Settings } from './components/Settings';
import { Admin } from './components/Admin';

const AppContent = () => {
  const { currentUser, activeTab } = useApp();

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <Layout>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'calendar' && <Calendar />}
      {activeTab === 'ads' && <AdManager />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'integrations' && <Integrations />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'admin' && <Admin />}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
