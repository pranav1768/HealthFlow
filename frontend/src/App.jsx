import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import OfflineOverlay from './components/shared/OfflineOverlay';
import HelpCentrePage from './pages/HelpCentrePage';
import NotFoundPage from './pages/public/NotFoundPage';
import VideoConsultPage from './pages/VideoConsultPage';
import PageTransitionOverlay from './components/PageTransitionOverlay';

// Public
import HomePage from './pages/public/HomePage';
import LoginRegisterPage from './pages/public/LoginRegisterPage';
import UnauthorizedPage from './pages/public/UnauthorizedPage';

// Patient
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import DoctorSearchPage from './pages/patient/DoctorSearchPage';
import BookAppointmentPage from './pages/patient/BookAppointmentPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientMedicalRecordsPage from './pages/patient/PatientMedicalRecordsPage';
import PaymentMethodSelectionPage from './pages/patient/PaymentMethodSelectionPage';
import PaymentProcessingPage from './pages/patient/PaymentProcessingPage';
import PaymentsBillingHistoryPage from './pages/patient/PaymentsBillingHistoryPage';
import PatientSettingsPage from './pages/patient/PatientSettingsPage';
import DoctorProfilePage from './pages/patient/DoctorProfilePage';

// Doctor
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorRecordsPage from './pages/doctor/DoctorRecordsPage';
import DoctorSchedulePage from './pages/doctor/DoctorSchedulePage';
import DoctorSettingsPage from './pages/doctor/DoctorSettingsPage';

// Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/register" element={<LoginRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Shared authenticated routes — accessible by ALL roles */}
      <Route element={<ProtectedRoute roles={['patient', 'doctor', 'admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/help" element={<HelpCentrePage />} />
          <Route path="/video-consult" element={<VideoConsultPage />} />
        </Route>
      </Route>

      {/* Patient routes */}
      <Route element={<ProtectedRoute roles={['patient']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
          <Route path="/patient/find-doctors" element={<DoctorSearchPage />} />
          <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="/patient/appointments/book" element={<BookAppointmentPage />} />
          <Route path="/patient/records" element={<PatientMedicalRecordsPage />} />
          <Route path="/patient/payments" element={<PaymentsBillingHistoryPage />} />
          <Route path="/patient/payments/select" element={<PaymentMethodSelectionPage />} />
          <Route path="/patient/settings" element={<PatientSettingsPage />} />
          <Route path="/patient/doctors/:id" element={<DoctorProfilePage />} />
        </Route>
        {/* Processing page is a fullscreen overlay — rendered outside DashboardLayout */}
        <Route path="/patient/payments/processing" element={<PaymentProcessingPage />} />
      </Route>

      {/* Doctor routes */}
      <Route element={<ProtectedRoute roles={['doctor']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
          <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
          <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
          <Route path="/doctor/records" element={<DoctorRecordsPage />} />
          <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
          <Route path="/doctor/settings" element={<DoctorSettingsPage />} />
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <OfflineOverlay />
    <PageTransitionOverlay />
    </>
  );
}
