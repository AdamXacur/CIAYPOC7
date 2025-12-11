import React from 'react';
import { LayoutDashboard, FileText, Activity, Users, Menu, X, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  userRole: 'analyst' | 'citizen';
  onLogout: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      active 
        ? 'bg-yucatan-500 text-white shadow-md' 
        : 'text-gray-600 hover:bg-yucatan-100 hover:text-yucatan-800'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, userRole, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (userRole === 'citizen') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b border-yucatan-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="bg-yucatan-600 text-white p-1.5 rounded-md font-bold text-xl">CRAC</div>
               <span className="text-gray-800 font-bold hidden sm:block">Atención Ciudadana Yucatán</span>
            </div>
            <button onClick={onLogout} className="text-sm text-yucatan-700 hover:underline font-medium">
              Acceso Funcionarios
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-yucatan-50">
          <div className="bg-yucatan-600 text-white p-1.5 rounded-md font-bold text-lg mr-2">CRAC</div>
          <span className="text-gray-900 font-bold">Gobierno Yucatán</span>
        </div>

        <nav className="p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard IA" 
            active={currentView === 'dashboard'} 
            onClick={() => onChangeView('dashboard')} 
          />
          <SidebarItem 
            icon={FileText} 
            label="Solicitudes" 
            active={currentView === 'requests'} 
            onClick={() => onChangeView('requests')} 
          />
          <SidebarItem 
            icon={Activity} 
            label="Impacto y Acciones" 
            active={currentView === 'impact'} 
            onClick={() => onChangeView('impact')} 
          />
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yucatan-200 flex items-center justify-center text-yucatan-800 font-bold text-xs">
              AD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Analista</p>
            </div>
            <button onClick={onLogout} className="text-xs text-red-600 hover:underline">Salir</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <h1 className="text-xl font-semibold text-gray-800 ml-2 lg:ml-0">
            {currentView === 'dashboard' && 'Dashboard Estratégico'}
            {currentView === 'requests' && 'Gestión de Solicitudes'}
            {currentView === 'impact' && 'Análisis de Impacto'}
          </h1>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-yucatan-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
