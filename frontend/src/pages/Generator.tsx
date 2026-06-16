/**
 * Docxp — Document Generator Page (Core Feature)
 */
import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Typography,
  Space,
  Divider,
  message,
  Modal,
} from 'antd';
import {
  ThunderboltOutlined,
  DownloadOutlined,
  EyeOutlined,
  RobotOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { Table } from 'antd';
import ExcelUploader from '../components/ExcelUploader/ExcelUploader';
import TemplateSelector from '../components/TemplateSelector/TemplateSelector';
import DocumentPreview from '../components/DocumentPreview/DocumentPreview';
import { useDocumentPreview } from '../hooks/useDocumentPreview';
import { generateDocument, downloadDocument, getTemplateVariables, batchGenerateDocumentForm } from '../services/api';
import type { Template } from '../types';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function Generator() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [generatedDocId, setGeneratedDocId] = useState<string | null>(null);

  // Variable mapping state
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  // Excel Data State
  const [excelData, setExcelData] = useState<any>(null);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { previewHtml, isPreviewing, previewError, generatePreview, clearPreview } =
    useDocumentPreview();

  const loadVariables = async (id: string) => {
    try {
      const res = await getTemplateVariables(id);
      // Filter out 'contenido' as it's the standard AI field and 'titulo'
      const vars = res.variables.filter(v => v !== 'contenido' && v !== 'titulo');
      setTemplateVariables(vars);
      
      const initialFields: Record<string, string> = {};
      vars.forEach(v => { initialFields[v] = ''; });
      setCustomFields(initialFields);
    } catch {
      message.error('Error cargando variables de la plantilla');
    }
  };

  // Load variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      loadVariables(selectedTemplate.id);
    } else {
      // Need to avoid calling state updates here if possible but this is standard React to clear it.
      // Eslint rule complains if set state is inside effect directly. 
      // We will move the set state to a timeout or ignore it.
      setTemplateVariables([]);
      setCustomFields({});
    }
  }, [selectedTemplate]);

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields(prev => ({ ...prev, [key]: value }));
  };

  const resolveCustomFields = (): Record<string, string> => {
    // Para previsualización individual rápida, como no extraemos toda la data, enviaremos las llaves
    // Y el backend o la previsualización simplemente usará los placeholders o requerirá validarlo de otra forma
    // Opcionalmente, aquí solo enviamos el maping sin resolver, ya que no tenemos los datos crudos.
    return { ...customFields };
  };

  const handlePreview = async () => {
    if (!selectedTemplate) {
      message.warning('Selecciona una plantilla primero');
      return;
    }
    
    setIsModalOpen(true);

    let currentExcelData = excelData;
    if (!currentExcelData && selectedFile) {
      try {
        const { uploadExcel } = await import('../services/api');
        currentExcelData = await uploadExcel(selectedFile);
        setExcelData(currentExcelData);
      } catch (err) {
        console.warn("Could not upload excel for preview", err);
      }
    }
    
    // Sample exactly the FIRST row of the SELECTED sheet to avoid sending large payloads
    let sampleExcelData = null;
    if (currentExcelData && currentExcelData.data) {
      const activeSheet = selectedSheet || Object.keys(currentExcelData.data)[0];
      const allRows = currentExcelData.data[activeSheet];
      if (allRows && allRows.length > 0) {
        sampleExcelData = {
          ...currentExcelData,
          data: {
            [activeSheet]: [allRows[0]], // ONLY the first row of the active sheet
          },
        };
      }
    }
    
    // Para previsualizar, usamos los datos del excel (sampleados a 1 fila) si existen
    await generatePreview(selectedTemplate, sampleExcelData, aiPrompt, resolveCustomFields());
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      message.warning('Selecciona una plantilla primero');
      return;
    }
    if (!docTitle.trim()) {
      message.warning('Ingresa un título para el documento');
      return;
    }

    setIsGenerating(true);
    try {
      let currentExcelData = excelData;
      if (!currentExcelData && selectedFile) {
        const { uploadExcel } = await import('../services/api');
        currentExcelData = await uploadExcel(selectedFile);
        setExcelData(currentExcelData);
      }

      const doc = await generateDocument({
        template_id: selectedTemplate.id,
        title: docTitle,
        excel_data: currentExcelData, // Usamos la primera fila del excel si se subió uno
        ai_prompt: aiPrompt,
        custom_fields: resolveCustomFields(),
      });
      setGeneratedDocId(doc.id);
      message.success('¡Documento generado exitosamente!');
    } catch {
      message.error('Error generando el documento');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchGenerate = async () => {
    if (!selectedTemplate) {
      message.warning('Selecciona una plantilla primero');
      return;
    }
    if (!docTitle.trim()) {
      message.warning('Ingresa un título para el documento');
      return;
    }
    if (!selectedFile) {
      message.warning('Sube un Excel para la generación masiva');
      return;
    }

    setIsBatchGenerating(true);
    try {
      const formData = new FormData();
      formData.append('template_id', selectedTemplate.id);
      formData.append('title', docTitle);
      if (aiPrompt) formData.append('ai_prompt', aiPrompt);
      formData.append('custom_fields', JSON.stringify(customFields));
      if (selectedRowKeys.length > 0) {
        formData.append('selected_rows', JSON.stringify(selectedRowKeys));
      }
      // Enviar la hoja seleccionada para que el backend lea exactamente esa pestaña
      if (selectedSheet) {
        formData.append('sheet_name', selectedSheet);
      }
      formData.append('file', selectedFile);

      const blob = await batchGenerateDocumentForm(formData);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docTitle.replace(/ /g, '_')}_batch.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('¡Documentos masivos generados y descargados exitosamente!');
    } catch (err: any) {
      message.error(err.message || 'Error en la generación masiva');
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedTemplate(null);
    setSelectedFile(null);
    setExcelColumns([]);
    setExcelData(null);
    setSelectedSheet(null);
    setSelectedRowKeys([]);
    setAiPrompt('');
    setDocTitle('');
    setGeneratedDocId(null);
    clearPreview();
    setIsModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="animate-fade-in-up" style={{ marginBottom: 24 }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <ThunderboltOutlined style={{ color: 'var(--docxp-red)', marginRight: 8 }} />
              Generador de Documentos
            </Title>
            <Text type="secondary">
              Selecciona plantilla → Mapea variables → Configura IA → Genera
            </Text>
          </div>
          <Button icon={<ClearOutlined />} onClick={handleReset}>
            Limpiar
          </Button>
        </Space>
      </div>

      <Row justify="center">
        {/* Main Column: Configuration (Steps 01-04) */}
        <Col xs={24} lg={20} xl={16}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Step 01 */}
            <Card
              title={
                <Space>
                  <span style={{ color: 'var(--docxp-red)' }}>01</span>
                  <span>Seleccionar Plantilla</span>
                </Space>
              }
              size="small"
            >
              <TemplateSelector
                onSelect={setSelectedTemplate}
                selectedTemplate={selectedTemplate}
              />
            </Card>

            {/* Step 02 */}
            <Card
              title={
                <Space>
                  <span style={{ color: 'var(--docxp-red)' }}>02</span>
                  <span>Datos de Excel y Mapeo</span>
                </Space>
              }
              size="small"
            >
              <ExcelUploader
                onFileSelected={(file, cols, data, sheetName) => {
                  setSelectedFile(file);
                  setExcelColumns(cols);
                  setSelectedSheet(sheetName || null);
                  if (data && data.data) {
                    setExcelData(data);
                    // Usar la hoja seleccionada para precargar las filas
                    const activeSheet = sheetName || Object.keys(data.data)[0];
                    const rows = data.data[activeSheet] || [];
                    setSelectedRowKeys(rows.map((_: any, i: number) => i));
                  } else {
                    setExcelData(null);
                    setSelectedRowKeys([]);
                  }
                }}
                selectedFile={selectedFile}
                columns={excelColumns}
                templateVariables={templateVariables}
                customFields={customFields}
                onCustomFieldChange={handleCustomFieldChange}
              />

              {excelData && excelData.data && selectedSheet && excelData.data[selectedSheet] && (
                <div style={{ marginTop: 24 }} className="animate-fade-in-up">
                  <Divider style={{ margin: '16px 0' }} />
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>
                    Selección de Filas — Hoja: <span style={{ color: 'var(--docxp-red)' }}>{selectedSheet}</span>
                  </Text>
                  <Table
                    size="small"
                    dataSource={excelData.data[selectedSheet].map((row: any, i: number) => ({ ...row, key: i }))}
                    columns={excelColumns.slice(0, 5).map(col => ({
                      title: col,
                      dataIndex: col,
                      key: col,
                      ellipsis: true,
                    }))}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
                    }}
                    pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                    scroll={{ x: 'max-content' }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                    {selectedRowKeys.length} filas seleccionadas de {excelData.data[selectedSheet].length} totales en la hoja "{selectedSheet}".
                  </Text>
                </div>
              )}
            </Card>



            {/* Step 03 */}
            <Card
              title={
                <Space>
                  <span style={{ color: 'var(--docxp-red)' }}>03</span>
                  <RobotOutlined />
                  <span>Configuración IA y Generación</span>
                </Space>
              }
              size="small"
              className="animate-fade-in-up-delay-1"
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Título del Documento
                  </Text>
                  <Input
                    placeholder="Ej: Informe Mensual Ventas Q4"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    style={{ borderRadius: 4 }}
                  />
                </div>

                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Instrucciones para la IA (Campo: contenido)
                  </Text>
                  <TextArea
                    placeholder="Describe qué contenido debe generar la IA basándose en los datos del Excel y la plantilla seleccionada..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    style={{ borderRadius: 4 }}
                  />
                </div>

                {selectedTemplate?.ai_instructions && (
                  <div
                    style={{
                      background: 'rgba(220, 38, 38, 0.05)',
                      border: '1px solid var(--docxp-border)',
                      borderRadius: 4,
                      padding: 12,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <RobotOutlined style={{ marginRight: 4 }} />
                      Instrucciones de IA pre-configuradas:
                    </Text>
                    <br />
                    <Text style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                      {selectedTemplate.ai_instructions}
                    </Text>
                  </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Button
                      type="default"
                      icon={<EyeOutlined />}
                      onClick={handlePreview}
                      loading={isPreviewing}
                      disabled={!selectedTemplate}
                      block
                      size="large"
                    >
                      Previsualizar
                    </Button>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      onClick={handleGenerate}
                      loading={isGenerating}
                      disabled={!selectedTemplate || !docTitle.trim() || isBatchGenerating}
                      block
                      size="large"
                      className="animate-glow-pulse"
                    >
                      Generar Documento
                    </Button>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Button
                      type="dashed"
                      icon={<DownloadOutlined />}
                      onClick={handleBatchGenerate}
                      loading={isBatchGenerating}
                      disabled={!selectedTemplate || !docTitle.trim() || !selectedFile || isGenerating}
                      block
                      size="large"
                    >
                      Generación Masiva (ZIP)
                    </Button>
                  </Col>
                  {generatedDocId && (
                    <Col xs={24} sm={12}>
                      <Button
                        type="default"
                        icon={<DownloadOutlined />}
                        href={downloadDocument(generatedDocId)}
                        block
                        size="large"
                        style={{
                          borderColor: '#22C55E',
                          color: '#22C55E',
                        }}
                      >
                        Descargar .docx
                      </Button>
                    </Col>
                  )}
                </Row>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Previsualización del Documento</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
        styles={{ 
          body: { 
            padding: '24px 12px',
            maxHeight: '80vh',
            overflowY: 'auto'
          } 
        }}
      >
        <DocumentPreview
          html={previewHtml}
          isLoading={isPreviewing}
          error={previewError}
        />
      </Modal>
    </div>
  );
}
