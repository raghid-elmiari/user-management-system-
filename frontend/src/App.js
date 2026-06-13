import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/common/ProtectedRoute';
import { PermissionGate } from './components/common/PermissionGate';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { HierarchyPage } from './pages/HierarchyPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/users"
              element={
                <PermissionGate permission="user:read" redirectTo="/dashboard">
                  <UsersPage />
                </PermissionGate>
              }
            />
            <Route
              path="/roles"
              element={
                <PermissionGate permission="role:read" redirectTo="/dashboard">
                  <RolesPage />
                </PermissionGate>
              }
            />
            <Route
              path="/permissions"
              element={
                <PermissionGate permission="permission:read" redirectTo="/dashboard">
                  <PermissionsPage />
                </PermissionGate>
              }
            />
            <Route
              path="/hierarchy"
              element={
                <PermissionGate permission="hierarchy:read" redirectTo="/dashboard">
                  <HierarchyPage />
                </PermissionGate>
              }
            />
          </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;