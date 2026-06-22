import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/pages/Login';
import EmpDashboard from '@/pages/employee/EmpDashboard';
import LearningCenter from '@/pages/employee/LearningCenter';
import ExamCenter from '@/pages/employee/ExamCenter';
import MyCertificates from '@/pages/employee/MyCertificates';
import HRDashboard from '@/pages/hr/HRDashboard';
import CourseManagement from '@/pages/hr/CourseManagement';
import QuestionBank from '@/pages/hr/QuestionBank';
import PositionManagement from '@/pages/hr/PositionManagement';
import CertificateConfig from '@/pages/hr/CertificateConfig';
import ComplianceBoard from '@/pages/hr/ComplianceBoard';
import ExamRecords from '@/pages/hr/ExamRecords';
import DataExport from '@/pages/hr/DataExport';

function RequireAuth({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { user, role } = useAuthStore();
  const location = useLocation();

  if (!user || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'hr') {
      return <Navigate to="/hr/dashboard" replace />;
    }
    return <Navigate to="/emp/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, role } = useAuthStore();
  const location = useLocation();

  if (location.pathname === '/login') {
    if (user && role) {
      return <Navigate to={role === 'hr' ? '/hr/dashboard' : '/emp/dashboard'} replace />;
    }
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/hr/dashboard"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <HRDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/courses"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <CourseManagement />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/questions"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <QuestionBank />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/positions"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <PositionManagement />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/cert-config"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <CertificateConfig />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/compliance"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <ComplianceBoard />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/exam-records"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <ExamRecords />
          </RequireAuth>
        }
      />
      <Route
        path="/hr/export"
        element={
          <RequireAuth allowedRoles={['hr']}>
            <DataExport />
          </RequireAuth>
        }
      />

      <Route
        path="/emp/dashboard"
        element={
          <RequireAuth allowedRoles={['employee']}>
            <EmpDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/emp/learning"
        element={
          <RequireAuth allowedRoles={['employee']}>
            <LearningCenter />
          </RequireAuth>
        }
      />
      <Route
        path="/emp/exams"
        element={
          <RequireAuth allowedRoles={['employee']}>
            <ExamCenter />
          </RequireAuth>
        }
      />
      <Route
        path="/emp/certificates"
        element={
          <RequireAuth allowedRoles={['employee']}>
            <MyCertificates />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          user && role ? (
            <Navigate to={role === 'hr' ? '/hr/dashboard' : '/emp/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
