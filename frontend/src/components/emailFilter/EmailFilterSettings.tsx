import React, { useState } from "react";
import { Mail, Settings, ArrowLeft, X } from "lucide-react";
import { redirect, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./EmailFilterSettings.css";

interface UserData {
  name: string;
  email: string;
  avatar?: string | null;
}

interface EmailFilterSettingsProps {
  userData?: UserData;
  onBack?: () => void;
}

const EmailFilterSettings: React.FC<EmailFilterSettingsProps> = ({
  userData,
  onBack,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use current logged-in user or fallback to provided userData
  const currentUser =
    user ||
    userData || {
      name: "User",
      email: "user@example.com",
      avatar: null,
    };
  const [schoolEmails, setSchoolEmails] = useState<string[]>([]);
  const [ptoEmails, setPtoEmails] = useState<string[]>([]);
  const [schoolEmailInput, setSchoolEmailInput] = useState("");
  const [ptoEmailInput, setPtoEmailInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 👇 Added for Manual Setup Modal
  const [showManualSetup, setShowManualSetup] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText("processor@gowizly.com");
    alert("Copied to clipboard!");
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = (type: "school" | "pto") => {
    const input = type === "school" ? schoolEmailInput : ptoEmailInput;
    const email = input.trim();

    if (!email) return;

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (type === "school") {
      if (schoolEmails.includes(email)) {
        alert("This email is already added");
        return;
      }
      setSchoolEmails([...schoolEmails, email]);
      setSchoolEmailInput("");
    } else {
      if (ptoEmails.includes(email)) {
        alert("This email is already added");
        return;
      }
      setPtoEmails([...ptoEmails, email]);
      setPtoEmailInput("");
    }
  };

  const removeEmail = (type: "school" | "pto", email: string) => {
    if (type === "school") {
      setSchoolEmails(schoolEmails.filter((e) => e !== email));
    } else {
      setPtoEmails(ptoEmails.filter((e) => e !== email));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: "school" | "pto") => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail(type);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (schoolEmails.length === 0 && ptoEmails.length === 0) {
      alert("Please add at least one email address");
      return;
    }
    setIsLoading(true);

    try {
      // Simulate API call to create Gmail filters
      await createGmailFilters({
        schoolEmails,
        ptoEmails,
        forwardTo: "processor@gowizly.com",
        userEmail: currentUser.email,
      });

      setShowSuccess(true);
      setTimeout(() => alert("Working"), 2000);
    } catch (error) {
      console.error("Setup failed:", error);
      alert("Setup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Gmail API integration
  const createGmailFilters = async (config: any) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Creating Gmail filters with config:", config);
    return { success: true };
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center justify-center space-x-4">
              <Mail className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Email Filter Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg">
          {/* User Info Section */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="user-avatar">
                {"avatar" in currentUser && currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="User Avatar" />
                ) : (
                  currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                )}
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {currentUser.name}
                </div>
                <div className="text-sm text-gray-600">{currentUser.email}</div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Emails Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School Email Addresses
                </label>
                <div className="email-input-container">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="e.g., noreply@schooldistrict.edu"
                    value={schoolEmailInput}
                    onChange={(e) => setSchoolEmailInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "school")}
                  />
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => addEmail("school")}
                  >
                    +
                  </button>
                </div>
                <div className="example-text">
                  Add email addresses from your child's school
                </div>
                <div className="email-list">
                  {schoolEmails.map((email, index) => (
                    <div key={index} className="email-item">
                      <span className="email-text">{email}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEmail("school", email)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* PTO Emails Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PTO/PTA Email Addresses
                </label>
                <div className="email-input-container">
                  <input
                    type="email"
                    className="email-input"
                    placeholder="e.g., info@schoolpto.org"
                    value={ptoEmailInput}
                    onChange={(e) => setPtoEmailInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, "pto")}
                  />
                  <button
                    type="button"
                    className="add-btn"
                    onClick={() => addEmail("pto")}
                  >
                    +
                  </button>
                </div>
                <div className="example-text">
                  Add email addresses from PTO, PTA, or parent organizations
                </div>
                <div className="email-list">
                  {ptoEmails.map((email, index) => (
                    <div key={index} className="email-item">
                      <span className="email-text">{email}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeEmail("pto", email)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forwarding Section */}
              <div className="forward-email-section">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  📬 Forwarding Destination
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Emails from these addresses will be automatically forwarded to:
                </p>
                <div className="forward-email">processor@gowizly.com</div>
              </div>

              {showSuccess && (
                <div className="success-message">
                  ✅ Email filters and forwarding have been successfully
                  configured! Calendar events will now be automatically created
                  from your school and PTO emails.
                </div>
              )}
            </form>

            {/* Secondary Buttons */}
            <div className="secondary-buttons">
              <button
                type="button"
                className="secondary-btn later-btn"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Calendar
              </button>
              <button
                type="button"
                className="secondary-btn manual-btn"
                onClick={() => setShowManualSetup(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Setup Manually
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 👇 Manual Setup Modal */}
      {showManualSetup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4 relative">
            <button
              onClick={() => setShowManualSetup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              🛠 Manual Email Forwarding Setup
            </h2>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
              <li>
                Open{" "}
                <a
                  href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Gmail Forwarding Settings
                </a>.
              </li>
              <li>Click <strong>“Add a forwarding address”</strong>.</li>
              <li>
                Enter this address:{" "}
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
                Gmail will send a verification email to{" "}
                <code>processor@gowizly.com</code>. Our system will auto-verify
                it.
              </li>
              <li>
                Once verified, go back to Forwarding Settings and select{" "}
                <strong>
                  “Forward a copy of incoming mail to
                  processor@gowizly.com”
                </strong>.
              </li>
              <li>Save changes — you’re done!</li>
            </ol>
            <p className="text-xs text-gray-500 mt-3">
              You can now close this panel and return to your dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailFilterSettings;
