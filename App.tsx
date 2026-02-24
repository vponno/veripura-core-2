import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Consignments from './pages/Consignments';

import TermsOfService from './pages/TermsOfService';
import AIInsights from './pages/AIInsights';
import AuthDebug from './pages/AuthDebug';
import WalletBackup from './pages/WalletBackup';
import RegisterConsignment from './pages/RegisterConsignment';
import CreateContract from './pages/CreateContract';
import AdminReview from './pages/AdminReview';
import AdminDataExport from './pages/AdminDataExport';
import ExportAssessment from './pages/ExportAssessment';
import Documentation from './pages/Documentation';
import Login from './pages/Login';
import { UserRole } from './types';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PageTracker } from './components/PageTracker';

import { RequireAuth, RequireAdmin } from './components/RequireAuth';

const App: React.FC = () => {
  // Global state for demonstration: toggle between Farmer and Buyer roles
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EXPORTER);

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PageTracker />

      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="*"
              element={
                <RequireAuth>
                  <Layout userRole={userRole} setUserRole={setUserRole}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/create-contract" element={<CreateContract />} />
                      <Route path="/consignments" element={<Consignments />} />

                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/insights" element={<AIInsights />} />
                      <Route path="/wallet" element={<AuthDebug />} />
                      <Route path="/backup-wallet" element={<WalletBackup />} />
                      <Route path="/register-consignment" element={<RegisterConsignment />} />
                      <Route path="/compliance/assessment" element={<ExportAssessment />} />
                      <Route path="/admin-review" element={<RequireAdmin><AdminReview /></RequireAdmin>} />
                      <Route path="/admin/export" element={<RequireAdmin><AdminDataExport /></RequireAdmin>} />
                    </Routes>
                  </Layout>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;