
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ComparisonTable from './components/ComparisonTable';
import { extractPedimentoData } from './services/geminiService';
import { PedimentoData, ComparisonDetail, ProcessingState, PedimentoPartida, HeaderComparison, Identificador } from './types';

const App: React.FC = () => {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, step: '' });
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

  const homogenizeData = (data: PedimentoData): Map<string, PedimentoPartida> => {
    const grouped = new Map<string, PedimentoPartida>();
    data.partidas.forEach(p => {
      const key = `${p.fraccion}-${p.nico}`;
      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        existing.cantidadUmc += p.cantidadUmc;
        existing.cantidadUmt += p.cantidadUmt;
        existing.valorDlls += p.valorDlls;
        existing.pesoBruto += p.pesoBruto;
        existing.bultos += p.bultos;
      } else {
        grouped.set(key, { ...p });
      }
    });
    return grouped;
  };

  const getIdentificadorString = (ids: Identificador[], clave: string): string => {
    const found = ids.find(i => i.clave.toUpperCase() === clave.toUpperCase());
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
      { name: 'V1 (Identificador)', key: 'V1' },
      { name: 'IM (Identificador)', key: 'IM' },
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

      let status: 'match' | 'mismatch' = 'match';
      if (valA === undefined || valB === undefined) {
        status = 'mismatch';
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        const tolerance = f.key === 'bultos' || f.key === 'numPartidas' ? 0.1 : 0.01;
        status = Math.abs(valA - valB) <= tolerance ? 'match' : 'mismatch';
      } else {
        status = String(valA).trim().toLowerCase() === String(valB).trim().toLowerCase() ? 'match' : 'mismatch';
      }

      return { field: f.name, valA, valB, status };
    });
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;

    setProcessing({ isProcessing: true, step: 'Procesando documentos...' });
    setResults([]);
    setHeaderResults([]);

    try {
      const [b64A, b64B] = await Promise.all([fileToBase64(fileA), fileToBase64(fileB)]);
      const [dataA, dataB] = await Promise.all([
        extractPedimentoData(b64A, fileA.type),
        extractPedimentoData(b64B, fileB.type)
      ]);

      setHeaderResults(compareHeader(dataA, dataB));

      const mapA = homogenizeData(dataA);
      const mapB = homogenizeData(dataB);
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
          const diffUmc = pA.umc !== pB.umc;
          const diffCantUmc = Math.abs(pA.cantidadUmc - pB.cantidadUmc) > 0.01;
          const diffUmt = pA.umt !== pB.umt;
          const diffCantUmt = Math.abs(pA.cantidadUmt - pB.cantidadUmt) > 0.01;
          hasDiff = diffFraccion || diffNico || diffUmc || diffCantUmc || diffUmt || diffCantUmt;
        }
        return { partidaKey: key, pA, pB, hasDiff };
      });

      setResults(partidaDetails);
      setProcessing({ isProcessing: false, step: '' });
    } catch (error: any) {
      console.error(error);
      setProcessing({ isProcessing: false, step: '', error: error.message || 'Error en el proceso' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] pb-20">
      <header className="bg-[#003b8e] text-white py-5 shadow-xl border-b-[6px] border-[#6d6e71]">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="bg-white p-2 rounded-lg shadow-inner">
              <img 
                src="https://media.licdn.com/dms/image/v2/C4E0BAQE8Z6X9P0fWjg/company-logo_200_200/company-logo_200_200/0/1630635294524?e=2147483647&v=beta&t=Uv797f2E2h69B_u_P6z9Vp7f8S1P6v7V6J7J7J7J7J" 
                alt="SPACE Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none">AuditCheck</h1>
              <span className="text-sm font-bold tracking-widest text-[#4a90e2] uppercase mt-1">Space aduanas</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <div className="bg-[#0056b3] px-4 py-1.5 text-white font-bold text-[11px] rounded shadow-sm border border-white/10 uppercase">Pedimento Original</div>
             <div className="bg-[#4a90e2] px-4 py-1.5 text-white font-bold text-[11px] rounded shadow-sm border border-white/10 uppercase">Cotejo Contraparte</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 mt-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <FileUpload label="Pedimento Base (Proforma/VAL)" selectedFile={fileA} onFileSelect={setFileA} />
          <FileUpload label="Cotejo Contraparte (Proforma/VAL)" selectedFile={fileB} onFileSelect={setFileB} />
        </div>

        <div className="flex justify-center mb-12">
          <button
            onClick={handleCompare}
            disabled={!fileA || !fileB || processing.isProcessing}
            className={`px-16 py-4 rounded-lg font-black text-white transition-all shadow-2xl uppercase tracking-[0.15em] border-b-4 ${
              !fileA || !fileB || processing.isProcessing
              ? 'bg-slate-400 border-slate-500 cursor-not-allowed'
              : 'bg-[#003b8e] hover:bg-[#002d6b] active:translate-y-1 active:border-b-0 border-[#001f4d]'
            }`}
          >
            {processing.isProcessing ? 'Analizando Documentos...' : 'Iniciar Auditoría de Pedimento'}
          </button>
        </div>

        {processing.error && (
          <div className="bg-red-50 border-l-4 border-red-600 text-red-800 p-5 mb-10 rounded-r-lg shadow-md flex items-start animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold uppercase text-xs mb-1">Error Detectado</p>
              <p className="text-sm">{processing.error}</p>
            </div>
          </div>
        )}

        {headerResults.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200">
              <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-2 h-8 bg-[#003b8e] rounded-full"></div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Resultados del Cotejo Automático</h2>
              </div>
              <ComparisonTable headerDiffs={headerResults} partidaDiffs={results} />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-slate-200 text-center text-slate-400 text-[10px] uppercase font-bold tracking-[0.3em]">
        © {new Date().getFullYear()} SPACE - Servicios y Productos para Aduanas y Comercio Exterior
      </footer>
    </div>
  );
};

export default App;
