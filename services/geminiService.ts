
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
    cantidadUmc: { type: Type.NUMBER },
    umt: { type: Type.STRING },
    cantidadUmt: { type: Type.NUMBER },
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

export const extractPedimentoData = async (fileBase64: string, mimeType: string): Promise<PedimentoData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Cambiamos a flash para máxima velocidad
  const model = "gemini-3-flash-preview";
  
  const prompt = `Extrae datos de este pedimento. 
  Puntos clave:
  1. Si una partida continúa en otra página, une sus "OBSERVACIONES A NIVEL PARTIDA".
  2. Captura "FRACCION ORIGINAL" de las observaciones (8-10 dígitos).
  3. Extrae identificadores de nivel pedimento (V1, IM, etc.) y de cada partida.
  4. Sé preciso con números y totales.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }, { inlineData: { data: fileBase64, mimeType } }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: PEDIMENTO_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 } // Desactivamos razonamiento profundo para ganar velocidad
    }
  });

  const text = response.text;
  if (!text) throw new Error("No se pudo extraer información.");
  return JSON.parse(text) as PedimentoData;
};
