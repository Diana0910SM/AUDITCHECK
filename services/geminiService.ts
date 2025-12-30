
import { GoogleGenAI, Type } from "@google/genai";
import { PedimentoData } from "../types";

const IDENTIFICADOR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clave: { type: Type.STRING },
    complemento1: { type: Type.STRING },
    complemento2: { type: Type.STRING },
    complemento3: { type: Type.STRING }
  },
  required: ["clave"]
};

const PARTIDA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    numeroPartida: { type: Type.INTEGER },
    fraccion: { type: Type.STRING },
    nico: { type: Type.STRING },
    umc: { type: Type.STRING },
    cantidadUmc: { type: Type.NUMBER, description: "Valor numérico bajo la columna CANTIDAD UMC" },
    umt: { type: Type.STRING },
    cantidadUmt: { type: Type.NUMBER, description: "Valor numérico bajo la columna CANTIDAD UMT" },
    pesoBruto: { type: Type.NUMBER },
    valorDlls: { type: Type.NUMBER },
    bultos: { type: Type.NUMBER },
    identificadores: { type: Type.ARRAY, items: IDENTIFICADOR_SCHEMA },
    observaciones: { type: Type.STRING }
  },
  required: ["numeroPartida", "fraccion", "cantidadUmc", "valorDlls"]
};

const PEDIMENTO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tipo: { type: Type.STRING, enum: ["General", "Consolidado"] },
    aduana: { type: Type.STRING },
    patente: { type: Type.STRING },
    folio: { type: Type.STRING },
    numPartidas: { type: Type.INTEGER },
    pesoBruto: { type: Type.NUMBER },
    valorDlls: { type: Type.NUMBER },
    bultos: { type: Type.NUMBER },
    identificadores: { type: Type.ARRAY, items: IDENTIFICADOR_SCHEMA },
    partidas: { type: Type.ARRAY, items: PARTIDA_SCHEMA }
  },
  required: ["aduana", "patente", "folio", "partidas"]
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Llama a la API de Gemini con lógica de reintento para errores 429 (Cuota excedida).
 */
async function callGeminiWithRetry(
  fileBase64: string, 
  mimeType: string, 
  retries = 3, 
  backoff = 2000
): Promise<PedimentoData> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const prompt = `Actúa como un Auditor Senior de Aduanas experto en pedimentos de formato largo.
Tu objetivo es extraer TODAS las partidas del documento adjunto.

INSTRUCCIONES CRÍTICAS:
1. Identifica el inicio de las partidas (columna SUBD/NUM. IDENTIFICACION).
2. Extrae CANTIDAD UMC y CANTIDAD UMT de sus respectivas columnas.
3. Si la fracción es 98020001, busca la fracción original en las observaciones.
4. Genera un JSON que contenga exactamente la misma cantidad de partidas que el documento físico.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }, { inlineData: { data: fileBase64, mimeType } }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: PEDIMENTO_SCHEMA,
        thinkingConfig: { thinkingBudget: 4096 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de la Inteligencia Artificial.");
    return JSON.parse(text) as PedimentoData;
  } catch (error: any) {
    // Si el error es de cuota (429) y tenemos reintentos, esperamos y reintentamos
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      if (retries > 0) {
        console.warn(`Cuota excedida. Reintentando en ${backoff}ms... (${retries} intentos restantes)`);
        await delay(backoff);
        return callGeminiWithRetry(fileBase64, mimeType, retries - 1, backoff * 2);
      }
      throw new Error("LÍMITE DE CUOTA EXCEDIDO: Has superado el límite de peticiones gratuitas. Por favor, espera un minuto o utiliza una API Key con facturación habilitada.");
    }
    throw error;
  }
}

export const extractPedimentoData = async (fileBase64: string, mimeType: string): Promise<PedimentoData> => {
  return callGeminiWithRetry(fileBase64, mimeType);
};
