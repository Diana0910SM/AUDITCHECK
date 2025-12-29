
import React from 'react';
import { ComparisonDetail, HeaderComparison, PedimentoPartida } from '../types';

interface ComparisonTableProps {
  headerDiffs: HeaderComparison[];
  partidaDiffs: ComparisonDetail[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ headerDiffs, partidaDiffs }) => {
  
  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === 'N/A' || val === '-') return '-';
    if (typeof val === 'number') {
      return val.toLocaleString('es-MX', { 
        minimumFractionDigits: Number.isInteger(val) ? 0 : 3,
        maximumFractionDigits: 3
      });
    }
    return String(val);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
      {/* Título Principal */}
      <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-[#003b8e] rounded-full"></div>
          <h2 className="text-sm font-black text-[#003b8e] uppercase tracking-[0.2em]">
            Resultados del Cotejo Automático
          </h2>
        </div>
        <div className="px-4 py-1 bg-blue-100 rounded-full">
          <span className="text-[10px] font-black text-[#003b8e] uppercase tracking-widest">Auditoría Finalizada</span>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* TABLA DE ENCABEZADO */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-white text-[10px] font-black uppercase tracking-widest">
                <th className="bg-slate-800 px-6 py-4 text-left border-r border-slate-700/30">Concepto General</th>
                <th className="bg-[#003b8e] px-6 py-4 text-center border-r border-white/10">Datos Pedimento</th>
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

        {/* TABLA DE PARTIDAS (Estilo Space Aduanas) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px] text-center">
              <thead>
                {/* Primera fila: Cabeceras de Grupo */}
                <tr>
                  <th rowSpan={2} className="bg-slate-800 text-white w-24 border-r border-slate-700">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Partida</span>
                      <span className="text-xs font-black">NÚMERO</span>
                    </div>
                  </th>
                  <th colSpan={6} className="bg-[#003b8e] text-white py-3 text-[10px] font-black uppercase tracking-[0.3em] border-r border-white/10">
                    Sección Pedimento
                  </th>
                  <th colSpan={6} className="bg-slate-700 text-white py-3 text-[10px] font-black uppercase tracking-[0.3em]">
                    Sección Contraparte
                  </th>
                </tr>
                {/* Segunda fila: Columnas Específicas */}
                <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="py-2.5 border-r border-slate-800">Fracción</th>
                  <th className="py-2.5 border-r border-slate-800">Nico</th>
                  <th className="py-2.5 border-r border-slate-800">UMC</th>
                  <th className="py-2.5 border-r border-slate-800">Cant. UMC</th>
                  <th className="py-2.5 border-r border-slate-800">UMT</th>
                  <th className="py-2.5 border-r border-slate-600">Cant. UMT</th>
                  
                  <th className="py-2.5 border-r border-slate-800">Fracción</th>
                  <th className="py-2.5 border-r border-slate-800">Nico</th>
                  <th className="py-2.5 border-r border-slate-800">UMC</th>
                  <th className="py-2.5 border-r border-slate-800">Cant. UMC</th>
                  <th className="py-2.5 border-r border-slate-800">UMT</th>
                  <th className="py-2.5">Cant. UMT</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-slate-600 font-medium">
                {partidaDiffs.map((p, i) => (
                  <tr 
                    key={i} 
                    className={`border-b border-slate-100 transition-all ${p.hasDiff ? 'bg-rose-50' : 'bg-white hover:bg-slate-50'}`}
                  >
                    <td className="py-4 font-black text-slate-400 border-r border-slate-100 bg-slate-50/50">
                      {p.pA?.partidasAgrupadas?.[0] || i + 1}
                    </td>

                    {/* Pedimento */}
                    <td className="py-4 border-r border-slate-50">{p.pA?.fraccion || '-'}</td>
                    <td className="py-4 border-r border-slate-50">{p.pA?.nico || '-'}</td>
                    <td className="py-4 border-r border-slate-50">{p.pA?.umc || '-'}</td>
                    <td className="py-4 border-r border-slate-50 font-black text-slate-900">{formatVal(p.pA?.cantidadUmc)}</td>
                    <td className="py-4 border-r border-slate-50">{p.pA?.umt || '-'}</td>
                    <td className="py-4 border-r border-slate-200 font-black text-slate-900">{formatVal(p.pA?.cantidadUmt)}</td>
                    
                    {/* Contraparte */}
                    <td className="py-4 border-r border-slate-50">{p.pB?.fraccion || '-'}</td>
                    <td className="py-4 border-r border-slate-50">{p.pB?.nico || '-'}</td>
                    <td className="py-4 border-r border-slate-50">{p.pB?.umc || '-'}</td>
                    <td className="py-4 border-r border-slate-50 font-black text-slate-900">{formatVal(p.pB?.cantidadUmc)}</td>
                    <td className="py-4 border-r border-slate-50">{p.pB?.umt || '-'}</td>
                    <td className="py-4 font-black text-slate-900">{formatVal(p.pB?.cantidadUmt)}</td>
                  </tr>
                ))}
                
                {/* FILA DE TOTALES */}
                <tr className="bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest">
                  <td className="py-4 border-r border-slate-700">TOTALES</td>
                  
                  <td colSpan={3} className="bg-slate-900/50 border-r border-slate-700"></td>
                  <td className="py-4 border-r border-slate-700 text-xs">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmc || 0), 0))}
                  </td>
                  <td className="border-r border-slate-700"></td>
                  <td className="py-4 border-r border-slate-600 text-xs">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmt || 0), 0))}
                  </td>
                  
                  <td colSpan={3} className="bg-slate-900/50 border-r border-slate-700"></td>
                  <td className="py-4 border-r border-slate-700 text-xs">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmc || 0), 0))}
                  </td>
                  <td className="border-r border-slate-700"></td>
                  <td className="py-4 text-xs">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmt || 0), 0))}
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
