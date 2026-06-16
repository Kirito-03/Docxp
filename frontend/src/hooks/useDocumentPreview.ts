/**
 * Docxp — useDocumentPreview Hook
 * Manages the document preview state and AI generation.
 */
import { useState, useCallback } from 'react';
import { previewDocument } from '../services/api';
import type { ExcelData, Template } from '../types';

interface UseDocumentPreviewReturn {
  previewHtml: string;
  aiContent: string;
  isPreviewing: boolean;
  previewError: string | null;
  generatePreview: (
    template: Template,
    excelData: ExcelData | null,
    aiPrompt: string,
    customFields?: Record<string, string>
  ) => Promise<void>;
  clearPreview: () => void;
}

export function useDocumentPreview(): UseDocumentPreviewReturn {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [aiContent, setAiContent] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const generatePreview = useCallback(
    async (
      template: Template,
      excelData: ExcelData | null,
      aiPrompt: string,
      customFields?: Record<string, string>
    ) => {
      setIsPreviewing(true);
      setPreviewError(null);

      try {
        const response = await previewDocument({
          template_id: template.id,
          excel_data: excelData,
          ai_prompt: aiPrompt,
          custom_fields: customFields,
        });

        setPreviewHtml(response.html);
        setAiContent(response.ai_content);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error generando preview';
        setPreviewError(message);
        setPreviewHtml('');
        setAiContent('');
      } finally {
        setIsPreviewing(false);
      }
    },
    []
  );

  const clearPreview = useCallback(() => {
    setPreviewHtml('');
    setAiContent('');
    setPreviewError(null);
  }, []);

  return {
    previewHtml,
    aiContent,
    isPreviewing,
    previewError,
    generatePreview,
    clearPreview,
  };
}
