import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import usePageTitle from '../../hooks/usePageTitle';

// Admin accounts can only be created via the seed script — never via the UI
const REGISTER_ROLES = ['patient', 'doctor'];
const LOGIN_ROLES = ['patient', 'doctor', 'admin']; // admin can still log in

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().optional(),
    specialization: z.string().optional(),
    consultationFee: z.union([z.string(), z.number()]).optional(),
  })
  .refine((data) => true, {}); // role-specific validation done at submit time via role state

function dashboardPathForRole(role) {
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/patient/dashboard';
}

export default function LoginRegisterPage() {
  usePageTitle('Sign In');
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [activeRole, setActiveRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm({ resolver: zodResolver(registerSchema) });

  const isLogin = mode === 'login';

  async function onLoginSubmit(values) {
    setServerError('');
    try {
      const user = await login(values.email, values.password);
      setTransitioning(true);
      setTimeout(() => navigate(dashboardPathForRole(user.role), { replace: true }), 500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  }

  async function onRegisterSubmit(values) {
    setServerError('');
    if (activeRole === 'doctor' && (!values.specialization || !values.consultationFee)) {
      setServerError('Specialization and consultation fee are required for doctor accounts.');
      return;
    }
    try {
      const user = await registerUser({
        ...values,
        role: activeRole,
        consultationFee: values.consultationFee ? Number(values.consultationFee) : undefined,
      });
      setTransitioning(true);
      setTimeout(() => navigate(dashboardPathForRole(user.role), { replace: true }), 500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  }

  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop antialiased overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Page transition overlay */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            className="fixed inset-0 z-[999] bg-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>
      {/* Background: blurred hospital/clinic image with dark gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover scale-110"
          style={{ filter: 'blur(8px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-secondary/60" />
      </div>

      {/* Floating brand mark, top-left, visible above the blur */}
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 z-20 flex items-center gap-2 text-surface-white hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-2xl icon-fill">health_and_safety</span>
        <span className="font-headline-md text-headline-md font-bold">HealthFlow</span>
      </Link>

      <main className="relative z-10 w-full max-w-[480px]">
        <div
          className="rounded-xl p-stack-md md:p-stack-lg shadow-2xl border border-white/20"
          style={{
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
          }}
        >
          <div className="text-center mb-stack-lg">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                health_and_safety
              </span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary tracking-tight">
                HealthFlow
              </h1>
            </div>
            <p className="font-body-md text-body-md text-text-muted">
              {isLogin ? 'Welcome back. Please select your role and sign in.' : 'Create your HealthFlow account.'}
            </p>
          </div>

          {/* Login / Register toggle */}
          <div className="flex p-1 bg-surface-container-low rounded-lg mb-stack-sm">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-center rounded font-label-md text-label-md transition-all ${
                isLogin ? 'bg-surface-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-center rounded font-label-md text-label-md transition-all ${
                !isLogin ? 'bg-surface-white shadow-sm text-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selection Tabs — admin hidden on register, visible on login */}
          <div className="flex p-1 bg-surface-container-low rounded-lg mb-stack-md relative">
            {(isLogin ? LOGIN_ROLES : REGISTER_ROLES).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setActiveRole(r); setServerError(''); }}
                className={`flex-1 py-2 text-center rounded font-label-md text-label-md transition-all capitalize relative z-10 ${
                  activeRole === r ? 'text-primary font-semibold' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {activeRole === r && (
                  <motion.div
                    layoutId="role-indicator"
                    className="absolute inset-0 bg-surface-white rounded shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {r}
              </button>
            ))}
          </div>

          {serverError && (
            <div className="mb-stack-sm px-4 py-3 rounded-lg bg-error-container text-on-error-container font-body-md text-body-md">
              {serverError}
            </div>
          )}

          {isLogin ? (
            <form className="flex flex-col gap-stack-md" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-text-primary" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    style={{ fontSize: '20px' }}
                  >
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-error text-label-sm font-label-sm">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="font-label-sm text-label-sm text-text-primary" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('To reset your password, contact support at support@healthflow.app')}
                    className="font-label-sm text-label-sm text-secondary hover:underline transition-all"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    style={{ fontSize: '20px' }}
                  >
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-error text-label-sm font-label-sm">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full bg-primary-container text-on-primary font-label-md text-label-md rounded-full py-3 hover:bg-primary transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign In'}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-stack-md" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-text-primary" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                  {...registerForm.register('name')}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-error text-label-sm font-label-sm">{registerForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-text-primary" htmlFor="reg-email">
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-error text-label-sm font-label-sm">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-text-primary" htmlFor="reg-password">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                  {...registerForm.register('password')}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-error text-label-sm font-label-sm">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-text-primary" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="9XXXXXXXXX"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                  {...registerForm.register('phone')}
                />
              </div>

              {activeRole === 'doctor' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-text-primary" htmlFor="specialization">
                      Specialization
                    </label>
                    <input
                      id="specialization"
                      type="text"
                      placeholder="e.g. Cardiologist"
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                      {...registerForm.register('specialization')}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm text-text-primary" htmlFor="consultationFee">
                      Consultation Fee (₹)
                    </label>
                    <input
                      id="consultationFee"
                      type="number"
                      min="0"
                      placeholder="500"
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-text-muted bg-surface-white"
                      {...registerForm.register('consultationFee')}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full bg-primary-container text-on-primary font-label-md text-label-md rounded-full py-3 hover:bg-primary transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {registerForm.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </button>
            </form>
          )}

          <div className="relative flex items-center justify-center mt-stack-md mb-stack-md">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-light" />
            </div>
            <div className="relative bg-surface-white px-4 font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
              Or continue with
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              disabled
              title="Google sign-in is not part of this build"
              className="w-full flex items-center justify-center gap-3 border border-outline-variant rounded-full py-2.5 font-label-md text-label-md text-text-primary bg-surface-white opacity-60 cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.73 17.57C14.74 18.23 13.48 18.63 12 18.63C9.13999 18.63 6.70999 16.7 5.84999 14.12H2.17999V16.96C3.98999 20.55 7.7 23 12 23Z"
                  fill="#34A853"
                />
                <path
                  d="M5.84999 14.12C5.62999 13.46 5.49999 12.74 5.49999 12C5.49999 11.26 5.61999 10.54 5.83999 9.88V7.04H2.17999C1.42999 8.52 1 10.21 1 12C1 13.79 1.42999 15.48 2.17999 16.96L5.84999 14.12Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38C13.62 5.38 15.06 5.94 16.2 7.02L19.38 3.84C17.45 2.05 14.96 1 12 1C7.7 1 3.98999 3.45 2.17999 7.04L5.84999 9.88C6.70999 7.3 9.13999 5.38 12 5.38Z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </div>

          <p className="text-center mt-stack-md font-label-sm text-label-sm text-text-muted">
            <Link to="/" className="text-secondary hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </motion.div>
  );
}
