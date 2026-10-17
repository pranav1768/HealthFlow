import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../context/AuthContext';

export default function VideoConsultPage() {
  usePageTitle('Video Consultation');
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const [status, setStatus] = useState('loading');

  const appointmentId = state?.appointmentId;
  const doctorName = state?.doctorName || 'Doctor';
  const roomName = appointmentId
    ? `healthflow-${appointmentId.replace(/[^a-zA-Z0-9]/g, '')}`
    : `healthflow-${Date.now()}`;

  useEffect(() => {
    if (!appointmentId || scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    function startMeeting() {
      if (!window.JitsiMeetExternalAPI || !containerRef.current) return;
      if (apiRef.current) return; // already initialised

      try {
        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: user?.name || 'User' },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            disableDeepLinking: true,
            disableInviteFunctions: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'hangup'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        });
        apiRef.current.addEventListener('videoConferenceJoined', () => setStatus('ready'));
        apiRef.current.addEventListener('readyToClose', () => setStatus('ended'));
      } catch {
        setStatus('error');
      }
    }

    // If Jitsi is already loaded from a previous render, just start
    if (window.JitsiMeetExternalAPI) {
      startMeeting();
      return;
    }

    // Load script once
    const existing = document.getElementById('jitsi-script');
    if (existing) {
      existing.addEventListener('load', startMeeting);
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-script';
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = startMeeting;
    script.onerror = () => setStatus('error');
    document.head.appendChild(script);

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch {}
        apiRef.current = null;
      }
    };
  }, [appointmentId]);

  function handleEnd() {
    if (apiRef.current) {
      try { apiRef.current.executeCommand('hangup'); } catch {}
    }
    setStatus('ended');
  }

  function goBack() {
    role === 'doctor' ? navigate('/doctor/appointments') : navigate('/patient/appointments');
  }

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '32px' }}>video_camera_front</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">No Appointment Found</h2>
          <p className="font-body-md text-body-md text-text-muted mb-6">Please join from your appointments page.</p>
          <button onClick={goBack} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0c1776] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/30 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill" style={{ fontSize: '18px' }}>health_and_safety</span>
          </div>
          <span className="text-white font-bold text-lg">HealthFlow</span>
          <span className="text-white/40 mx-2">|</span>
          <span className="text-white/70 font-body-md text-body-md">
            {role === 'doctor' ? 'Patient Consultation' : `Dr. ${doctorName}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {status === 'ready' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e8e3e]/20 border border-[#1e8e3e]/40">
              <span className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse" />
              <span className="text-[#34A853] font-label-sm text-label-sm">Live</span>
            </div>
          )}
          <button onClick={handleEnd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error text-white font-label-md text-label-md hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call_end</span>
            End Call
          </button>
        </div>
      </div>

      {/* Video container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Jitsi iframe mounts here — always rendered so Jitsi has a DOM node */}
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ display: status === 'ended' || status === 'error' ? 'none' : 'block' }}
        />

        {/* Loading overlay */}
        <AnimatePresence>
          {status === 'loading' && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0c1776] z-10">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <p className="text-white/70 font-body-md text-body-md">Starting video consultation…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ended screen */}
        {status === 'ended' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#0c1776] z-10">
            <div className="w-20 h-20 rounded-full bg-[#e6f4ea] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1e8e3e] icon-fill" style={{ fontSize: '40px' }}>check_circle</span>
            </div>
            <div className="text-center">
              <h2 className="text-white font-headline-sm text-headline-sm font-bold mb-2">Consultation Ended</h2>
              <p className="text-white/60 font-body-md text-body-md">Thank you for using HealthFlow Video.</p>
            </div>
            <button onClick={goBack}
              className="px-8 py-3 bg-white text-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity">
              Back to Appointments
            </button>
          </motion.div>
        )}

        {/* Error screen */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <span className="material-symbols-outlined text-white/50" style={{ fontSize: '64px' }}>video_camera_front</span>
            <p className="text-white/70 font-body-md text-body-md text-center max-w-sm px-4">
              Could not load video. Check your internet connection and try again.
            </p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl font-label-md text-label-md hover:bg-white/20">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
