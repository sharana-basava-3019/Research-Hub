/**
 * Main App Component
 * Routes and application structure with lazy loading for optimal build and startup performance
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Analytics } from '@vercel/analytics/react';
import './styles/NiceSchoolGlobal.css';
import './styles/GlobalDesignSystem.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout Components (kept eagerly loaded for instant shell render)
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';
import RevocationAlertBanner from './components/RevocationAlertBanner';

// Eagerly loaded critical landing & auth pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy loaded feature pages for faster initial startup & smaller bundles
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const EditProject = lazy(() => import('./pages/EditProject'));
const Collaborations = lazy(() => import('./pages/Collaborations'));
const SendCollaborationRequest = lazy(() => import('./pages/SendCollaborationRequest'));
const VerificationRequests = lazy(() => import('./pages/VerificationRequests'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const PlagiarismChecker = lazy(() => import('./pages/PlagiarismChecker'));
const UploadDocument = lazy(() => import('./pages/UploadDocument'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <RevocationAlertBanner />
          
          <main className="main-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetails />} />
                <Route path="/send-collaboration-request" element={<SendCollaborationRequest />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                <Route path="/notifications" element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } />
                <Route path="/projects/create" element={
                  <PrivateRoute>
                    <CreateProject />
                  </PrivateRoute>
                } />
                <Route path="/projects/edit/:id" element={
                  <PrivateRoute>
                    <EditProject />
                  </PrivateRoute>
                } />
                <Route path="/collaborations" element={
                  <PrivateRoute>
                    <Collaborations />
                  </PrivateRoute>
                } />
                <Route path="/verification-requests" element={
                  <PrivateRoute>
                    <VerificationRequests />
                  </PrivateRoute>
                } />
                <Route path="/plagiarism" element={
                  <PrivateRoute>
                    <PlagiarismChecker />
                  </PrivateRoute>
                } />
                <Route path="/upload" element={
                  <PrivateRoute>
                    <UploadDocument />
                  </PrivateRoute>
                } />
                <Route path="/admin" element={
                  <PrivateRoute adminOnly={true}>
                    <AdminPanel />
                  </PrivateRoute>
                } />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          
          <Footer />
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Vercel Web Analytics */}
        <Analytics />
      </Router>
    </AuthProvider>
  );
}

export default App;
