
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
        minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
        maximumFractionDigits: 3
      });
    }
    return String(val);
  };

  const renderFraccionCell = (p: PedimentoPartida | undefined) => {
    if (!p) return <td className="px-2 py-4 text-center border-r border-slate-200 text-slate-300">-</td>;
    
    const isUnresolved98 = p.fraccion?.toString().startsWith('98');
    const nums = p.partidasAgrupadas || (p.numeroPartida ? [p.numeroPartida] : []);
    const partLabel = nums.length > 3 
      ? `Part. ${nums[0]}...${nums[nums.length-1]}`
      : `Part. ${nums.join(', ')}`;

    return (
      <td className={`px-2 py-4 text-center border-r border-slate-200 relative ${isUnresolved98 ? 'bg-rose-50' : ''}`}>
        <div className="flex flex-col items-center">
          {/* Indicador de número de partida solicitado */}
          <span className="text-[9px] font-black text-[#003b8e] opacity-60 uppercase mb-1">
            {partLabel}
          </span>
          
          <span className={`font-mono text-xs font-bold ${isUnresolved98 ? 'text-rose-600 underline decoration-wavy' : 'text-slate-800'}`}>
            {p.fraccion}
          </span>

          <div className="flex gap-1 mt-1">
            {p.reglaOctavaAplicada && (
              <span 
                title={`Sustitución exitosa: Fracción original 98... reemplazada por ${p.fraccion}`}
                className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-black rounded border border-emerald-200 uppercase tracking-tighter"
              >
                8ª OK
              </span>
            )}
            {isUnresolved98 && (
              <span className="px-1.5 py-0.5 bg-rose-200 text-rose-800 text-[8px] font-black rounded border border-rose-300 uppercase tracking-tighter animate-pulse">
                Revisar Obs.
              </span>
            )}
            {nums.length > 1 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[8px] font-black rounded border border-blue-200 uppercase tracking-tighter">
                Consol.
              </span>
            )}
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl p-1 rounded-[2.5rem] shadow-2xl border border-white/50 ring-1 ring-slate-200 overflow-hidden">
      <div className="bg-white p-8 rounded-[2.2rem] shadow-inner">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-1.5 h-10 bg-[#003b8e] rounded-full shadow-lg shadow-blue-500/20"></div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Análisis Detallado</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Comparativa de encabezado y partidas</p>
            </div>
          </div>
        </div>

        {/* HEADER COMPARISON */}
        <div className="mb-12 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-white text-[10px] font-black uppercase tracking-widest">
                <th className="bg-[#003b8e] px-6 py-4 text-left border-r border-white/10">Campo de Control</th>
                <th className="bg-[#0047ab] px-6 py-4 text-center border-r border-white/10">Pedimento SPACE</th>
                <th className="bg-[#005cd6] px-6 py-4 text-center">Contraparte</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {headerDiffs.map((h, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-slate-100 transition-colors ${h.status === 'mismatch' ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-6 py-3.5 font-bold text-slate-600 border-r border-slate-100">{h.field}</td>
                  <td className={`px-6 py-3.5 text-center border-r border-slate-100 font-mono ${h.status === 'mismatch' ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                    {formatVal(h.valA)}
                  </td>
                  <td className={`px-6 py-3.5 text-center font-mono ${h.status === 'mismatch' ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                    {formatVal(h.valB)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PARTIDA COMPARISON - REGRESO AL DISEÑO DE 6 COLUMNAS POR LADO */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-slate-50/50">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
            <table className="w-full border-collapse min-w-[1200px]">
              <thead>
                <tr className="text-white text-[10px] font-black uppercase tracking-widest">
                  <th colSpan={6} className="bg-[#0047ab] py-4 border-r border-white/10 text-center">PARTIDAS SPACE</th>
                  <th colSpan={6} className="bg-[#005cd6] py-4 text-center">PARTIDAS CONTRAPARTE</th>
                </tr>
                <tr className="bg-slate-800 text-white text-[9px] font-black uppercase border-b border-slate-700 tracking-tighter">
                  <th className="py-3 border-r border-slate-700">FRACCIÓN / PARTIDA</th>
                  <th className="py-3 border-r border-slate-700">NICO</th>
                  <th className="py-3 border-r border-slate-700">UMC</th>
                  <th className="py-3 border-r border-slate-700">CANT. UMC</th>
                  <th className="py-3 border-r border-slate-700">UMT</th>
                  <th className="py-3 border-r border-slate-400">CANT. UMT</th>
                  
                  <th className="py-3 border-r border-slate-700">FRACCIÓN / PARTIDA</th>
                  <th className="py-3 border-r border-slate-700">NICO</th>
                  <th className="py-3 border-r border-slate-700">UMC</th>
                  <th className="py-3 border-r border-slate-700">CANT. UMC</th>
                  <th className="py-3 border-r border-slate-700">UMT</th>
                  <th className="py-3">CANT. UMT</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-slate-800">
                {partidaDiffs.map((p, i) => (
                  <tr 
                    key={i} 
                    className={`border-b border-slate-100 transition-all ${p.hasDiff ? 'bg-rose-50/70' : 'bg-white hover:bg-blue-50/30'}`}
                  >
                    {/* Pedimento Side */}
                    {renderFraccionCell(p.pA)}
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-mono">{p.pA?.nico || '-'}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-bold">{p.pA?.umc || '-'}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-black text-slate-900">{formatVal(p.pA?.cantidadUmc)}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-bold">{p.pA?.umt || '-'}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-400 font-black text-slate-900">{formatVal(p.pA?.cantidadUmt)}</td>
                    
                    {/* Contraparte Side */}
                    {renderFraccionCell(p.pB)}
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-mono">{p.pB?.nico || '-'}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-bold">{p.pB?.umc || '-'}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-black text-slate-900">{formatVal(p.pB?.cantidadUmc)}</td>
                    <td className="px-2 py-4 text-center border-r border-slate-100 font-bold">{p.pB?.umt || '-'}</td>
                    <td className="px-2 py-4 text-center font-black text-slate-900">{formatVal(p.pB?.cantidadUmt)}</td>
                  </tr>
                ))}
                
                {/* FOOTER TOTALS */}
                <tr className="bg-slate-100/80 font-black text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={3} className="px-4 py-5 text-right border-r border-slate-200 uppercase tracking-widest text-[9px]">TOTALES SPACE:</td>
                  <td className="px-2 py-5 text-center border-r border-slate-200 text-blue-700">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmc || 0), 0))}
                  </td>
                  <td className="border-r border-slate-200"></td>
                  <td className="px-2 py-5 text-center border-r border-slate-400 text-blue-700">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmt || 0), 0))}
                  </td>
                  
                  <td colSpan={3} className="px-4 py-5 text-right border-r border-slate-200 uppercase tracking-widest text-[9px]">TOTALES CONTRAPARTE:</td>
                  <td className="px-2 py-5 text-center border-r border-slate-200 text-blue-700">
                    {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmc || 0), 0))}
                  </td>
                  <td className="border-r border-slate-200"></td>
                  <td className="px-2 py-5 text-center text-blue-700">
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
