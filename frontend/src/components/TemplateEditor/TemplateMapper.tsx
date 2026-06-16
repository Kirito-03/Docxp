/**
 * Docxp — Template Mapper
 * Visual editor to map static text to {{ variables }} via mammoth.js
 */
import { useEffect, useState, useRef } from 'react';
import mammoth from 'mammoth';
import { Space, Typography, Button, Input, List, Tag } from 'antd';
import { DeleteOutlined, RobotOutlined, UnorderedListOutlined } from '@ant-design/icons';
import type { ReplacementRule } from '../../types';
import './TemplateMapper.css';

const { Text } = Typography;

interface TemplateMapperProps {
  file: File;
  rules: ReplacementRule[];
  onRulesChange: (rules: ReplacementRule[]) => void;
}

export default function TemplateMapper({ file, rules, onRulesChange }: TemplateMapperProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Popover State
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [variableName, setVariableName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Convert DOCX to HTML for preview
  useEffect(() => {
    const renderDocx = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } catch {
        setHtmlContent('<p class="docxp-error-text">Error al leer el archivo. Solo lectura de texto disponible.</p>');
      } finally {
        setLoading(false);
      }
    };
    renderDocx();
  }, [file]);

  // 2. Handle Text Selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      if (!variableName) setShowPopover(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setPopoverPos({
          top: rect.top - containerRect.top - 50, // 50px above selection
          left: rect.left - containerRect.left + rect.width / 2, // Centered
        });
        setSelectedText(text);
        setVariableName('');
        setShowPopover(true);
      }
    }
  };

  const handleAddRule = () => {
    if (!variableName.trim() || !selectedText) return;

    // Clean variable name (remove spaces, braces if user typed them)
    const cleanVar = variableName.replace(/[{}]/g, '').trim();
    const formattedReplace = `{{ ${cleanVar} }}`;

    // Prevent duplicates
    if (!rules.some((r) => r.search === selectedText)) {
      onRulesChange([...rules, { search: selectedText, replace: formattedReplace }]);
    }

    setShowPopover(false);
    setVariableName('');
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveRule = (searchStr: string) => {
    onRulesChange(rules.filter((r) => r.search !== searchStr));
  };

  return (
    <div className="docxp-mapper-layout animate-fade-in-up">
      {/* Sidebar: Rule List */}
      <div className="docxp-mapper-sidebar">
        <Space style={{ marginBottom: 16 }}>
          <UnorderedListOutlined style={{ color: 'var(--docxp-red)' }} />
          <Text strong>Variables a Reemplazar</Text>
        </Space>
        
        <List
          size="small"
          dataSource={rules}
          locale={{ emptyText: 'Selecciona texto en el visor para crear variables.' }}
          renderItem={(item) => (
            <List.Item
              className="docxp-rule-item"
              actions={[
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  size="small" 
                  onClick={() => handleRemoveRule(item.search)}
                />
              ]}
            >
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Text type="secondary" ellipsis style={{ fontSize: 11 }}>
                  Texto: "{item.search}"
                </Text>
                <Tag color="red" style={{ marginTop: 4, width: 'fit-content' }}>
                  {item.replace}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Main Area: Document Preview */}
      <div className="docxp-mapper-main" ref={containerRef}>
        <div className="docxp-mapper-toolbar">
          <Space>
            <RobotOutlined style={{ color: 'var(--docxp-gray-400)' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Resalta cualquier texto en el documento para convertirlo en una variable. El formato original no se perderá.
            </Text>
          </Space>
        </div>

        <div className="docxp-mapper-viewer-container" onMouseUp={handleMouseUp}>
          {loading ? (
            <div className="docxp-mapper-loading">Cargando documento...</div>
          ) : (
            <div 
              className="docxp-mapper-viewer scan-line-overlay"
              dangerouslySetInnerHTML={{ __html: htmlContent }} 
            />
          )}

          {/* Floating Popover */}
          {showPopover && (
            <div 
              className="docxp-mapper-popover animate-glow-pulse"
              style={{ top: popoverPos.top, left: popoverPos.left }}
            >
              <div className="popover-arrow" />
              <Space direction="vertical" size={8} style={{ width: 220 }}>
                <Text strong style={{ fontSize: 12 }}>Convertir texto seleccionado</Text>
                <Text type="secondary" italic ellipsis style={{ fontSize: 11, display: 'block' }}>
                  "{selectedText}"
                </Text>
                <Space.Compact style={{ width: '100%' }}>
                  <Input 
                    size="small" 
                    placeholder="Ej: nombre" 
                    prefix="{{" 
                    suffix="}}"
                    value={variableName}
                    onChange={(e) => setVariableName(e.target.value)}
                    onPressEnter={handleAddRule}
                    autoFocus
                  />
                  <Button size="small" type="primary" onClick={handleAddRule}>
                    Añadir
                  </Button>
                </Space.Compact>
              </Space>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
