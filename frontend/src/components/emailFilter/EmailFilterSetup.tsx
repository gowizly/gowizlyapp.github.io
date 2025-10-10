import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ManualSetupModal from './ManualSetupModal';
import './EmailFilterSetup.css';

interface UserData {
  name: string;
  email: string;
  avatar?: string | null;
}

interface EmailFilterSetupProps {
  userData?: UserData;
}

const EmailFilterSetup: React.FC<EmailFilterSetupProps> = ({ 
  userData
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use current logged-in user or fallback to provided userData
  const currentUser = user || userData || {
    name: "User",
    email: "user@example.com",
    avatar: null
  };
  const [schoolEmails, setSchoolEmails] = useState<string[]>([]);
  const [ptoEmails, setPtoEmails] = useState<string[]>([]);
  const [schoolEmailInput, setSchoolEmailInput] = useState('');
  const [ptoEmailInput, setPtoEmailInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = (type: 'school' | 'pto') => {
    const input = type === 'school' ? schoolEmailInput : ptoEmailInput;
    const email = input.trim();

    if (!email) return;
    
    if (!isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (type === 'school') {
      if (schoolEmails.includes(email)) {
        alert('This email is already added');
        return;
      }
      setSchoolEmails([...schoolEmails, email]);
      setSchoolEmailInput('');
    } else {
      if (ptoEmails.includes(email)) {
        alert('This email is already added');
        return;
      }
      setPtoEmails([...ptoEmails, email]);
      setPtoEmailInput('');
    }
  };

  const removeEmail = (type: 'school' | 'pto', email: string) => {
    if (type === 'school') {
      setSchoolEmails(schoolEmails.filter(e => e !== email));
    } else {
      setPtoEmails(ptoEmails.filter(e => e !== email));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'school' | 'pto') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail(type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (schoolEmails.length === 0 && ptoEmails.length === 0) {
      alert('Please add at least one email address');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to create Gmail filters
      await createGmailFilters({
        schoolEmails,
        ptoEmails,
        forwardTo: 'calendar-processor@yourapp.com',
        userEmail: currentUser.email
      });

      setShowSuccess(true);
      
    } catch (error) {
      console.error('Setup failed:', error);
      alert('Setup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Gmail API integration
  const createGmailFilters = async (config: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Creating Gmail filters with config:', config);
    return { success: true };
  };

  return (
    <div className="email-filter-container">
      <div className="container">
        <div className="header">
          <h1>📧 Email Filter Setup</h1>
          <p>Configure automatic email filtering and calendar integration</p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {'avatar' in currentUser && currentUser.avatar ? (
              <img src={currentUser.avatar} alt="User Avatar" />
            ) : (
              currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div>
            <div><strong>{currentUser.name}</strong></div>
            <div className="user-email">{currentUser.email}</div>
          </div>
        </div>

        <form id="emailFilterForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="schoolEmails">School Email Addresses</label>
            <div className="email-input-container">
              <input 
                type="email" 
                id="schoolEmails" 
                className="email-input" 
                placeholder="e.g., noreply@schooldistrict.edu"
                value={schoolEmailInput}
                onChange={(e) => setSchoolEmailInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'school')}
              />
              <button 
                type="button" 
                className="add-btn" 
                onClick={() => addEmail('school')}
              >
                +
              </button>
            </div>
            <div className="example-text">Add email addresses from your child's school</div>
            <div className="email-list">
              {schoolEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <span className="email-text">{email}</span>
                  <button 
                    type="button" 
                    className="remove-btn" 
                    onClick={() => removeEmail('school', email)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ptoEmails">PTO/PTA Email Addresses</label>
            <div className="email-input-container">
              <input 
                type="email" 
                id="ptoEmails" 
                className="email-input" 
                placeholder="e.g., info@schoolpto.org"
                value={ptoEmailInput}
                onChange={(e) => setPtoEmailInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'pto')}
              />
              <button 
                type="button" 
                className="add-btn" 
                onClick={() => addEmail('pto')}
              >
                +
              </button>
            </div>
            <div className="example-text">Add email addresses from PTO, PTA, or parent organizations</div>
            <div className="email-list">
              {ptoEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <span className="email-text">{email}</span>
                  <button 
                    type="button" 
                    className="remove-btn" 
                    onClick={() => removeEmail('pto', email)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="forward-email-section">
            <h3>📬 Forwarding Destination</h3>
            <p>Emails from these addresses will be automatically forwarded to:</p>
            <div className="forward-email">calendar-processor@yourapp.com</div>
          </div>

          <button 
            type="submit" 
            className={`setup-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Setting up filters...' : '🚀 Create Filters & Enable Forwarding'}
          </button>

          {showSuccess && (
            <div className="success-message">
              ✅ Email filters and forwarding have been successfully configured! Calendar events will now be automatically created from your school and PTO emails.
            </div>
          )}
        </form>

        <div className="secondary-buttons">
            <button 
              type="button" 
              className="secondary-btn later-btn"
              onClick={() => {
                navigate('/calendar');
              }}
            >
              Later
            </button>
            <button 
              type="button" 
              className="secondary-btn manual-btn"
              onClick={() => setShowManualModal(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Setup Manually
            </button>
        </div>
      </div>
      
      <ManualSetupModal 
        isOpen={showManualModal} 
        onClose={() => setShowManualModal(false)} 
      />
    </div>
  );
};

export default EmailFilterSetup;
