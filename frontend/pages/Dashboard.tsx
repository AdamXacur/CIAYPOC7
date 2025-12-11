import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { AlertTriangle, TrendingUp, Users, BrainCircuit, Sparkles, XCircle } from 'lucide-react';
import { MOCK_ALERTS, TREND_DATA, MOCK_REQUESTS } from '../constants';
import { generateExecutiveReport } from '../services/geminiService';
import { Alert } from '../types';

export const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    const report = await generateExecutiveReport(MOCK_REQUESTS, TREND_DATA);
    setAiReport(report);
    setIsGenerating(false);
  };

  // Calculate generic stats
  const totalRequests = 1240;
  const criticalCount = MOCK_REQUESTS.filter(r => r.urgency === 'Crítica').length + 5; // +5 simulated
  const satisfactionRate = 78;

  return (
    <div className="space-y-6">
      {/* RF-W-05: Visual Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg flex items-start justify-between shadow-sm border-l-4 ${
                alert.type === 'critical' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-amber-50 border-amber-500 text-amber-900'
              }`}
            >
              <div className="flex gap-3">
                <AlertTriangle className={alert.type === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    {alert.type === 'critical' ? 'Alerta Crítica Detectada' : 'Aviso de Tendencia'}
                  </h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              <button onClick={() => dismissAlert(alert.id)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Solicitudes (Mes)</p>
              <h2 className="text-3xl font-bold text-gray-800">{totalRequests}</h2>
              <span className="text-xs text-green-600 font-medium flex items-center mt-2">
                <TrendingUp size={14} className="mr-1" /> +12% vs mes anterior
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Casos Críticos Activos</p>
              <h2 className="text-3xl font-bold text-red-600">{criticalCount}</h2>
              <span className="text-xs text-red-600 font-medium flex items-center mt-2">
                <AlertTriangle size={14} className="mr-1" /> Requieren atención inmediata
              </span>
            </div>
            <div className="p-3 bg-red-50 rounded-full text-red-600">
              <ActivityIcon size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Índice de Satisfacción</p>
              <h2 className="text-3xl font-bold text-yucatan-600">{satisfactionRate}%</h2>
              <span className="text-xs text-gray-500 mt-2 block">
                Basado en análisis de sentimiento NLP
              </span>
            </div>
            <div className="p-3 bg-yucatan-100 rounded-full text-yucatan-600">
              <BrainCircuit size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* RF-W-03: Trends Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Tendencia de Solicitudes por Tema (Última Semana)</h3>
          <select className="text-sm border-gray-200 rounded-md shadow-sm focus:border-yucatan-500 focus:ring focus:ring-yucatan-200 focus:ring-opacity-50">
            <option>Últimos 7 días</option>
            <option>Último mes</option>
          </select>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cf8f41" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#cf8f41" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Legend />
              <Area type="monotone" dataKey="Transporte" stroke="#cf8f41" fillOpacity={1} fill="url(#colorTrans)" />
              <Area type="monotone" dataKey="Seguridad" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSeg)" />
              <Area type="monotone" dataKey="Servicios" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gemini AI Integration */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-4 opacity-10">
            <BrainCircuit size={120} />
         </div>
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Sparkles className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold">Resumen de Inteligencia Artificial</h3>
           </div>
           
           {!aiReport && !isGenerating && (
             <div className="text-indigo-200 mb-6">
               <p>Utilice la potencia de Gemini para analizar los patrones actuales de las solicitudes ciudadanas y generar recomendaciones de política pública.</p>
             </div>
           )}

           {isGenerating && (
              <div className="animate-pulse space-y-3 py-4">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
                <div className="h-4 bg-white/20 rounded w-5/6"></div>
              </div>
           )}

           {aiReport && (
             <div className="prose prose-invert prose-sm max-w-none bg-white/10 p-4 rounded-lg mb-4 backdrop-blur-sm border border-white/10">
               <div dangerouslySetInnerHTML={{ __html: aiReport.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
             </div>
           )}

           <button 
             onClick={handleGenerateReport}
             disabled={isGenerating}
             className="bg-yucatan-500 hover:bg-yucatan-400 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg flex items-center gap-2"
           >
             {isGenerating ? 'Analizando...' : 'Generar Análisis Ejecutivo'}
             {!isGenerating && <Sparkles size={16} />}
           </button>
         </div>
      </div>
    </div>
  );
};

const ActivityIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
