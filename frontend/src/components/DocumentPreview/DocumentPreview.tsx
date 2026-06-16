/**
 * Docxp — Document Preview Component (Real-time)
 */
import { Typography, Spin, Alert } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import './DocumentPreview.css';

const { Text } = Typography;

interface DocumentPreviewProps {
  html: string;
  isLoading: boolean;
  error?: string | null;
}

export default function DocumentPreview({
  html,
  isLoading,
  error,
}: DocumentPreviewProps) {
  return (
    <div className="docxp-preview-container animate-fade-in-up-delay-2">
      {/* Header */}
      <div className="docxp-preview-header">
        <EyeOutlined style={{ color: 'var(--docxp-red)' }} />
        <Text strong style={{ fontSize: 13 }}>
          Previsualización
        </Text>
        {isLoading && (
          <div className="docxp-preview-generating">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              Generando con IA...
            </Text>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="docxp-preview-body scan-line-overlay">
        {error && (
          <Alert
            message="Error de previsualización"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {isLoading ? (
          <div className="docxp-preview-spinner">
            <Spin size="large" tip="Procesando documento..." />
          </div>
        ) : html ? (
          <div
            className="docxp-preview-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="docxp-preview-empty">
            <EyeOutlined style={{ fontSize: 40, color: 'var(--docxp-gray-600)' }} />
            <Text type="secondary" style={{ marginTop: 12, textAlign: 'center' }}>
              La previsualización aparecerá aquí cuando
              <br />
              selecciones una plantilla y generes contenido
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
