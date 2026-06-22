import { WIZARD_STEP_LABELS, WIZARD_STEPS, type WizardStep } from '@ripple-studio/shared';
import { cn } from '@/lib/utils';

interface WizardStepperProps {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
}

export function WizardStepper({ currentStep, completedSteps }: WizardStepperProps) {
  const currentIndex = WIZARD_STEPS.indexOf(currentStep);

  return (
    <div className="flex gap-1 mb-8 overflow-x-auto pb-2">
      {WIZARD_STEPS.map((step, i) => {
        const isActive = step === currentStep;
        const isComplete = completedSteps.has(step) || i < currentIndex;

        return (
          <div
            key={step}
            className={cn(
              'flex-1 min-w-[80px] text-center py-2 px-1 rounded-lg text-xs font-medium transition-colors',
              isActive && 'bg-ripple-500 text-white',
              !isActive && isComplete && 'bg-ripple-800/60 text-ripple-200 border border-ripple-600/50',
              !isActive && !isComplete && 'bg-ripple-900/40 text-ripple-500 border border-ripple-700/50',
            )}
          >
            <span className="hidden sm:inline">{WIZARD_STEP_LABELS[step]}</span>
            <span className="sm:hidden">{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}