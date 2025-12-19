
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
    fraccion: { type: Type.STRING },
    nico: { type: Type.STRING },
    umc: { type: Type.STRING },
    cantidadUmc: { type: Type.NUMBER },
    umt: { type: Type.STRING },
    cantidadUmt: { type: Type.NUMBER },
    pesoBruto: { type: Type.NUMBER },
    valorDlls: { type: Type.NUMBER },
    bultos: { type: Type.NUMBER },
    identificadores: { type: Type.ARRAY, items: IDENTIFICADOR_SCHEMA }
  },
  required: ["fraccion", "nico", "cantidadUmc", "valorDlls"]
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
  const model = "gemini-3-pro-preview";
  
  const prompt = `Analiza este documento de pedimento. Extrae la información del encabezado y de todas las partidas.
  Pon especial atención en:
  1. La tabla "IDENTIFICADORES A NIVEL PEDIMENTO": Extrae la CLAVE y sus COMPLEMENTOS 1, 2 y 3.
  2. Identificadores como V1 y IM son críticos.
  3. Campos de encabezado resaltados: Num. Pedimento, Peso Bruto, Valor Dolares, Bultos.
  4. Detalle de PARTIDAS: Fracción, NICO, UMC, Cantidad UMC, UMT, Cantidad UMT, y sus Identificadores asociados.
  
  Si el documento es una proforma PDF o un archivo de validación (.VAL), interpreta los registros adecuadamente.
  Para los identificadores, si solo hay Clave y Compl 1, deja los demás vacíos.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }, { inlineData: { data: fileBase64, mimeType } }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: PEDIMENTO_SCHEMA
    }
  });

  const text = response.text;
  if (!text) throw new Error("No se pudo extraer información del documento.");
  return JSON.parse(text) as PedimentoData;
};
