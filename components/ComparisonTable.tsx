
import React from 'react';
import { ComparisonDetail, HeaderComparison } from '../types';

interface ComparisonTableProps {
  headerDiffs: HeaderComparison[];
  partidaDiffs: ComparisonDetail[];
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ headerDiffs, partidaDiffs }) => {
  
  const formatVal = (val: any) => {
    if (val === undefined || val === null || val === 'N/A') return '-';
    if (typeof val === 'number') {
      return val.toLocaleString('es-MX', { 
        minimumFractionDigits: Number.isInteger(val) ? 0 : 2,
        maximumFractionDigits: 3
      });
    }
    return String(val);
  };

  return (
    <div className="space-y-6 font-sans text-[13px] bg-white p-2 border border-slate-300 shadow-xl rounded-sm">
      {/* SECCIÓN ENCABEZADO */}
      <div className="overflow-hidden border border-slate-400">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-[#003b8e] text-white px-4 py-2 text-left w-[20%] font-bold uppercase tracking-tight">Encabezado</th>
              <th className="bg-[#0056b3] text-white px-4 py-2 text-center w-[40%] font-bold uppercase tracking-tight">Pedimento</th>
              <th className="bg-[#4a90e2] text-white px-4 py-2 text-center w-[40%] font-bold uppercase tracking-tight">Contraparte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {headerDiffs.map((h, i) => (
              <tr key={i} className={`${h.status === 'mismatch' ? 'bg-[#FF9999]' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}`}>
                <td className="px-4 py-1.5 font-bold text-slate-800 border-r border-slate-300">{h.field}</td>
                <td className="px-4 py-1.5 text-center border-r border-slate-300">{formatVal(h.valA)}</td>
                <td className="px-4 py-1.5 text-center">{formatVal(h.valB)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN PARTIDAS */}
      <div className="overflow-x-auto border border-slate-400">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="bg-[#003b8e] text-white px-3 py-2 text-left w-16 font-bold uppercase">Partida</th>
              <th colSpan={6} className="bg-[#0056b3] text-white px-3 py-2 text-center border-r border-white/20 font-bold uppercase">Pedimento</th>
              <th colSpan={6} className="bg-[#4a90e2] text-white px-3 py-2 text-center font-bold uppercase">Contraparte</th>
            </tr>
            <tr className="bg-[#1e293b] text-white text-[11px] uppercase font-bold">
              <th className="px-2 py-1.5 border-r border-slate-500">Número</th>
              <th className="px-2 py-1.5 border-r border-slate-500">Fracción</th>
              <th className="px-2 py-1.5 border-r border-slate-500">NICO</th>
              <th className="px-2 py-1.5 border-r border-slate-500">UMC</th>
              <th className="px-2 py-1.5 border-r border-slate-500 text-center">Cant. UMC</th>
              <th className="px-2 py-1.5 border-r border-slate-500">UMT</th>
              <th className="px-2 py-1.5 border-r border-white/30 text-center">Cant. UMT</th>
              
              <th className="px-2 py-1.5 border-r border-slate-500">Fracción</th>
              <th className="px-2 py-1.5 border-r border-slate-500">NICO</th>
              <th className="px-2 py-1.5 border-r border-slate-500">UMC</th>
              <th className="px-2 py-1.5 border-r border-slate-500 text-center">Cant. UMC</th>
              <th className="px-2 py-1.5 border-r border-slate-500">UMT</th>
              <th className="px-2 py-1.5 text-center">Cant. UMT</th>
            </tr>
          </thead>
          <tbody>
            {partidaDiffs.map((p, i) => (
              <tr key={i} className={`border-b border-slate-300 ${p.hasDiff ? 'bg-[#FF9999]' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50')}`}>
                <td className="px-2 py-1.5 font-bold text-center border-r border-slate-300">{i + 1}</td>
                {/* Lado Pedimento */}
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pA?.fraccion || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pA?.nico || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pA?.umc || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200 font-medium">{formatVal(p.pA?.cantidadUmc)}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pA?.umt || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-white/30 font-medium">{formatVal(p.pA?.cantidadUmt)}</td>
                {/* Lado Contraparte */}
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pB?.fraccion || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pB?.nico || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pB?.umc || '-'}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200 font-medium">{formatVal(p.pB?.cantidadUmc)}</td>
                <td className="px-2 py-1.5 text-center border-r border-slate-200">{p.pB?.umt || '-'}</td>
                <td className="px-2 py-1.5 text-center font-medium">{formatVal(p.pB?.cantidadUmt)}</td>
              </tr>
            ))}
            {/* Totales Row */}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
              <td className="bg-[#003b8e] text-white px-2 py-2 uppercase italic text-[11px]">Totales</td>
              <td colSpan={3} className="border-r border-slate-200"></td>
              <td className="px-2 py-2 text-center border-r border-slate-300 bg-blue-50">
                {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmc || 0), 0))}
              </td>
              <td className="border-r border-slate-200"></td>
              <td className="px-2 py-2 text-center border-r border-white/40 bg-blue-50">
                {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pA?.cantidadUmt || 0), 0))}
              </td>
              <td colSpan={3} className="border-r border-slate-200"></td>
              <td className="px-2 py-2 text-center border-r border-slate-300 bg-sky-50">
                {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmc || 0), 0))}
              </td>
              <td className="border-r border-slate-200"></td>
              <td className="px-2 py-2 text-center bg-sky-50">
                {formatVal(partidaDiffs.reduce((acc, curr) => acc + (curr.pB?.cantidadUmt || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
