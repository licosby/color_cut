import { useState } from 'react';
import { useAppState } from '../state/UIState';

/**
 * Onboarding - Step-by-step wizard for first-time users
 * Stores completion in localStorage
 */
export function Onboarding() {
  const { state, dispatch } = useAppState();
  const [currentStep, setCurrentStep] = useState(0);

  if (!state.showOnboarding) return null;

  const steps = [
    {
      icon: '📂',
      title: 'Load Your 3D Model',
      description: 'Click "Load Model" to upload an STL, OBJ, GLB, or 3MF file with colors.',
    },
    {
      icon: '👆',
      title: 'Click a Part to Select It',
      description: 'Click directly on the 3D model to select a color, or pick from the color palette on the right.',
    },
    {
      icon: '✂️',
      title: 'Press Separate',
      description: 'Click "Separate" to create a new layer from the selected color. The part becomes its own layer!',
    },
    {
      icon: '🔄',
      title: 'Repeat for All Colors',
      description: 'Keep selecting and separating until all the parts you want are in their own layers.',
    },
    {
      icon: '📦',
      title: 'Export All Layers',
      description: 'When you\'re done, click "Export All Layers" to save each layer as a separate STL file.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dispatch({ type: 'DISMISS_ONBOARDING' });
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'DISMISS_ONBOARDING' });
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center shadow-sm">
            <span className="text-4xl">{step.icon}</span>
          </div>

          {/* Step indicator */}
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">
            Step {currentStep + 1} of {steps.length}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-purple-500 w-6'
                    : idx < currentStep
                    ? 'bg-purple-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 px-4 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {currentStep < steps.length - 1 ? 'Next' : "Got it! 🎉"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
