import { useAuth } from '../../context/AuthContext';
import { useUIStore } from '../../store/uiStore';

export default function MobileTopBar() {
  const { user } = useAuth();
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);

  return (
    <header className="md:hidden bg-surface-white border-b border-light flex justify-between items-center h-16 px-margin-mobile w-full z-50 sticky top-0">
      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleMobileNav} aria-label="Open menu">
          <span className="material-symbols-outlined text-primary">menu</span>
        </button>
        <span className="font-headline-md text-headline-md font-bold text-primary">HealthFlow</span>
      </div>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
        {user?.avatarUrl ? (
          <img className="w-full h-full object-cover" src={user.avatarUrl} alt={user.name} />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant text-lg">person</span>
        )}
      </div>
    </header>
  );
}
