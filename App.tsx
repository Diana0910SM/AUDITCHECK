
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ComparisonTable from './components/ComparisonTable';
import { extractPedimentoData } from './services/geminiService';
import { PedimentoData, ComparisonDetail, ProcessingState, PedimentoPartida, HeaderComparison, Identificador } from './types';

const App: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [reglaOctava, setReglaOctava] = useState<boolean>(false);
  const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, step: '', progress: 0 });
  const [results, setResults] = useState<ComparisonDetail[]>([]);
  const [headerResults, setHeaderResults] = useState<HeaderComparison[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const applyReglaOctavaLogic = (data: PedimentoData): PedimentoData => {
    if (!reglaOctava) return data;

    const updatedPartidas = data.partidas.map(p => {
      if (p.fraccion && p.fraccion.toString().startsWith('98')) {
        if (p.observaciones) {
          const cleanObs = p.observaciones.replace(/\n/g, ' ').replace(/\s+/g, ' ');
          const regex = /(?:FRACCION|FRAC\.?|FRACC)\s+(?:ORIGINAL|ORIG\.?|REAL)[:\-\s]*([0-9\.\s\-]{8,15})/i;
          const match = cleanObs.match(regex);
          
          if (match && match[1]) {
            const rawFound = match[1].replace(/[^0-9]/g, '');
            if (rawFound.length >= 8) {
              return {
                ...p,
                originalFraccion: p.fraccion,
                fraccion: rawFound.substring(0, 8),
                nico: rawFound.length >= 10 ? rawFound.substring(8, 10) : p.nico,
                reglaOctavaAplicada: true
              };
            }
          }
        }
      }
      return p;
    });

    return { ...data, partidas: updatedPartidas };
  };

  const homogenizeData = (data: PedimentoData): Map<string, PedimentoPartida> => {
    const grouped = new Map<string, PedimentoPartida>();
    data.partidas.forEach(p => {
      const key = `${p.fraccion}-${p.nico}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.cantidadUmc += p.cantidadUmc || 0;
        existing.cantidadUmt += p.cantidadUmt || 0;
        existing.valorDlls += p.valorDlls || 0;
        existing.pesoBruto += p.pesoBruto || 0;
        existing.bultos += p.bultos || 0;
        if (p.numeroPartida) {
           existing.partidasAgrupadas = [...(existing.partidasAgrupadas || []), p.numeroPartida];
        }
        if (p.reglaOctavaAplicada) existing.reglaOctavaAplicada = true;
      } else {
        const pCopy = { ...p };
        if (p.numeroPartida) pCopy.partidasAgrupadas = [p.numeroPartida];
        grouped.set(key, pCopy);
      }
    });
    return grouped;
  };

  const getIdentificadorString = (ids: Identificador[], clave: string): string => {
    if (!ids) return 'N/A';
    const found = ids.find(i => i.clave && i.clave.toUpperCase() === clave.toUpperCase());
    if (!found) return 'N/A';
    return [found.complemento1, found.complemento2, found.complemento3]
      .filter(c => c && c.trim() !== '')
      .join(' | ');
  };

  const compareHeader = (a: PedimentoData, b: PedimentoData): HeaderComparison[] => {
    const fields = [
      { name: 'Aduana', key: 'aduana' },
      { name: 'Patente', key: 'patente' },
      { name: 'Pedimento', key: 'folio' },
      { name: 'Partidas', key: 'numPartidas' },
      { name: 'Peso Bruto', key: 'pesoBruto' },
      { name: 'Valor Dlls', key: 'valorDlls' },
      { name: 'Bultos', key: 'bultos' },
      { name: 'V1', key: 'V1' },
      { name: 'IM', key: 'IM' },
    ];

    return fields.map(f => {
      let valA: any;
      let valB: any;

      if (f.key === 'V1' || f.key === 'IM') {
        valA = getIdentificadorString(a.identificadores, f.key);
        valB = getIdentificadorString(b.identificadores, f.key);
      } else {
        valA = (a as any)[f.key];
        valB = (b as any)[f.key];
      }

      const valAStr = String(valA || '').trim().toLowerCase();
      const valBStr = String(valB || '').trim().toLowerCase();
      
      let status: 'match' | 'mismatch' = 'match';
      if (typeof valA === 'number' && typeof valB === 'number') {
        const tolerance = f.key === 'bultos' || f.key === 'numPartidas' ? 0.1 : 0.01;
        status = Math.abs(valA - valB) <= tolerance ? 'match' : 'mismatch';
      } else {
        status = valAStr === valBStr ? 'match' : 'mismatch';
      }

      return { field: f.name, valA, valB, status };
    });
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;

    setProcessing({ isProcessing: true, step: 'Iniciando Auditoría Flash...', progress: 10 });
    setResults([]);
    setHeaderResults([]);

    try {
      setProcessing(prev => ({ ...prev, step: 'Codificando documentos...', progress: 20 }));
      const [b64A, b64B] = await Promise.all([fileToBase64(fileA), fileToBase64(fileB)]);
      
      setProcessing(prev => ({ ...prev, step: 'Analizando AMBOS pedimentos en paralelo...', progress: 40 }));
      
      const [dataA, dataB] = await Promise.all([
        extractPedimentoData(b64A, fileA.type),
        extractPedimentoData(b64B, fileB.type)
      ]);

      setProcessing(prev => ({ ...prev, step: 'Auditando datos...', progress: 85 }));
      
      let finalA = dataA;
      let finalB = dataB;
      if (reglaOctava) {
        finalA = applyReglaOctavaLogic(dataA);
        finalB = applyReglaOctavaLogic(dataB);
      }

      setHeaderResults(compareHeader(finalA, finalB));

      const mapA = homogenizeData(finalA);
      const mapB = homogenizeData(finalB);
      const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));
      
      const partidaDetails: ComparisonDetail[] = allKeys.map(key => {
        const pA = mapA.get(key);
        const pB = mapB.get(key);
        
        let hasDiff = false;
        if (!pA || !pB) {
          hasDiff = true;
        } else {
          const diffFraccion = pA.fraccion !== pB.fraccion;
          const diffNico = pA.nico !== pB.nico;
          const diffCantUmc = Math.abs((pA.cantidadUmc || 0) - (pB.cantidadUmc || 0)) > 0.01;
          const diffCantUmt = Math.abs((pA.cantidadUmt || 0) - (pB.cantidadUmt || 0)) > 0.01;
          hasDiff = diffFraccion || diffNico || diffCantUmc || diffCantUmt;
        }
        return { partidaKey: key, pA, pB, hasDiff };
      });

      setResults(partidaDetails);
      setProcessing({ isProcessing: false, step: '', progress: 100 });
    } catch (error: any) {
      console.error(error);
      setProcessing({ isProcessing: false, step: '', progress: 0, error: error.message || 'Error en el proceso' });
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-blue-50 pb-24 text-slate-900">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
              <img 
                src="https://tickets.spaceti.cloud/web/image/website/1/logo/Space%20Aduanas?unique=8cd703e" 
                alt="Space Aduanas Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-[#003b8e] uppercase leading-none">AuditCheck</h1>
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Inteligencia Aduanera</span>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motor Flash Optimizado</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 mt-12 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight text-balance uppercase">Auditoría de Pedimentos</h2>
          <p className="text-slate-500 mt-2 font-medium">Análisis inteligente para detección de discrepancias y validación de Regla Octava.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FileUpload label="Pedimento SPACE" selectedFile={fileA} onFileSelect={setFileA} />
          <FileUpload label="Pedimento Contraparte" selectedFile={fileB} onFileSelect={setFileB} />
        </div>

        <div className="flex flex-col items-center space-y-6 mb-12">
          <label className="inline-flex items-center cursor-pointer group bg-white/70 px-8 py-4 rounded-[2rem] border border-slate-200 hover:border-blue-300 hover:bg-white transition-all shadow-xl shadow-slate-200/50">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={reglaOctava}
              onChange={(e) => setReglaOctava(e.target.checked)}
            />
            <div className="relative w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#003b8e]"></div>
            <div className="ms-5">
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-[#003b8e] transition-colors">Regla Octava</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight mt-0.5">Sustituye fracciones 98 por fracción real de observaciones</p>
            </div>
          </label>

          <div className="w-full max-w-md flex flex-col items-center space-y-4">
            <button
              onClick={handleCompare}
              disabled={!fileA || !fileB || processing.isProcessing}
              className={`group relative overflow-hidden px-14 py-6 rounded-2xl font-black text-white transition-all shadow-2xl uppercase tracking-[0.2em] text-xs w-full ${
                !fileA || !fileB || processing.isProcessing
                ? 'bg-slate-300 cursor-not-allowed grayscale'
                : 'bg-[#003b8e] hover:bg-[#002b66] hover:shadow-blue-900/30 hover:-translate-y-1 active:translate-y-0 active:shadow-none'
              }`}
            >
              <span className="relative z-10">
                {processing.isProcessing ? 'Procesando con Flash IA...' : 'Ejecutar Auditoría'}
              </span>
            </button>

            {processing.isProcessing && (
              <div className="w-full space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-[#003b8e] uppercase tracking-widest animate-pulse">
                    {processing.step}
                  </span>
                  <span className="text-[10px] font-black text-slate-400">
                    {processing.progress}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#003b8e] to-blue-500 rounded-full transition-all duration-700 ease-out relative"
                    style={{ width: `${processing.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {processing.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 mb-12 rounded-[2rem] shadow-2xl flex items-start space-x-4 animate-in fade-in zoom-in-95">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-black uppercase text-xs tracking-widest mb-1">Error en el proceso</h3>
              <p className="text-sm font-semibold opacity-80">{processing.error}</p>
            </div>
          </div>
        )}

        {headerResults.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <ComparisonTable headerDiffs={headerResults} partidaDiffs={results} />
          </div>
        )}
      </main>

      <footer className="mt-24 py-16 border-t border-slate-200 text-center">
        <div className="container mx-auto px-6">
          <img src="https://tickets.spaceti.cloud/web/image/website/1/logo/Space%20Aduanas?unique=8cd703e" className="h-8 w-auto mx-auto mb-8 opacity-50" alt="Space Footer" />
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.5em] mt-8">
            &copy; {new Date().getFullYear()} SPACE ADUANAS
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
