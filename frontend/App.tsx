import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Requests } from './pages/Requests';
import { ImpactAnalysis } from './pages/ImpactAnalysis';
import { PublicTracker } from './pages/PublicTracker';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [userRole, setUserRole] = useState<'analyst' | 'citizen' | null>(null);

  // Simple Auth Simulation
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yucatan-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="bg-yucatan-600 p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">CRAC</h1>
            <p className="text-yucatan-100">Prototipo de Inteligencia Artificial<br/>Gobierno de Yucatán</p>
          </div>
          <div className="p-8 space-y-4">
             <button 
               onClick={() => setUserRole('citizen')}
               className="w-full py-4 px-6 border-2 border-yucatan-600 text-yucatan-800 rounded-xl font-bold hover:bg-yucatan-50 transition-colors flex items-center justify-center gap-2 group"
             >
               Soy Ciudadano
             </button>
             
             <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Acceso Interno</span>
                <div className="flex-grow border-t border-gray-200"></div>
             </div>

             <button 
               onClick={() => {
                 setUserRole('analyst');
                 setCurrentView('dashboard');
               }}
               className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
             >
               Soy Funcionario / Analista
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView}
      userRole={userRole}
      onLogout={() => setUserRole(null)}
    >
      {userRole === 'citizen' ? (
        <PublicTracker />
      ) : (
        <>
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'requests' && <Requests />}
          {currentView === 'impact' && <ImpactAnalysis />}
        </>
      )}
    </Layout>
  );
}

export default App;
