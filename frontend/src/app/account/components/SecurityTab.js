'use client';

import { ChangePasswordSection } from '@/features/user';

export default function SecurityTab({ emailVerified, onRefreshVerification, onDeleteAccount }) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h3>
        <p className="text-gray-600">Manage your password and account security</p>
      </div>

      {/* Change Password Section */}
      <div className="mb-8">
        <ChangePasswordSection />
      </div>

      {/* Email Verification Status */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Email Verification</h4>
        <div className={`rounded-lg p-6 ${
          emailVerified ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${
                emailVerified ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {emailVerified ? 'Email Verified' : 'Email Not Verified'}
              </p>
              <p className={`text-sm mt-1 ${
                emailVerified ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {emailVerified 
                  ? 'Your email has been verified.'
                  : 'Please verify your email address to secure your account.'}
              </p>
            </div>
            {!emailVerified && (
              <button
                onClick={onRefreshVerification}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                Resend Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h4>
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700 mt-1">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            <button
              onClick={onDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

