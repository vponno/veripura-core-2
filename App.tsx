import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Consignments from './pages/Consignments';
import SupplyChain from './pages/SupplyChain';
import AIInsights from './pages/AIInsights';
import AuthDebug from './pages/AuthDebug';
import WalletBackup from './pages/WalletBackup';
import RegisterConsignment from './pages/RegisterConsignment';
import CreateContract from './pages/CreateContract';
import AdminReview from './pages/AdminReview';
import AdminDataExport from './pages/AdminDataExport';
import ExportAssessment from './pages/ExportAssessment'; // New Import
import Login from './pages/Login';
import { UserRole } from './types';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PageTracker } from './components/PageTracker';

import { RequireAuth, RequireAdmin } from './components/RequireAuth';

const App: React.FC = () => {
  // Global state for demonstration: toggle between Farmer and Buyer roles
  const [userRole, setUserRole] = useState<UserRole>(UserRole.EXPORTER);
  const [isArchiving, setIsArchiving] = useState(false);

  // Temporary Helper for Demo Cleanup
  const handleArchiveAll = async () => {
    if (!window.confirm("Are you sure you want to ARCHIVE ALL active consignments?")) return;
    setIsArchiving(true);
    try {
      const { consignmentService } = await import('./services/consignmentService');
      const count = await consignmentService.archiveAllConsignments();
      alert(`Archived ${count} consignments.`);
    } catch (e) {
      console.error(e);
      alert("Error archiving data.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <HashRouter>
      <PageTracker />

      {/* Dev Tool: Archive Button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={handleArchiveAll}
          disabled={isArchiving}
          className="bg-red-600 text-white px-3 py-1 text-xs rounded shadow hover:bg-red-700 opacity-50 hover:opacity-100 transition-opacity"
        >
          {isArchiving ? 'Archiving...' : 'Archive All Demo Data'}
        </button>
      </div>

      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="*"
              element={
                <RequireAuth>
                  <Layout userRole={userRole} setUserRole={setUserRole}>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
                      <Route path="/create-contract" element={<CreateContract />} />
                      <Route path="/consignments" element={<Consignments />} />
                      <Route path="/supply-chain" element={<SupplyChain />} />
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