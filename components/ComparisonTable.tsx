
import React from 'react';
import { ComparisonDetail, HeaderComparison, PedimentoPartida } from '../types';

interface ComparisonTableProps {
  headerDiffs: HeaderComparison[];
  partidaDiffs: ComparisonDetail[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ headerDiffs, partidaDiffs }) => {
  
  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === 'N/A' || val === '' || val === '-') return '-';
    if (typeof val === 'number') {
      return val.toLocaleString('es-MX', { 
        minimumFractionDigits: Number.isInteger(val) ? 0 : 3,
        maximumFractionDigits: 3
      });
    }
    return String(val);
  };

  const isDiff = (valA: any, valB: any) => {
    if (typeof valA === 'number' && typeof valB === 'number') {
      return Math.abs(valA - valB) > 0.01;
    }
    const a = String(valA || '').trim().toLowerCase();
    const b = String(valB || '').trim().toLowerCase();
    return a !== b;
  };

  const totalUmcA = partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmc || 0), 0);
  const totalUmcB = partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmc || 0), 0);
  const totalUmtA = partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmt || 0), 0);
  const totalUmtB = partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmt || 0), 0);

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      {/* Título Principal */}
      <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-[#003b8e] rounded-full"></div>
          <h2 className="text-sm font-black text-[#003b8e] uppercase tracking-[0.2em]">
            Panel de Auditoría Detallada
          </h2>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden lg:flex items-center space-x-4 border-r border-slate-200 pr-6">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-rose-100 border border-rose-300 rounded-sm"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Discrepancia</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-rose-600 font-black">-</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">No Detectado</span>
            </div>
          </div>
          <div className="px-4 py-1 bg-blue-100 rounded-full">
            <span className="text-[10px] font-black text-[#003b8e] uppercase tracking-widest">{partidaDiffs.length} Registros Consolidados</span>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* RESUMEN DE TOTALES CRÍTICOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border-2 transition-all ${Math.abs(totalUmcA - totalUmcB) > 0.01 ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-blue-50/50 border-blue-100 shadow-blue-50'} shadow-lg group hover:-translate-y-1 duration-300`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sumatoria Total UMC</span>
              {Math.abs(totalUmcA - totalUmcB) > 0.01 && (
                <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Error en Suma</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">SPACE</p>
                <p className="text-2xl font-black text-[#003b8e]">{formatVal(totalUmcA)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Contraparte</p>
                <p className={`text-2xl font-black ${Math.abs(totalUmcA - totalUmcB) > 0.01 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatVal(totalUmcB)}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border-2 transition-all ${Math.abs(totalUmtA - totalUmtB) > 0.01 ? 'bg-rose-50 border-rose-200 shadow-rose-100' : 'bg-slate-50 border-slate-200 shadow-slate-100'} shadow-lg group hover:-translate-y-1 duration-300`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sumatoria Total UMT</span>
              {Math.abs(totalUmtA - totalUmtB) > 0.01 && (
                <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Error en Suma</span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">SPACE</p>
                <p className="text-2xl font-black text-[#003b8e]">{formatVal(totalUmtA)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Contraparte</p>
                <p className={`text-2xl font-black ${Math.abs(totalUmtA - totalUmtB) > 0.01 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatVal(totalUmtB)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE ENCABEZADO */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-white text-[10px] font-black uppercase tracking-widest">
                <th className="bg-slate-800 px-6 py-4 text-left border-r border-slate-700/30">Concepto General</th>
                <th className="bg-[#003b8e] px-6 py-4 text-center border-r border-white/10">Datos Pedimento (SPACE)</th>
                <th className="bg-slate-700 px-6 py-4 text-center">Datos Contraparte</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {headerDiffs.map((h, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-slate-100 transition-colors ${h.status === 'mismatch' ? 'bg-rose-50/80' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-3 font-bold text-slate-500 uppercase tracking-tight border-r border-slate-100">{h.field}</td>
                  <td className={`px-6 py-3 text-center border-r border-slate-100 font-semibold ${h.status === 'mismatch' ? 'text-rose-700' : 'text-slate-700'}`}>
                    {formatVal(h.valA)}
                  </td>
                  <td className={`px-6 py-3 text-center font-semibold ${h.status === 'mismatch' ? 'text-rose-700' : 'text-slate-700'}`}>
                    {formatVal(h.valB)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLA DE PARTIDAS DETALLADA */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1400px] text-center table-fixed">
              <thead>
                <tr>
                  <th colSpan={7} className="bg-[#003b8e] text-white py-3 text-[10px] font-black uppercase tracking-[0.3em] border-r border-white/10">
                    Sección Pedimento (SPACE)
                  </th>
                  <th colSpan={7} className="bg-slate-700 text-white py-3 text-[10px] font-black uppercase tracking-[0.3em]">
                    Sección Contraparte
                  </th>
                </tr>
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                  {/* SPACE Subheaders */}
                  <th className="py-2.5 w-24 bg-slate-800 border-r border-slate-700">Partida</th>
                  <th className="py-2.5 border-r border-slate-800">Fracción</th>
                  <th className="py-2.5 border-r border-slate-800">Nico</th>
                  <th className="py-2.5 border-r border-slate-800">UMC</th>
                  <th className="py-2.5 border-r border-slate-800 font-bold text-blue-300">Cant. UMC</th>
                  <th className="py-2.5 border-r border-slate-800">UMT</th>
                  <th className="py-2.5 border-r border-slate-600 font-bold text-blue-300">Cant. UMT</th>
                  
                  {/* Contraparte Subheaders */}
                  <th className="py-2.5 w-24 bg-slate-800 border-r border-slate-700">Partida</th>
                  <th className="py-2.5 border-r border-slate-800">Fracción</th>
                  <th className="py-2.5 border-r border-slate-800">Nico</th>
                  <th className="py-2.5 border-r border-slate-800">UMC</th>
                  <th className="py-2.5 border-r border-slate-800 font-bold text-rose-300">Cant. UMC</th>
                  <th className="py-2.5 border-r border-slate-800">UMT</th>
                  <th className="py-2.5 font-bold text-rose-300">Cant. UMT</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-slate-600 font-medium">
                {partidaDiffs.map((p, i) => (
                  <tr 
                    key={i} 
                    className={`border-b border-slate-100 transition-all ${p.hasDiff ? 'bg-rose-50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    {/* --- SPACE SECTION --- */}
                    <td className="py-4 font-black text-slate-400 border-r border-slate-100 bg-slate-50/50 break-words px-1 overflow-hidden">
                      {p.pA?.partidasAgrupadas?.join(', ') || '-'}
                    </td>
                    <td className={`py-4 border-r border-slate-50 ${isDiff(p.pA?.fraccion, p.pB?.fraccion) ? 'text-rose-700 font-black' : ''}`}>
                      {formatVal(p.pA?.fraccion)}
                      {p.pA?.reglaOctavaAplicada && <span className="block text-[8px] text-blue-500 font-black">R8</span>}
                    </td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pA?.nico)}</td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pA?.umc)}</td>
                    <td className={`py-4 border-r border-slate-50 font-black ${isDiff(p.pA?.cantidadUmc, p.pB?.cantidadUmc) ? 'text-rose-700 bg-rose-100/30' : 'text-slate-900'}`}>
                      {formatVal(p.pA?.cantidadUmc)}
                    </td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pA?.umt)}</td>
                    <td className={`py-4 border-r border-slate-200 font-black ${isDiff(p.pA?.cantidadUmt, p.pB?.cantidadUmt) ? 'text-rose-700 bg-rose-100/30' : 'text-slate-900'}`}>
                      {formatVal(p.pA?.cantidadUmt)}
                    </td>
                    
                    {/* --- CONTRAPARTE SECTION --- */}
                    <td className="py-4 font-black text-slate-400 border-r border-slate-100 bg-slate-50/50 break-words px-1 overflow-hidden">
                      {p.pB?.partidasAgrupadas?.join(', ') || '-'}
                    </td>
                    <td className={`py-4 border-r border-slate-50 ${isDiff(p.pA?.fraccion, p.pB?.fraccion) ? 'text-rose-700 font-black' : ''}`}>
                      {formatVal(p.pB?.fraccion)}
                    </td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pB?.nico)}</td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pB?.umc)}</td>
                    <td className={`py-4 border-r border-slate-50 font-black ${isDiff(p.pA?.cantidadUmc, p.pB?.cantidadUmc) ? 'text-rose-700 bg-rose-100/30' : 'text-slate-900'}`}>
                      {formatVal(p.pB?.cantidadUmc)}
                    </td>
                    <td className="py-4 border-r border-slate-50">{formatVal(p.pB?.umt)}</td>
                    <td className={`py-4 font-black ${isDiff(p.pA?.cantidadUmt, p.pB?.cantidadUmt) ? 'text-rose-700 bg-rose-100/30' : 'text-slate-900'}`}>
                      {formatVal(p.pB?.cantidadUmt)}
                    </td>
                  </tr>
                ))}
                
                {/* FILA DE TOTALES EN LA TABLA */}
                <tr className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest sticky bottom-0">
                  <td className="py-4 border-r border-slate-700 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.2)]">TOTALES</td>
                  <td colSpan={3} className="bg-slate-900/50 border-r border-slate-700 text-right pr-4 text-[8px] opacity-40 italic">Σ UMC:</td>
                  <td className={`py-4 border-r border-slate-700 text-xs ${Math.abs(totalUmcA - totalUmcB) > 0.01 ? 'text-rose-400 bg-rose-900/40' : 'text-blue-300'}`}>
                    {formatVal(totalUmcA)}
                  </td>
                  <td className="border-r border-slate-700 text-right pr-4 text-[8px] opacity-40 italic">Σ UMT:</td>
                  <td className={`py-4 border-r border-slate-600 text-xs ${Math.abs(totalUmtA - totalUmtB) > 0.01 ? 'text-rose-400 bg-rose-900/40' : 'text-blue-300'}`}>
                    {formatVal(totalUmtA)}
                  </td>
                  
                  <td className="py-4 border-r border-slate-700 bg-slate-800">TOTALES</td>
                  <td colSpan={3} className="bg-slate-900/50 border-r border-slate-700 text-right pr-4 text-[8px] opacity-40 italic">Σ UMC:</td>
                  <td className={`py-4 border-r border-slate-700 text-xs ${Math.abs(totalUmcA - totalUmcB) > 0.01 ? 'text-rose-400 bg-rose-900/40' : 'text-slate-300'}`}>
                    {formatVal(totalUmcB)}
                  </td>
                  <td className="border-r border-slate-700 text-right pr-4 text-[8px] opacity-40 italic">Σ UMT:</td>
                  <td className={`py-4 text-xs ${Math.abs(totalUmtA - totalUmtB) > 0.01 ? 'text-rose-400 bg-rose-900/40' : 'text-slate-300'}`}>
                    {formatVal(totalUmtB)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
