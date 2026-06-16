/**
 * Docxp — API Client (Axios)
 */
import axios from 'axios';
import type {
  TemplateListResponse,
  Template,
  DocumentListResponse,
  Document,
  ExcelData,
  GenerateRequest,
  PreviewResponse,
  HealthResponse,
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 120000, // 2 min for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let message = 'Error de conexión con el servidor';
    
    if (error.response?.data) {
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.detail || message;
        } catch {
          message = error.message;
        }
      } else {
        message = error.response.data.detail || error.message || message;
      }
    } else if (error.message) {
      message = error.message;
    }

    console.error('[Docxp API Error]', message);
    // Return a standard error so components can read the message
    return Promise.reject(new Error(message));
  }
);

// === Health ===

export const checkHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get('/health');
  return data;
};

// === Templates ===

export const getTemplates = async (
  category?: string
): Promise<TemplateListResponse> => {
  const params = category ? { category } : {};
  const { data } = await api.get('/templates/', { params });
  return data;
};

export const getTemplate = async (id: string): Promise<Template> => {
  const { data } = await api.get(`/templates/${id}`);
  return data;
};

export const createTemplate = async (formData: FormData): Promise<Template> => {
  const { data } = await api.post('/templates/', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  await api.delete(`/templates/${id}`);
};

export const getTemplateVariables = async (
  id: string
): Promise<{ template_id: string; variables: string[] }> => {
  const { data } = await api.get(`/templates/${id}/variables`);
  return data;
};

// === Excel ===

export const getExcelSheets = async (file: File): Promise<string[]> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/excel/sheets', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.sheets;
};

export const uploadExcel = async (file: File, sheetName?: string): Promise<ExcelData> => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) {
    formData.append('sheet_name', sheetName);
  }
  const { data } = await api.post('/excel/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
};

export const getExcelColumns = async (file: File, sheetName?: string): Promise<string[]> => {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) {
    formData.append('sheet_name', sheetName);
  }
  const { data } = await api.post('/excel/columns', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.columns;
};

// === Documents ===

export const getDocuments = async (
  status?: string
): Promise<DocumentListResponse> => {
  const params = status ? { status } : {};
  const { data } = await api.get('/documents/', { params });
  return data;
};

export const previewDocument = async (
  request: { template_id: string; excel_data?: ExcelData | null; ai_prompt?: string; custom_fields?: Record<string, string> }
): Promise<PreviewResponse> => {
  const { data } = await api.post('/documents/preview', request);
  return data;
};

export const generateDocument = async (
  request: GenerateRequest
): Promise<Document> => {
  const { data } = await api.post('/documents/generate', request);
  return data;
};

export const downloadDocument = (id: string): string => {
  return `${api.defaults.baseURL}/documents/${id}/download`;
};

export const batchGenerateDocumentForm = async (
  formData: FormData
): Promise<Blob> => {
  const response = await api.post('/documents/batch-generate', formData, {
    headers: { 'Content-Type': undefined },
    responseType: 'blob',
    timeout: 300000, // 5 mins
  });
  return response.data;
};

export default api;
