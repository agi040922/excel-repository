import { GoogleGenAI, Type } from "@google/genai";
import { ExcelColumn } from '../types';

// Using Gemini 3 Flash Preview
const MODEL_NAME = 'gemini-3-flash-preview';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper to parse base64 data
 */
const parseBase64 = (base64Data: string) => {
  const match = base64Data.match(/^data:(.*);base64,(.*)$/);
  if (!match) {
    throw new Error("Invalid base64 data");
  }
  return {
    mimeType: match[1],
    data: match[2]
  };
};

/**
 * Step 1: Analyze a sample image/pdf to identify potential columns/headers.
 */
export const identifyColumnsFromImage = async (imageBase64: string): Promise<string[]> => {
  const ai = getAiClient();
  
  try {
    const { mimeType, data } = parseBase64(imageBase64);

    const prompt = `
      Analyze this document and identify the distinct data fields that would make good spreadsheet headers.
      
      Rules:
      1. Look for labels like "Date", "Invoice #", "Vendor", "Total Amount", "Tax", "Items", etc.
      2. If the document contains a table, identify the column headers of that table.
      3. Return a JSON ARRAY of strings. e.g. ["Date", "Description", "Qty", "Unit Price", "Total"].
      4. Keep header names concise and clear.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Column Identification Error:", error);
    return ["Date", "Description", "Amount"]; 
  }
};

/**
 * Step 2: Extract data based on a strict set of columns, supporting multiple rows.
 */
export const extractDataFromImage = async (
  imageBase64: string,
  columns: ExcelColumn[]
): Promise<Record<string, string | number>[]> => {
  const ai = getAiClient();

  try {
    const { mimeType, data } = parseBase64(imageBase64);
    
    const headers = columns.map(c => c.header);
    
    const prompt = `
      Extract ALL data rows from this document strictly matching these headers: ${JSON.stringify(headers)}.
      
      Rules:
      1. Return a JSON ARRAY of objects. Each object represents one row of data.
      2. If the document contains a table with multiple items, extract EACH item as a separate object.
      3. If the document contains a single form, return an array with one object.
      4. Keys must match the headers EXACTLY.
      5. If a field is not found, use an empty string "".
      6. For date fields, use YYYY-MM-DD format.
      7. For numeric fields, return numbers (remove currency symbols like $ or ,).
    `;

    // Dynamic strict schema: Array of Objects
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: columns.reduce((acc, col) => {
          acc[col.header] = { type: Type.STRING }; 
          return acc;
        }, {} as Record<string, any>),
        required: headers,
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
};