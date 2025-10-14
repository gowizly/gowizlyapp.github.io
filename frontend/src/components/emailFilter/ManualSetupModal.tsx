import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import './ManualSetupModal.css';

interface ManualSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualSetupModal: React.FC<ManualSetupModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const steps = [
    {
      title: "Step 1: Access Gmail Settings",
      content: (
        <div className="step-content">
          <p>1. Open Gmail in your web browser</p>
          <p>2. Click the gear icon (⚙️) in the top right corner</p>
          <p>3. Select "See all settings" from the dropdown menu</p>
          <p>4. Click on the "Filters and Blocked Addresses" tab</p>
        </div>
      )
    },
    {
      title: "Step 2: Create a New Filter",
      content: (
        <div className="step-content">
          <p>1. Click "Create a new filter" at the bottom of the page</p>
          <p>2. In the "From" field, enter the school email addresses</p>
          <p>3. Separate multiple addresses with "OR" (e.g., school1@edu.com OR school2@edu.com)</p>
          <p>4. Click "Create filter" to continue</p>
        </div>
      )
    },
    {
      title: "Step 3: Configure Filter Actions",
      content: (
        <div className="step-content">
          <p>1. Check the box "Forward it to:" and enter: <strong>processor@gowizly.com</strong></p>
          <p>2. Check the box "Apply the label:" and create a new label called "School Emails"</p>
          <p>3. Optionally check "Skip the Inbox" to keep your inbox clean</p>
          <p>4. Click "Create filter" to save your settings</p>
        </div>
      )
    },
    {
      title: "Step 4: Repeat for PTO Emails",
      content: (
        <div className="step-content">
          <p>1. Create another filter following the same process</p>
          <p>2. Use PTO/PTA email addresses in the "From" field</p>
          <p>3. Forward to the same address: <strong>processor@gowizly.com</strong></p>
          <p>4. Create a label called "PTO Emails" for organization</p>
        </div>
      )
    },
    {
      title: "Step 5: Verify Setup",
      content: (
        <div className="step-content">
          <p>1. Send a test email from one of your configured addresses</p>
          <p>2. Check that it's forwarded to processor@gowizly.com</p>
          <p>3. Verify the email appears in your calendar within a few minutes</p>
          <p>4. Your manual setup is now complete!</p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDone = () => {
    onClose();
    setCurrentStep(1); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">📧 Manual Email Filter Setup</h2>
          <button className="close-button" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="modal-body">
          <div className="step-indicator">
            <div className="step-progress">
              {Array.from({ length: totalSteps }, (_, index) => (
                <div
                  key={index + 1}
                  className={`step-dot ${currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''}`}
                >
                  {currentStep > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
                </div>
              ))}
            </div>
            <div className="step-text">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          <div className="step-content-container">
            <h3 className="step-title">{steps[currentStep - 1].title}</h3>
            {steps[currentStep - 1].content}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="nav-button secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {currentStep === totalSteps ? (
            <button className="nav-button primary" onClick={handleDone}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </button>
          ) : (
            <button className="nav-button primary" onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualSetupModal;

