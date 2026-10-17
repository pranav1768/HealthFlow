import { Outlet } from 'react-router-dom';
import SideNavBar from './SideNavBar';
import MobileTopBar from './MobileTopBar';
import MobileNavDrawer from './MobileNavDrawer';
import TopNavBar from './TopNavBar';
import { useUIStore } from '../../store/uiStore';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const addNotification = useUIStore((s) => s.addNotification);
  const { isAuthenticated } = useAuth();

  // Note: ProtectedRoute handles redirecting unauthenticated users
  // We don't redirect here to allow the logout transition animation to play

  useSocket({
    'appointment:confirmed': () => {
      addNotification({
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        body: 'Payment received. Appointment is now confirmed.',
      });
    },
    'appointment:cancelled': (data) => {
      addNotification({
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        body: data?.reason || 'An appointment has been cancelled.',
      });
    },
    'new:booking': (data) => {
      addNotification({
        type: 'new_booking',
        title: 'New Appointment Booked',
        body: data?.patientName ? `${data.patientName} booked a slot.` : 'A new appointment has been booked.',
      });
    },
    'emergency:alert': (data) => {
      addNotification({
        type: 'emergency',
        title: `Emergency: ${data.type?.replace(/_/g, ' ')}`,
        body: `Dr. ${data.doctor?.name}${data.patientName ? ` — Patient: ${data.patientName}` : ''}${data.note ? ` — ${data.note}` : ''}`,
      });
    },
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Mobile */}
      <MobileTopBar />
      <MobileNavDrawer />

      {/* Desktop sidebar */}
      <SideNavBar />

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top nav bar — only on desktop and only when authenticated */}
        {isAuthenticated && (
          <div className="hidden md:block">
            <TopNavBar />
          </div>
        )}

        <main className="flex-1 p-margin-mobile md:p-margin-desktop">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
