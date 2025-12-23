
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
    numeroPartida: { type: Type.INTEGER, description: "Número secuencial de la partida (1, 2, 3...)" },
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
    observaciones: { type: Type.STRING, description: "TEXTO COMPLETO E ÍNTEGRO de las OBSERVACIONES A NIVEL PARTIDA. Si la partida continúa en la siguiente página, concatena las observaciones correspondientes." }
  },
  required: ["numeroPartida", "fraccion", "nico", "cantidadUmc", "valorDlls"]
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
  
  const prompt = `Analiza detalladamente este pedimento aduanero. 
  
  REGLA CRÍTICA PARA DOCUMENTOS MULTIPÁGINA:
  Un pedimento puede tener muchas páginas. Si una partida comienza al final de una página y sus observaciones o datos continúan en la siguiente, DEBES unificar toda la información en un solo objeto de partida. 
  Es común que la sección "OBSERVACIONES A NIVEL PARTIDA" aparezca en la página siguiente a donde aparece la fracción arancelaria. Busca proactivamente el campo "FRACCION ORIGINAL" dentro de estas observaciones.
  
  REGLA DE ORO PARA OBSERVACIONES:
  Para cada partida, extrae TODO el texto del bloque "OBSERVACIONES A NIVEL PARTIDA". No omitas nada. Si dice "FRACCION ORIGINAL" seguido de un número, asegúrate de capturar ese número completo (8 a 10 dígitos).
  
  Extrae también:
  1. IDENTIFICADORES A NIVEL PEDIMENTO (Clave y sus complementos).
  2. Datos de cada PARTIDA (Número de partida, Fracción, NICO, UMC, Cantidades, Valor Dlls).`;

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
