/**
 * Docxp — Dashboard Page
 */
import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Space, Tag, List, Empty } from 'antd';
import {
  FileTextOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getTemplates, getDocuments, checkHealth } from '../services/api';
import type { Document, AIHealthStatus } from '../types';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    templates: 0,
    documents: 0,
    completed: 0,
  });
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [aiStatus, setAiStatus] = useState<AIHealthStatus | null>(null);

  const loadDashboard = async () => {
    try {
      const [templatesRes, docsRes, healthRes] = await Promise.allSettled([
        getTemplates(),
        getDocuments(),
        checkHealth(),
      ]);

      if (templatesRes.status === 'fulfilled') {
        setStats((s) => ({ ...s, templates: templatesRes.value.total }));
      }
      if (docsRes.status === 'fulfilled') {
        setStats((s) => ({
          ...s,
          documents: docsRes.value.total,
          completed: docsRes.value.items.filter((d) => d.status === 'completed').length,
        }));
        setRecentDocs(docsRes.value.items.slice(0, 5));
      }
      if (healthRes.status === 'fulfilled') {
        setAiStatus(healthRes.value.ai_service);
      }
    } catch {
      // Dashboard loads gracefully even if backend is down
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome */}
      <div className="animate-fade-in-up" style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
          Bienvenido a{' '}
          <span style={{ color: 'var(--docxp-red)' }}>Docxp</span>
        </Title>
        <Paragraph type="secondary" style={{ marginTop: 4, fontSize: 15 }}>
          Sistema de Gestión y Emisión de Documentos con Inteligencia Artificial
        </Paragraph>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card
            className="animate-fade-in-up docxp-card"
            hoverable
            onClick={() => navigate('/templates')}
            style={{ cursor: 'pointer' }}
          >
            <Statistic
              title={<Text type="secondary">Plantillas</Text>}
              value={stats.templates}
              prefix={<FileTextOutlined style={{ color: 'var(--docxp-red)' }} />}
              valueStyle={{ color: 'var(--docxp-text)', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="animate-fade-in-up-delay-1 docxp-card"
            hoverable
            onClick={() => navigate('/history')}
          >
            <Statistic
              title={<Text type="secondary">Documentos Generados</Text>}
              value={stats.documents}
              prefix={<ThunderboltOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: 'var(--docxp-text)', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="animate-fade-in-up-delay-2 docxp-card">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text type="secondary">DeepSeek AI</Text>
              <Space align="center" size={8}>
                <RobotOutlined
                  style={{
                    fontSize: 24,
                    color:
                      aiStatus?.status === 'connected'
                        ? '#22C55E'
                        : 'var(--docxp-gray-400)',
                  }}
                />
                <div>
                  <Tag
                    color={
                      aiStatus?.status === 'connected'
                        ? 'success'
                        : aiStatus?.status === 'not_configured'
                          ? 'warning'
                          : 'error'
                    }
                    icon={
                      aiStatus?.status === 'connected' ? (
                        <CheckCircleFilled />
                      ) : (
                        <WarningFilled />
                      )
                    }
                  >
                    {aiStatus?.status === 'connected'
                      ? 'Conectado'
                      : aiStatus?.status === 'not_configured'
                        ? 'No Configurado'
                        : 'Sin conexión'}
                  </Tag>
                  <div style={{ marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {aiStatus?.configured_model || 'deepseek-chat'}
                    </Text>
                  </div>
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions + Recent */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: 'var(--docxp-red)' }} />
                <span>Acciones Rápidas</span>
              </Space>
            }
            className="animate-fade-in-up-delay-1"
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Card
                size="small"
                hoverable
                onClick={() => navigate('/generator')}
                className="docxp-card"
              >
                <Space>
                  <ThunderboltOutlined style={{ color: 'var(--docxp-red)' }} />
                  <div>
                    <Text strong>Generar Documento</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sube un Excel, selecciona plantilla y genera con IA
                    </Text>
                  </div>
                </Space>
              </Card>
              <Card
                size="small"
                hoverable
                onClick={() => navigate('/templates')}
                className="docxp-card"
              >
                <Space>
                  <FileTextOutlined style={{ color: '#F59E0B' }} />
                  <div>
                    <Text strong>Gestionar Plantillas</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Sube y administra tus plantillas .docx
                    </Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: 'var(--docxp-red)' }} />
                <span>Actividad Reciente</span>
              </Space>
            }
            className="animate-fade-in-up-delay-2"
          >
            {recentDocs.length > 0 ? (
              <List
                size="small"
                dataSource={recentDocs}
                renderItem={(doc) => (
                  <List.Item>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space size={8}>
                        <FileTextOutlined />
                        <Text ellipsis style={{ maxWidth: 180 }}>
                          {doc.title}
                        </Text>
                      </Space>
                      <Tag
                        color={
                          doc.status === 'completed'
                            ? 'success'
                            : doc.status === 'error'
                              ? 'error'
                              : 'processing'
                        }
                        style={{ fontSize: 10 }}
                      >
                        {doc.status}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Aún no hay documentos generados
                  </Text>
                }
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
