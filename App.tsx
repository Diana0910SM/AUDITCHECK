
import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import ComparisonTable from './components/ComparisonTable';
import { extractPedimentoData } from './services/geminiService';
import { PedimentoData, ComparisonDetail, ProcessingState, PedimentoPartida, HeaderComparison, Identificador } from './types';

const App: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [showPreviews, setShowPreviews] = useState<boolean>(true);
  
  const [reglaOctava, setReglaOctava] = useState<boolean>(false);
  const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, step: '', progress: 0 });
  const [results, setResults] = useState<ComparisonDetail[]>([]);
  const [headerResults, setHeaderResults] = useState<HeaderComparison[]>([]);

  useEffect(() => {
    if (!fileA) {
      setPreviewA(null);
      return;
    }
    // Para asegurar que Edge cargue el PDF, usamos una URL limpia y persistente
    const url = URL.createObjectURL(fileA);
    setPreviewA(url);
    return () => URL.revokeObjectURL(url);
  }, [fileA]);

  useEffect(() => {
    if (!fileB) {
      setPreviewB(null);
      return;
    }
    const url = URL.createObjectURL(fileB);
    setPreviewB(url);
    return () => URL.revokeObjectURL(url);
  }, [fileB]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
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
      
      setProcessing(prev => ({ ...prev, step: 'Analizando AMBOS pedimentos (Esto puede tardar si hay reintentos de cuota)...', progress: 40 }));
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
      setShowPreviews(true);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || 'Ocurrió un error inesperado durante el análisis.';
      setProcessing({ isProcessing: false, step: '', progress: 0, error: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 font-sans">
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
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <FileUpload label="Pedimento SPACE" selectedFile={fileA} onFileSelect={setFileA} />
            <FileUpload label="Pedimento Contraparte" selectedFile={fileB} onFileSelect={setFileB} />
          </div>

          <div className="flex flex-col items-center space-y-6">
            <label className="inline-flex items-center cursor-pointer group bg-slate-50 px-8 py-4 rounded-3xl border border-slate-200 transition-all">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={reglaOctava}
                onChange={(e) => setReglaOctava(e.target.checked)}
              />
              <div className="relative w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#003b8e] after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
              <div className="ms-5">
                <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Regla Octava</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Extraer fracción real de observaciones</p>
              </div>
            </label>

            <button
              onClick={handleCompare}
              disabled={!fileA || !fileB || processing.isProcessing}
              className={`px-14 py-5 rounded-2xl font-black text-white transition-all uppercase tracking-widest text-xs ${
                !fileA || !fileB || processing.isProcessing ? 'bg-slate-300' : 'bg-[#003b8e] hover:bg-[#002b66] shadow-lg hover:shadow-[#003b8e]/20'
              }`}
            >
              {processing.isProcessing ? 'Procesando...' : 'Ejecutar Auditoría'}
            </button>

            {processing.isProcessing && (
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[#003b8e] uppercase">
                  <span>{processing.step}</span>
                  <span>{processing.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#003b8e] transition-all duration-500" style={{ width: `${processing.progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {processing.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-3xl mb-8 shadow-lg animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center space-x-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-black uppercase tracking-widest">Atención Requerida</p>
            </div>
            <p className="text-sm font-bold opacity-80 leading-relaxed">{processing.error}</p>
          </div>
        )}

        {headerResults.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className={`lg:w-1/3 w-full space-y-4 lg:sticky lg:top-24 transition-all duration-500 ${showPreviews ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos de Referencia</h3>
                <button 
                  onClick={() => setShowPreviews(false)}
                  className="text-rose-500 text-[10px] font-black uppercase hover:underline"
                >
                  Ocultar
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-3xl overflow-hidden border-4 border-white shadow-xl h-[520px] relative">
                  <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <span className="bg-[#003b8e] text-white text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-md">SPACE</span>
                  </div>
                  {previewA ? (
                    <iframe 
                      src={previewA} 
                      className="w-full h-full border-none"
                      title="Pedimento SPACE"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-900">Esperando archivo...</div>
                  )}
                </div>

                <div className="bg-slate-800 rounded-3xl overflow-hidden border-4 border-white shadow-xl h-[520px] relative">
                  <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <span className="bg-slate-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase shadow-md">Contraparte</span>
                  </div>
                  {previewB ? (
                    <iframe 
                      src={previewB} 
                      className="w-full h-full border-none"
                      title="Pedimento Contraparte"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-[10px] font-black uppercase tracking-widest bg-slate-900">Esperando archivo...</div>
                  )}
                </div>
              </div>
            </div>

            <div className={`transition-all duration-500 ${showPreviews ? 'lg:w-2/3 w-full' : 'w-full'}`}>
              {!showPreviews && (
                <button 
                  onClick={() => setShowPreviews(true)}
                  className="mb-4 bg-white border border-slate-200 px-6 py-2 rounded-full text-[10px] font-black uppercase text-[#003b8e] shadow-sm hover:bg-slate-50"
                >
                  Mostrar Referencia PDF
                </button>
              )}
              <ComparisonTable headerDiffs={headerResults} partidaDiffs={results} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-24 py-12 text-center opacity-30">
        <p className="text-[10px] font-black tracking-[0.5em]">&copy; SPACE ADUANAS AUDITCHECK</p>
      </footer>
    </div>
  );
};

export default App;
