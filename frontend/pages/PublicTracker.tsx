import React, { useState } from 'react';
import { Search, CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { MOCK_REQUESTS } from '../constants';
import { CitizenRequest } from '../types';

export const PublicTracker: React.FC = () => {
  const [folioInput, setFolioInput] = useState('');
  const [result, setResult] = useState<CitizenRequest | null | 'not-found'>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = MOCK_REQUESTS.find(r => r.folio.toLowerCase() === folioInput.toLowerCase());
    setResult(found || 'not-found');
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Rastreador Ciudadano</h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Consulte el estado de su solicitud en tiempo real ingresando su número de folio asignado.
          Transparencia y eficiencia para todos los yucatecos.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-yucatan-100 overflow-hidden">
        <div className="bg-yucatan-600 p-8 text-center">
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
             <input
               type="text"
               placeholder="Ej: YUC-2024-001"
               className="w-full pl-6 pr-14 py-4 rounded-full shadow-lg text-gray-800 outline-none focus:ring-4 focus:ring-yucatan-300 text-lg"
               value={folioInput}
               onChange={(e) => setFolioInput(e.target.value)}
             />
             <button 
               type="submit"
               className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition-colors"
             >
               <ArrowRight size={24} />
             </button>
          </form>
          <p className="text-yucatan-100 text-sm mt-4">Ingrese el folio tal como aparece en su comprobante.</p>
        </div>

        <div className="p-8 min-h-[300px] flex items-center justify-center bg-gray-50">
           {!result && (
             <div className="text-center text-gray-400">
               <Search size={48} className="mx-auto mb-4 opacity-20" />
               <p>Los resultados de su búsqueda aparecerán aquí.</p>
             </div>
           )}

           {result === 'not-found' && (
             <div className="text-center text-red-500">
                <FileText size={48} className="mx-auto mb-4" />
                <h3 className="text-lg font-bold">Folio no encontrado</h3>
                <p className="text-sm mt-2 text-gray-600">Verifique que el número sea correcto e intente nuevamente.</p>
             </div>
           )}

           {typeof result === 'object' && result !== null && (
             <div className="w-full animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 mb-6">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Folio</span>
                    <h3 className="text-2xl font-bold text-gray-900">{result.folio}</h3>
                  </div>
                  <div className="mt-2 md:mt-0 text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha de Recepción</span>
                    <p className="text-gray-700 font-medium">{result.date}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                   <div className="flex items-center gap-4 mb-4">
                      {result.status === 'Atendida' ? (
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                           <CheckCircle size={24} />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                           <Clock size={24} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Estado Actual</p>
                        <p className={`text-lg font-bold ${result.status === 'Atendida' ? 'text-green-600' : 'text-blue-600'}`}>
                          {result.status.toUpperCase()}
                        </p>
                      </div>
                   </div>
                   
                   <div className="w-full bg-gray-200 h-2.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${result.status === 'Atendida' ? 'bg-green-500 w-full' : 'bg-blue-500 w-1/2'}`}
                      ></div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Dependencia Asignada</h4>
                     <p className="text-gray-800 font-medium">{result.department}</p>
                   </div>
                   <div>
                     <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Tema Clasificado</h4>
                     <p className="text-gray-800 font-medium">{result.topic}</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
