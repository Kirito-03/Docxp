/**
 * Docxp — Excel File Uploader Component
 */
import { useState, useEffect } from 'react';
import { Upload, Typography, Tag, Space, Card, message, Divider, Row, Col, Select, Input, Radio, Popover, InputNumber, Tooltip } from 'antd';
import { InboxOutlined, CheckCircleOutlined, LinkOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import './ExcelUploader.css';

const { Dragger } = Upload;
const { Text } = Typography;

export interface FieldFormat {
  zfill?: number; // Relleno con ceros a la izquierda
}

interface ExcelUploaderProps {
  onFileSelected: (file: File, columns: string[], data?: any, sheetName?: string) => void;
  selectedFile: File | null;
  columns?: string[];
  templateVariables?: string[];
  customFields?: Record<string, string>;
  onCustomFieldChange?: (key: string, value: string) => void;
  fieldFormats?: Record<string, FieldFormat>;
  onFieldFormatChange?: (key: string, fmt: FieldFormat) => void;
}

export default function ExcelUploader({ 
  onFileSelected, 
  selectedFile, 
  columns = [], 
  templateVariables = [],
  customFields = {},
  onCustomFieldChange,
  fieldFormats = {},
  onFieldFormatChange,
}: ExcelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  // Track if a variable is mapped to an 'excel' column or 'manual' text
  const [mappingMode, setMappingMode] = useState<Record<string, 'excel' | 'manual'>>({});

  useEffect(() => {
    // Initialize mapping modes based on existing customFields
    const newModes = { ...mappingMode };
    templateVariables.forEach(v => {
      if (!columns || columns.length === 0) {
        newModes[v] = 'manual';
      } else if (customFields[v] && !columns.includes(customFields[v])) {
        newModes[v] = 'manual';
      } else if (!newModes[v]) {
        newModes[v] = 'excel';
      }
    });
    setMappingMode(newModes);
  }, [templateVariables, columns]);

  const handleModeChange = (variable: string, mode: 'excel' | 'manual') => {
    setMappingMode(prev => ({ ...prev, [variable]: mode }));
    if (onCustomFieldChange) {
      // Reset the value when switching modes to avoid sending an excel column name as manual text
      onCustomFieldChange(variable, '');
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { getExcelSheets } = await import('../../services/api');
      const sheets = await getExcelSheets(file);
      setLocalFile(file);
      setAvailableSheets(sheets);
      
      // If only one sheet, automatically select it and process
      if (sheets.length === 1) {
        setSelectedSheet(sheets[0]);
        await processExcelSheet(file, sheets[0]);
      } else {
        message.info(`Excel cargado. Por favor selecciona una de las ${sheets.length} hojas encontradas.`);
      }
    } catch {
      message.error('Error al leer el archivo Excel');
    } finally {
      setUploading(false);
    }
    return false; // Prevent default upload
  };

  const processExcelSheet = async (file: File, sheetName: string) => {
    setUploading(true);
    try {
      const { uploadExcel } = await import('../../services/api');
      const data = await uploadExcel(file, sheetName);
      
      let detectedColumns: string[] = [];
      let rows: any[] = [];
      
      if (data && data.data && data.data[sheetName]) {
        rows = data.data[sheetName];
        if (rows.length > 0) {
          detectedColumns = Object.keys(rows[0]);
        }
      } else if (data && data.data) {
        // Fallback si por alguna razón no coincide el nombre
        const sheets = Object.keys(data.data);
        if (sheets.length > 0) {
          rows = data.data[sheets[0]];
          if (rows.length > 0) {
            detectedColumns = Object.keys(rows[0]);
          }
        }
      }
      
      onFileSelected(file, detectedColumns, data, sheetName);
      message.success(`Detectadas ${detectedColumns.length} columnas y ${rows.length} filas en la hoja "${sheetName}"`);
    } catch {
      message.error('Error al procesar la hoja del Excel');
    } finally {
      setUploading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (localFile) {
      processExcelSheet(localFile, sheetName);
    }
  };

  const hasExcel = columns && columns.length > 0;

  const mappingSection = templateVariables.length > 0 && onCustomFieldChange ? (
    <div className="docxp-mapping-section animate-fade-in-up" style={{ marginTop: 24 }}>
      <Divider style={{ margin: '16px 0' }} orientation={"left" as any}>
        <Space>
          <LinkOutlined style={{ color: 'var(--docxp-red)' }} />
          <Text strong>Mapeo de Variables {!hasExcel && '(Manual)'}</Text>
        </Space>
      </Divider>

      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        border: '1px solid #333', 
        borderRadius: 8, 
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {templateVariables.map(variable => {
          const mode = hasExcel ? (mappingMode[variable] || 'excel') : 'manual';
          return (
            <Row key={variable} align="middle" gutter={[16, 16]} style={{ 
              background: '#1a1a1a', 
              padding: '12px 16px', 
              borderRadius: 6,
              border: '1px solid #2a2a2a'
            }}>
              <Col xs={24} sm={6}>
                <Space>
                  <Tag color="red" style={{ fontSize: 14, padding: '4px 8px' }}>
                    {`{{ ${variable} }}`}
                  </Tag>
                </Space>
              </Col>
              
              <Col xs={24} sm={7}>
                {hasExcel ? (
                  <Radio.Group 
                    optionType="button" 
                    buttonStyle="solid"
                    size="middle"
                    value={mode}
                    onChange={(e) => handleModeChange(variable, e.target.value)}
                    style={{ width: '100%', display: 'flex' }}
                  >
                    <Radio.Button value="excel" style={{ flex: 1, textAlign: 'center' }}>
                      <LinkOutlined /> Columna
                    </Radio.Button>
                    <Radio.Button value="manual" style={{ flex: 1, textAlign: 'center' }}>
                      <EditOutlined /> Manual
                    </Radio.Button>
                  </Radio.Group>
                ) : (
                  <Tag color="default" style={{ padding: '6px 12px', fontSize: 13, border: '1px dashed #444', background: 'transparent' }}>
                    <EditOutlined style={{ marginRight: 6 }} /> Texto Manual
                  </Tag>
                )}
              </Col>

              <Col xs={24} sm={11}>
                {mode === 'excel' && hasExcel ? (
                  <Space.Compact style={{ width: '100%' }}>
                    <Select
                      showSearch
                      allowClear
                      placeholder="Selecciona columna del Excel..."
                      options={columns?.map(c => ({ label: c, value: c })) || []}
                      value={columns.includes(customFields[variable] || '') ? customFields[variable] : undefined}
                      onChange={(val) => onCustomFieldChange(variable, val || '')}
                      style={{ flex: 1 }}
                      size="large"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                      }
                    />
                    {/* Popover de formateo */}
                    <Popover
                      trigger="click"
                      title={
                        <Space>
                          <SettingOutlined />
                          <span>Formateo de Variable</span>
                        </Space>
                      }
                      content={
                        <div style={{ width: 220 }}>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                            Ceros a la izquierda (zfill)
                          </Text>
                          <InputNumber
                            min={0}
                            max={20}
                            placeholder="Ancho total (ej. 7)"
                            value={fieldFormats[variable]?.zfill ?? undefined}
                            onChange={(val) => {
                              if (onFieldFormatChange) {
                                const newFmt: FieldFormat = { ...fieldFormats[variable] };
                                if (val && val > 0) {
                                  newFmt.zfill = val as number;
                                } else {
                                  delete newFmt.zfill;
                                }
                                onFieldFormatChange(variable, newFmt);
                              }
                            }}
                            style={{ width: '100%' }}
                            addonAfter="dígitos"
                          />
                          {fieldFormats[variable]?.zfill && (
                            <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: 'block' }}>
                              Ejemplo: <code style={{ color: '#22C55E' }}>{String(1).padStart(fieldFormats[variable]!.zfill!, '0')}</code>
                            </Text>
                          )}
                        </div>
                      }
                    >
                      <Tooltip title="Formateo de columna">
                        <button
                          style={{
                            background: fieldFormats[variable]?.zfill ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${fieldFormats[variable]?.zfill ? '#22C55E' : '#333'}`,
                            borderLeft: 'none',
                            borderRadius: '0 6px 6px 0',
                            padding: '0 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: fieldFormats[variable]?.zfill ? '#22C55E' : '#888',
                            fontSize: 16,
                            transition: 'all 0.2s',
                          }}
                        >
                          <SettingOutlined spin={false} />
                        </button>
                      </Tooltip>
                    </Popover>
                  </Space.Compact>
                ) : (
                  <Input
                    placeholder="Escribe el texto fijo a inyectar..."
                    value={customFields[variable] || ''}
                    onChange={(e) => onCustomFieldChange(variable, e.target.value)}
                    style={{ width: '100%' }}
                    size="large"
                    allowClear
                  />
                )}
              </Col>
            </Row>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div className="docxp-excel-uploader animate-fade-in-up">
      {!selectedFile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!localFile ? (
            <Dragger
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleUpload}
              disabled={uploading}
              className="docxp-dragger"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: 'var(--docxp-red)', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ color: 'var(--docxp-text)' }}>
                {uploading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí (Opcional)'}
              </p>
              <p className="ant-upload-hint" style={{ color: 'var(--docxp-gray-400)' }}>
                Puedes saltar este paso y rellenar las variables a mano abajo
              </p>
            </Dragger>
          ) : (
            <Card title="Seleccionar Hoja de Excel" size="small" style={{ background: '#1a1a1a', border: '1px solid #333' }}>
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: 'var(--docxp-text)' }}>Archivo: {localFile.name}</Text>
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Selecciona una hoja..."
                options={availableSheets.map(s => ({ label: s, value: s }))}
                value={selectedSheet}
                onChange={handleSheetChange}
                disabled={uploading}
                size="large"
              />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <a onClick={() => { setLocalFile(null); setAvailableSheets([]); setSelectedSheet(null); }} style={{ color: 'var(--docxp-gray-400)' }}>
                  Cancelar y subir otro archivo
                </a>
              </div>
            </Card>
          )}
          {mappingSection}
        </div>
      ) : (
        <Card
          size="small"
          className="docxp-excel-result"
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#22C55E' }} />
              <Text strong>{selectedFile.name}</Text>
              {selectedSheet && (
                <Tag color="blue" style={{ marginLeft: 8 }}>Hoja: {selectedSheet}</Tag>
              )}
            </Space>
          }
          extra={
            <Space>
              {availableSheets.length > 1 && (
                <a onClick={() => { onFileSelected(null as any, []); }} style={{ fontSize: 13, marginRight: 8 }}>
                  Cambiar hoja
                </a>
              )}
              <Tag color="red">
                {columns?.length || 0} columnas
              </Tag>
            </Space>
          }
        >
          <div style={{ padding: '8px 12px' }}>
            <Text type="secondary" style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
              Columnas detectadas:
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {columns?.map((col) => (
                <Tag key={col} style={{ margin: 0 }}>
                  {col}
                </Tag>
              ))}
            </div>
            
            {mappingSection}
            
            {templateVariables.length === 0 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  No se encontraron variables personalizadas en la plantilla seleccionada.
                </Text>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
