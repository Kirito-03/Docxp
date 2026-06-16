/**
 * Docxp — Main Application Layout
 */
import { useState } from 'react';
import { Layout, Menu, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './AppLayout.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/generator',
    icon: <ThunderboltOutlined />,
    label: 'Generador',
  },
  {
    key: '/templates',
    icon: <FileTextOutlined />,
    label: 'Plantillas',
  },
  {
    key: '/history',
    icon: <HistoryOutlined />,
    label: 'Historial',
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout className="docxp-layout">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        collapsedWidth={64}
        className="docxp-sider"
        trigger={null}
      >
        {/* Logo */}
        <div className="docxp-logo" onClick={() => navigate('/')}>
          <div className="docxp-logo-icon animate-glow-pulse">
            <ThunderboltOutlined />
          </div>
          {!collapsed && (
            <div className="docxp-logo-text">
              <Text strong className="docxp-logo-title">Docxp</Text>
              <Text className="docxp-logo-subtitle">Document AI</Text>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="docxp-menu"
        />

        {/* Version */}
        {!collapsed && (
          <div className="docxp-sider-footer">
            <Text type="secondary" style={{ fontSize: 11 }}>v1.0.0</Text>
          </div>
        )}
      </Sider>

      <Layout>
        {/* Header */}
        <Header className="docxp-header">
          <Space>
            <div
              className="docxp-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Text className="docxp-header-title">
              {menuItems.find((m) => m.key === location.pathname)?.label || 'Docxp'}
            </Text>
          </Space>
          <div className="docxp-header-right">
            <div className="docxp-status-dot" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              DeepSeek AI
            </Text>
          </div>
        </Header>

        {/* Content */}
        <Content className="docxp-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
