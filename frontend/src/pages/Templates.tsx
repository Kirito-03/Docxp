/**
 * Docxp — Template Management Page
 */
import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Typography,
  Space,
  Tag,
  Popconfirm,
  message,
  Empty,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileTextOutlined,
  RobotOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { getTemplates, createTemplate, deleteTemplate, downloadTemplate } from '../services/api';
import type { Template, TemplateCategory, ReplacementRule } from '../types';
import type { UploadFile } from 'antd/es/upload';
import TemplateMapper from '../components/TemplateEditor/TemplateMapper';

const { Title, Text } = Typography;
const { TextArea } = Input;

const categoryColors: Record<TemplateCategory, string> = {
  carta: '#DC2626',
  informe: '#F59E0B',
  acta: '#3B82F6',
  otro: '#8B5CF6',
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [rules, setRules] = useState<ReplacementRule[]>([]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      setTemplates(res.items);
    } catch {
      message.error('Error cargando plantillas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.warning('Sube un archivo .docx');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj as File);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('category', values.category);
      formData.append('ai_instructions', values.ai_instructions || '');
      
      if (rules.length > 0) {
        formData.append('replacement_rules', JSON.stringify(rules));
      }

      await createTemplate(formData);
      message.success('Plantilla creada exitosamente');
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      setRules([]);
      loadTemplates();
    } catch {
      message.error('Error creando la plantilla');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      message.success('Plantilla eliminada');
      loadTemplates();
    } catch {
      message.error('Error eliminando la plantilla');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FileTextOutlined style={{ color: 'var(--docxp-red)' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (cat: TemplateCategory) => (
        <Tag color={categoryColors[cat]}>
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'IA',
      dataIndex: 'ai_instructions',
      key: 'ai',
      width: 60,
      align: 'center' as const,
      render: (val: string | null) =>
        val ? (
          <RobotOutlined style={{ color: 'var(--docxp-red)' }} />
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (val: string | null) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {val || '—'}
        </Text>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (val: string) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(val).toLocaleDateString('es-ES')}
        </Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_: unknown, record: Template) => (
        <Space size={4}>
          <a
            href={downloadTemplate(record.id)}
            download
            title="Descargar plantilla .docx"
          >
            <Button
              type="text"
              icon={<DownloadOutlined style={{ color: '#22C55E' }} />}
              size="small"
            />
          </a>
          <Popconfirm
            title="¿Eliminar esta plantilla?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <FileTextOutlined style={{ color: 'var(--docxp-red)', marginRight: 8 }} />
              Gestión de Plantillas
            </Title>
            <Text type="secondary">Sube y administra tus plantillas .docx</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            size="large"
          >
            Nueva Plantilla
          </Button>
        </Space>
      </div>

      <Card className="animate-fade-in-up-delay-1">
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No hay plantillas. Crea una nueva."
              />
            ),
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Nueva Plantilla"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setFileList([]);
          setRules([]);
        }}
        confirmLoading={uploading}
        okText="Guardar Plantilla"
        cancelText="Cancelar"
        width={fileList.length > 0 ? 1000 : 520}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: fileList.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>
            <Form.Item
              name="name"
              label="Nombre"
              rules={[{ required: true, message: 'Nombre requerido' }]}
            >
              <Input placeholder="Ej: Carta de Presentación" />
            </Form.Item>

            <Form.Item name="category" label="Categoría" initialValue="carta">
              <Select
                options={[
                  { value: 'carta', label: '📄 Carta' },
                  { value: 'informe', label: '📊 Informe' },
                  { value: 'acta', label: '📝 Acta' },
                  { value: 'otro', label: '📎 Otro' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Descripción">
            <Input placeholder="Descripción breve de la plantilla" />
          </Form.Item>

          <Form.Item
            name="ai_instructions"
            label={
              <Space>
                <RobotOutlined />
                <span>Instrucciones IA (opcional)</span>
              </Space>
            }
          >
            <TextArea
              placeholder="Instrucciones específicas para que la IA genere contenido adecuado a esta plantilla..."
              rows={2}
            />
          </Form.Item>

          <Form.Item label="Archivo .docx" required style={{ marginBottom: 8 }}>
            <Upload
              accept=".docx"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList }) => {
                setFileList(fileList);
                if (fileList.length === 0) setRules([]);
              }}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Seleccionar archivo</Button>
            </Upload>
          </Form.Item>
        </Form>

        {fileList.length > 0 && fileList[0].originFileObj && (
          <div className="animate-fade-in-up" style={{ marginTop: 24 }}>
            <Divider style={{ borderColor: 'var(--docxp-border)' }}>Mapeador Visual (Opcional)</Divider>
            <TemplateMapper 
              file={fileList[0].originFileObj} 
              rules={rules} 
              onRulesChange={setRules} 
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
