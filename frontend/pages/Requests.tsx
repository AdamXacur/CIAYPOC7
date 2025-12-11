import React, { useState } from 'react';
import { Search, Filter, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { MOCK_REQUESTS } from '../constants';
import { Topic, Status, Sentiment } from '../types';

const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
    'Recibida': 'bg-gray-100 text-gray-800',
    'En revisión': 'bg-blue-100 text-blue-800',
    'Atendida': 'bg-green-100 text-green-800',
    'Rechazada': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${styles[status]}`}>
      {status}
    </span>
  );
};

const SentimentIndicator = ({ sentiment }: { sentiment: Sentiment }) => {
  const styles = {
    'Positivo': 'text-green-500',
    'Neutro': 'text-gray-400',
    'Negativo': 'text-red-500',
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${styles[sentiment].replace('text-', 'bg-')}`}></div>
      <span className={`text-sm ${styles[sentiment]}`}>{sentiment}</span>
    </div>
  );
};

export const Requests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [topicFilter, setTopicFilter] = useState<Topic | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');

  const filteredRequests = MOCK_REQUESTS.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          req.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = topicFilter === 'All' || req.topic === topicFilter;
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesTopic && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Gestión de Solicitudes</h2>
           <p className="text-gray-500 text-sm">Monitoreo y clasificación automática (NLP)</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
             <Filter size={16} /> Filtros Avanzados
           </button>
           <button className="px-4 py-2 bg-yucatan-600 text-white rounded-lg text-sm font-medium hover:bg-yucatan-700 shadow-sm">
             Exportar CSV
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por folio, descripción o ubicación..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yucatan-200 focus:border-yucatan-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="w-full md:w-48 p-2 border border-gray-300 rounded-md text-sm bg-gray-50"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value as any)}
        >
          <option value="All">Todos los Temas</option>
          <option value="Seguridad">Seguridad</option>
          <option value="Transporte">Transporte</option>
          <option value="Salud">Salud</option>
          <option value="Servicios Públicos">Servicios Públicos</option>
        </select>

        <select 
          className="w-full md:w-48 p-2 border border-gray-300 rounded-md text-sm bg-gray-50"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="All">Todos los Estados</option>
          <option value="Recibida">Recibida</option>
          <option value="En revisión">En revisión</option>
          <option value="Atendida">Atendida</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Folio / Fecha</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tema / Dpto</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Descripción</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentimiento</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr key={req.id} className={`hover:bg-gray-50 transition-colors ${req.urgency === 'Crítica' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{req.folio}</div>
                    <div className="text-xs text-gray-500">{req.date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.topic}</div>
                    <div className="text-xs text-gray-500">{req.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 truncate max-w-xs" title={req.description}>{req.description}</p>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      📍 {req.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SentimentIndicator sentiment={req.sentiment} />
                  </td>
                  <td className="px-6 py-4">
                     {req.urgency === 'Crítica' || req.urgency === 'Alta' ? (
                        <span className="flex items-center text-xs font-bold text-red-600 gap-1 bg-red-100 px-2 py-1 rounded">
                          <AlertCircle size={12} /> {req.urgency}
                        </span>
                     ) : (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{req.urgency}</span>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-yucatan-600 transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No se encontraron solicitudes con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
