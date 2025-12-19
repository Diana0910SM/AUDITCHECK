
export interface Identificador {
  clave: string;
  complemento1: string;
  complemento2: string;
  complemento3: string;
}

export interface PedimentoPartida {
  fraccion: string;
  nico: string;
  umc: string;
  cantidadUmc: number;
  umt: string;
  cantidadUmt: number;
  pesoBruto: number;
  valorDlls: number;
  bultos: number;
  identificadores: Identificador[];
}

export interface PedimentoData {
  tipo: 'General' | 'Consolidado';
  aduana: string;
  patente: string;
  folio: string;
  numPartidas: number;
  pesoBruto: number;
  valorDlls: number;
  bultos: number;
  identificadores: Identificador[];
  partidas: PedimentoPartida[];
}

export interface ComparisonResult {
  field: string;
  valA: any;
  valB: any;
  status: 'match' | 'mismatch';
}

export interface ComparisonDetail {
  partidaKey: string;
  pA?: PedimentoPartida;
  pB?: PedimentoPartida;
  hasDiff: boolean;
}

export interface HeaderComparison {
  field: string;
  valA: any;
  valB: any;
  status: 'match' | 'mismatch';
}

export interface ProcessingState {
  isProcessing: boolean;
  step: string;
  error?: string;
}
