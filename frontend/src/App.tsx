/**
 * Docxp — Main Application Router
 */
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import esES from 'antd/locale/es_ES';
import cyberpunkTheme from './theme/cyberpunkTheme';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Templates from './pages/Templates';
import History from './pages/History';

export default function App() {
  return (
    <ConfigProvider theme={cyberpunkTheme} locale={esES}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/generator" element={<Generator />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
