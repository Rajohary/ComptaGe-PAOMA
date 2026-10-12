import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { BureauxPage } from './features/bureaux/BureauxPage';
import { PeriodesGestionPage } from './features/periodes-gestion/PeriodesGestionPage';
import { HealthPage } from './features/dashboard/HealthPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/bureaux" replace />} />
          <Route path="/bureaux" element={<BureauxPage />} />
          <Route path="/periodes-gestion" element={<PeriodesGestionPage />} />
          <Route path="/sante" element={<HealthPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
