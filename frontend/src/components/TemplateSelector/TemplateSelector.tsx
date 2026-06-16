/**
 * Docxp — Template Selector Component
 */
import { useEffect, useState } from 'react';
import { Card, Select, Typography, Tag, Space, Empty, Spin } from 'antd';
import { FileTextOutlined, RobotOutlined } from '@ant-design/icons';
import { getTemplates } from '../../services/api';
import type { Template, TemplateCategory } from '../../types';
import './TemplateSelector.css';

const { Text } = Typography;

const categoryColors: Record<TemplateCategory, string> = {
  carta: '#DC2626',
  informe: '#F59E0B',
  acta: '#3B82F6',
  otro: '#8B5CF6',
};

const categoryLabels: Record<TemplateCategory, string> = {
  carta: 'Carta',
  informe: 'Informe',
  acta: 'Acta',
  otro: 'Otro',
};

interface TemplateSelectorProps {
  onSelect: (template: Template | null) => void;
  selectedTemplate: Template | null;
}

export default function TemplateSelector({
  onSelect,
  selectedTemplate,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await getTemplates(filterCategory);
      setTemplates(res.items);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [filterCategory]);

  return (
    <div className="docxp-template-selector animate-fade-in-up-delay-1">
      {/* Filter */}
      <div className="docxp-template-filter">
        <Select
          placeholder="Filtrar por tipo"
          allowClear
          onChange={(val) => setFilterCategory(val)}
          style={{ width: '100%' }}
          options={[
            { value: 'carta', label: '📄 Cartas' },
            { value: 'informe', label: '📊 Informes' },
            { value: 'acta', label: '📝 Actas' },
            { value: 'otro', label: '📎 Otros' },
          ]}
        />
      </div>

      {/* Template List */}
      <div className="docxp-template-list">
        {loading ? (
          <div className="docxp-template-loading">
            <Spin size="small" />
          </div>
        ) : templates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                No hay plantillas. Sube una desde la sección Plantillas.
              </Text>
            }
          />
        ) : (
          templates.map((template) => (
            <Card
              key={template.id}
              size="small"
              className={`docxp-template-card ${
                selectedTemplate?.id === template.id ? 'selected' : ''
              }`}
              onClick={() =>
                onSelect(selectedTemplate?.id === template.id ? null : template)
              }
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space align="center">
                  <FileTextOutlined style={{ color: categoryColors[template.category] }} />
                  <Text strong style={{ fontSize: 13 }}>
                    {template.name}
                  </Text>
                </Space>
                <Space size={4}>
                  <Tag
                    color={categoryColors[template.category]}
                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}
                  >
                    {categoryLabels[template.category]}
                  </Tag>
                  {template.ai_instructions && (
                    <Tag
                      icon={<RobotOutlined />}
                      style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}
                    >
                      IA
                    </Tag>
                  )}
                </Space>
                {template.description && (
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, lineHeight: 1.4 }}
                    ellipsis
                  >
                    {template.description}
                  </Text>
                )}
              </Space>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
