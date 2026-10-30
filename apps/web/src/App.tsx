import { Navigate, Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RequireAuth } from './components/RequireAuth';
import { AgentReportsPage } from './pages/AgentReportsPage';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { NewReportPage } from './pages/NewReportPage';
import { SignUpPage } from './pages/SignUpPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<MapPage />} />
        <Route path="report/new" element={<NewReportPage />} />
        <Route
          path="agent/reports"
          element={
            <RequireAuth role="agent">
              <AgentReportsPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
