import { useNavigate } from 'react-router-dom';
import usePageTitle from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import usePageTransition from '../../hooks/usePageTransition';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const { transitionTo } = usePageTransition();

  function goHome() {
    if (!isAuthenticated) return transitionTo('/');
    if (role === 'doctor') return transitionTo('/doctor/dashboard');
    if (role === 'admin') return transitionTo('/admin/dashboard');
    transitionTo('/patient/dashboard');
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-black text-primary/10 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary icon-fill" style={{ fontSize: '36px' }}>
                search_off
              </span>
            </div>
          </div>
        </div>

        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-3">
          Page Not Found
        </h1>
        <p className="font-body-lg text-body-lg text-text-muted mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border-light bg-surface-white text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Go Back
          </button>
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
