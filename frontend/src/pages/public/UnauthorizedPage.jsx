import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  usePageTitle('Access Denied');
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  function goToDashboard() {
    if (!isAuthenticated) return navigate('/login');
    if (role === 'doctor') return navigate('/doctor/dashboard');
    if (role === 'admin') return navigate('/admin/dashboard');
    navigate('/patient/dashboard');
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-error icon-fill" style={{ fontSize: '32px' }}>block</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-3">Access Denied</h1>
        <p className="font-body-lg text-body-lg text-text-muted mb-8 leading-relaxed">
          You don't have permission to view this page. This area is restricted to a different role.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border-light bg-surface-white text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Go Back
          </button>
          <button onClick={goToDashboard}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
            My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
