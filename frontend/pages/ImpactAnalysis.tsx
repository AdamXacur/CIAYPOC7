import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MOCK_ACTIONS, TREND_DATA } from '../constants';
import { ArrowRight, Calendar } from 'lucide-react';

export const ImpactAnalysis: React.FC = () => {
  // Combine data logic simulated for the POC
  // In a real app, this would be a complex join on the backend
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Análisis de Impacto Gubernamental</h2>
        <p className="text-gray-500">Correlación entre acciones de gobierno y volumen de solicitudes ciudadanas (RF-W-04).</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Impacto en Transporte y Seguridad</h3>
        <p className="text-sm text-gray-500 mb-6">
          Visualización del volumen de quejas vs. hitos de intervención gubernamental. 
          Observe cómo las intervenciones (Barras verticales) afectan la tendencia de quejas (Líneas).
        </p>
        
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={TREND_DATA}>
              <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" scale="point" padding={{ left: 20, right: 20 }} fontSize={12} stroke="#9ca3af" />
              <YAxis yAxisId="left" fontSize={12} stroke="#9ca3af" label={{ value: 'Solicitudes', angle: -90, position: 'insideLeft' }}/>
              <Tooltip />
              <Legend />
              
              <Line yAxisId="left" type="monotone" dataKey="Transporte" stroke="#cf8f41" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              <Line yAxisId="left" type="monotone" dataKey="Seguridad" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              
              {/* Simulated "Actions" visual overlay - in a real chart we might use ReferenceLines, but bars work for correlation visualization if data aligned */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-gray-500 border-t pt-4 border-gray-100">
           <span>ℹ️ Las líneas representan el volumen diario de quejas.</span>
           <span>ℹ️ Se busca identificar descensos posteriores a fechas clave.</span>
        </div>
      </div>

      {/* Action Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Bitácora de Acciones Recientes</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_ACTIONS.map(action => (
            <div key={action.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 md:w-48 text-gray-500">
                <Calendar size={18} />
                <span className="text-sm font-medium">{action.date}</span>
              </div>
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold uppercase">{action.type}</span>
                   <span className="text-xs text-gray-400">•</span>
                   <span className="text-xs font-semibold text-gray-600">{action.relatedTopic}</span>
                 </div>
                 <p className="text-gray-800 text-sm">{action.description}</p>
              </div>
              <div className="md:w-32 flex justify-end">
                <button className="text-yucatan-600 text-sm font-medium hover:underline flex items-center">
                  Ver Impacto <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
