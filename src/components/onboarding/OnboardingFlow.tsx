'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

interface OnboardingFlowProps {
  onComplete: () => void;
}

/* ------------------------------------------------------------------ */
/*  SVG icon components                                                */
/* ------------------------------------------------------------------ */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

interface StepConfig {
  icon?: React.ComponentType<{ className?: string }>;
  heading: string | ((companyName: string) => string);
  subtitle: string;
  showProgressDots: boolean;
  activeDot?: number;       // 0-indexed among the 4 dots (steps 2-5)
  primaryLabel: string;
  showBack: boolean;
  isGoldPrimary: boolean;   // true for "Get Started" and "Finish"
}

const STEPS: StepConfig[] = [
  {
    heading: (name: string) => `Welcome to your Genesis Terminal, ${name}`,
    subtitle: "Here's a quick look at what's inside.",
    showProgressDots: false,
    primaryLabel: 'Get Started',
    showBack: false,
    isGoldPrimary: true,
  },
  {
    icon: HomeIcon,
    heading: 'This is your Overview',
    subtitle: 'The numbers that matter, updated in real time.',
    showProgressDots: true,
    activeDot: 0,
    primaryLabel: 'Next',
    showBack: false,
    isGoldPrimary: false,
  },
  {
    icon: BarChartIcon,
    heading: 'Channels',
    subtitle: 'See exactly where your money goes and what it produces.',
    showProgressDots: true,
    activeDot: 1,
    primaryLabel: 'Next',
    showBack: true,
    isGoldPrimary: false,
  },
  {
    icon: UsersIcon,
    heading: 'Your Leads',
    subtitle: 'Track every person from first click to signed client.',
    showProgressDots: true,
    activeDot: 2,
    primaryLabel: 'Next',
    showBack: true,
    isGoldPrimary: false,
  },
  {
    icon: MessageIcon,
    heading: 'Inbox',
    subtitle: 'Your direct line to your growth team. No email needed.',
    showProgressDots: true,
    activeDot: 3,
    primaryLabel: 'Finish',
    showBack: true,
    isGoldPrimary: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                           */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, company } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const companyName = company?.company_name ?? 'your company';

  /* ---- helpers --------------------------------------------------- */

  const markComplete = async () => {
    try {
      const supabase = createSupabaseBrowser();
      if (user?.id) {
        await supabase
          .from('users')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Failed to mark onboarding complete:', err);
    }
    onComplete();
  };

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      markComplete();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSkip = () => {
    markComplete();
  };

  /* ---- current step config --------------------------------------- */

  const current = STEPS[step];
  const Icon = current.icon;
  const headingText =
    typeof current.heading === 'function'
      ? current.heading(companyName)
      : current.heading;

  const showSkip = step < STEPS.length - 1;

  /* ---- render ---------------------------------------------------- */

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-genesis-card border border-genesis-border rounded-card p-8 max-w-md w-full mx-auto overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            {Icon && (
              <div className="mb-4">
                <Icon className="w-12 h-12 text-genesis-gold" />
              </div>
            )}

            {/* Heading */}
            <h2 className="text-2xl font-semibold text-genesis-text">
              {headingText}
            </h2>

            {/* Subtitle */}
            <p className="text-genesis-secondary mt-2">{current.subtitle}</p>

            {/* Progress dots */}
            {current.showProgressDots && (
              <div className="flex items-center gap-2 mt-6">
                {[0, 1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      dot === current.activeDot
                        ? 'bg-genesis-gold'
                        : 'bg-genesis-border'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-8 w-full justify-center">
              {current.showBack && (
                <button
                  onClick={handleBack}
                  className="bg-genesis-card border border-genesis-border rounded-lg px-6 py-2.5 text-genesis-secondary hover:border-genesis-secondary transition-colors"
                >
                  Back
                </button>
              )}

              <button
                onClick={handleNext}
                className={
                  current.isGoldPrimary
                    ? 'bg-genesis-gold text-genesis-bg font-medium rounded-lg px-6 py-3 hover:bg-genesis-gold-hover transition-colors'
                    : 'bg-genesis-gold text-genesis-bg rounded-lg px-6 py-2.5 hover:bg-genesis-gold-hover transition-colors'
                }
              >
                {current.primaryLabel}
              </button>
            </div>

            {/* Skip tour */}
            {showSkip && (
              <button
                onClick={handleSkip}
                className="text-sm text-genesis-muted hover:text-genesis-secondary mt-4 transition-colors"
              >
                Skip tour
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
