/**
 * Docxp Cyberpunk Dark Theme — Ant Design 5 Design Tokens
 *
 * Aesthetic: Deep blacks, dark grays, intense red accents (#DC2626),
 * sharp corners, and subtle glow effects for a cyberpunk feel.
 */
import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const cyberpunkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,

  token: {
    // === Colors ===
    colorPrimary: '#DC2626',
    colorInfo: '#DC2626',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorLink: '#DC2626',
    colorLinkHover: '#FF4444',

    // === Backgrounds ===
    colorBgBase: '#0A0A0A',
    colorBgContainer: '#111111',
    colorBgElevated: '#1A1A1A',
    colorBgLayout: '#080808',
    colorBgSpotlight: '#DC2626',

    // === Borders ===
    colorBorder: '#2A2A2A',
    colorBorderSecondary: '#1F1F1F',

    // === Text ===
    colorText: '#E8E8E8',
    colorTextSecondary: '#999999',
    colorTextTertiary: '#666666',
    colorTextQuaternary: '#444444',

    // === Typography ===
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 14,

    // === Shape ===
    borderRadius: 4,
    borderRadiusLG: 6,
    borderRadiusSM: 2,

    // === Spacing ===
    controlHeight: 36,
    controlHeightLG: 44,

    // === Motion ===
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',

    // === Shadows ===
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },

  components: {
    // === Layout ===
    Layout: {
      headerBg: '#0D0D0D',
      bodyBg: '#080808',
      siderBg: '#0D0D0D',
      triggerBg: '#DC2626',
      triggerColor: '#FFFFFF',
    },

    // === Menu ===
    Menu: {
      darkItemBg: '#0D0D0D',
      darkItemSelectedBg: 'rgba(220, 38, 38, 0.15)',
      darkItemSelectedColor: '#DC2626',
      darkItemHoverBg: 'rgba(220, 38, 38, 0.08)',
      darkItemColor: '#999999',
      darkSubMenuItemBg: '#0A0A0A',
    },

    // === Button ===
    Button: {
      primaryShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
      borderRadius: 4,
      controlHeight: 38,
      fontWeight: 600,
    },

    // === Input ===
    Input: {
      activeBorderColor: '#DC2626',
      hoverBorderColor: '#991B1B',
      activeShadow: '0 0 0 2px rgba(220, 38, 38, 0.15)',
    },

    // === Card ===
    Card: {
      colorBgContainer: '#111111',
      colorBorderSecondary: '#1F1F1F',
    },

    // === Table ===
    Table: {
      headerBg: '#141414',
      headerColor: '#DC2626',
      rowHoverBg: 'rgba(220, 38, 38, 0.04)',
      borderColor: '#1F1F1F',
      headerSortActiveBg: '#1A1A1A',
    },

    // === Modal ===
    Modal: {
      contentBg: '#141414',
      headerBg: '#141414',
      titleColor: '#E8E8E8',
    },

    // === Upload ===
    Upload: {
      colorBorder: '#2A2A2A',
    },

    // === Tabs ===
    Tabs: {
      inkBarColor: '#DC2626',
      itemActiveColor: '#DC2626',
      itemSelectedColor: '#DC2626',
      itemHoverColor: '#FF4444',
    },

    // === Select ===
    Select: {
      optionSelectedBg: 'rgba(220, 38, 38, 0.15)',
    },

    // === Tag ===
    Tag: {
      borderRadiusSM: 2,
    },

    // === Statistic ===
    Statistic: {
      titleFontSize: 13,
      contentFontSize: 28,
    },

    // === Tooltip ===
    Tooltip: {
      colorBgSpotlight: '#1A1A1A',
      colorTextLightSolid: '#E8E8E8',
    },
  },
};

export default cyberpunkTheme;
