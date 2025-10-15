import React from 'react';
import { X } from 'lucide-react';
import './ManualSetupModal.css';

interface ManualSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualSetupModal: React.FC<ManualSetupModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText('processor@gowizly.com');
    alert('Email address copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-3">
          🛠 Manual Email Forwarding Setup
        </h2>

        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
          <li>
            Open{' '}
            <a
              href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Gmail Forwarding Settings
            </a>.
          </li>
          <li>
            Click <strong>“Add a forwarding address”</strong>.
          </li>
          <li>
            Enter this address:{' '}
            <code className="bg-gray-100 p-1 rounded">
              processor@gowizly.com
            </code>
            <button
              onClick={copyToClipboard}
              className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
              type="button"
            >
              (Copy)
            </button>
          </li>
          <li>
            Gmail will send a verification email to{' '}
            <code>processor@gowizly.com</code>. Our system will auto-verify it.
          </li>
          <li>
            Once verified, go back to Forwarding Settings and select{' '}
            <strong>
              “Forward a copy of incoming mail to processor@gowizly.com”
            </strong>.
          </li>
          <li>Save changes — you’re done!</li>
        </ol>

        <p className="text-xs text-gray-500 mt-3">
          You can now close this panel and return to your dashboard.
        </p>
      </div>
    </div>
  );
};

export default ManualSetupModal;
