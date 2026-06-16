/**
 * Docxp — Shared TypeScript Interfaces
 */

// === Template ===

export type TemplateCategory = 'carta' | 'informe' | 'acta' | 'otro';

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  ai_instructions: string | null;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateListResponse {
  items: Template[];
  total: number;
}

export interface ReplacementRule {
  search: string;
  replace: string;
}

export interface TemplateCreateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  ai_instructions?: string;
  file: File;
  replacement_rules?: ReplacementRule[];
}

// === Document ===

export type DocumentStatus = 'draft' | 'generating' | 'completed' | 'error';

export interface Document {
  id: string;
  template_id: string | null;
  title: string;
  excel_data: ExcelData | null;
  ai_prompt: string | null;
  ai_response: string | null;
  content_html: string | null;
  generated_file_path: string | null;
  status: DocumentStatus;
  created_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
}

export interface FieldFormat {
  zfill?: number;
  counter_start?: number;
  counter_step?: number;
}

export interface GenerateRequest {
  template_id: string;
  title: string;
  excel_data?: ExcelData | null;
  ai_prompt?: string;
  custom_fields?: Record<string, string>;
  field_formats?: Record<string, FieldFormat>;
}

export interface PreviewRequest {
  template_id: string;
  excel_data?: ExcelData | null;
  ai_prompt?: string;
  custom_fields?: Record<string, string>;
  field_formats?: Record<string, FieldFormat>;
}

export interface PreviewResponse {
  html: string;
  ai_content: string;
}

// === Excel ===

export interface ExcelData {
  filename: string;
  sheets: string[];
  headers: Record<string, string[]>;
  data: Record<string, Record<string, unknown>[]>;
  row_count: Record<string, number>;
  summary?: Record<string, Record<string, Record<string, number>>>;
}

// === Health ===

export interface AIHealthStatus {
  status: 'connected' | 'not_configured' | 'error';
  model_available?: boolean;
  available_models?: string[];
  configured_model: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  ai_service: AIHealthStatus;
}

// === UI State ===

export interface GeneratorState {
  selectedTemplate: Template | null;
  excelData: ExcelData | null;
  aiPrompt: string;
  previewHtml: string;
  isGenerating: boolean;
  isPreviewing: boolean;
}
