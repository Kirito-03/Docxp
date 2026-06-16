/**
 * Docxp — Document History Page
 */
import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  Empty,
} from 'antd';
import {
  HistoryOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { getDocuments, downloadDocument } from '../services/api';
import type { Document, DocumentStatus } from '../types';

const { Title, Text } = Typography;

const statusConfig: Record<
  DocumentStatus,
  { color: string; icon: React.ReactNode; label: string }
> = {
  draft: { color: 'default', icon: <ClockCircleFilled />, label: 'Borrador' },
  generating: { color: 'processing', icon: <LoadingOutlined />, label: 'Generando' },
  completed: { color: 'success', icon: <CheckCircleFilled />, label: 'Completado' },
  error: { color: 'error', icon: <CloseCircleFilled />, label: 'Error' },
};

export default function History() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await getDocuments(statusFilter);
      setDocuments(res.items);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter]);

  const columns = [
    {
      title: 'Documento',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => (
        <Space>
          <FileTextOutlined style={{ color: 'var(--docxp-red)' }} />
          <Text strong>{title}</Text>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: DocumentStatus) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(val).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ),
    },
    {
      title: 'Prompt IA',
      dataIndex: 'ai_prompt',
      key: 'ai_prompt',
      ellipsis: true,
      render: (val: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {val ? val.substring(0, 80) + (val.length > 80 ? '...' : '') : '—'}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Document) =>
        record.status === 'completed' && record.generated_file_path ? (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={downloadDocument(record.id)}
            size="small"
            style={{ color: 'var(--docxp-red)' }}
          >
            .docx
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <HistoryOutlined style={{ color: 'var(--docxp-red)', marginRight: 8 }} />
              Historial de Documentos
            </Title>
            <Text type="secondary">
              Todos los documentos generados con Docxp
            </Text>
          </div>
          <Select
            placeholder="Filtrar por estado"
            allowClear
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: 'completed', label: '✅ Completados' },
              { value: 'generating', label: '⏳ Generando' },
              { value: 'draft', label: '📝 Borradores' },
              { value: 'error', label: '❌ Errores' },
            ]}
          />
        </Space>
      </div>

      <Card className="animate-fade-in-up-delay-1">
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay documentos generados aún"
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
