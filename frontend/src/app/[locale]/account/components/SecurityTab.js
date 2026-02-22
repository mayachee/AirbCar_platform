'use client';

import { useTranslations } from 'next-intl';
import { ChangePasswordSection } from '@/features/user';

export default function SecurityTab({ emailVerified, onRefreshVerification, onDeleteAccount }) {
  const t = useTranslations('account');
  return (
    <div className="p-8">
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white-900 mb-2">{t('security_tab_title')}</h3>
        <p className="text-gray-600">{t('security_tab_description')}</p>
      </div>

      {/* Change Password Section */}
      <div className="mb-8">
        <ChangePasswordSection />
      </div>

      {/* Email Verification Status */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">{t('security_email_verification')}</h4>
        <div className={`rounded-lg p-6 ${
          emailVerified ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${
                emailVerified ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {emailVerified ? t('security_email_verified') : t('security_email_not_verified')}
              </p>
              <p className={`text-sm mt-1 ${
                emailVerified ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {emailVerified 
                  ? t('security_email_verified_message')
                  : t('security_email_not_verified_message')}
              </p>
            </div>
            {!emailVerified && (
              <button
                onClick={onRefreshVerification}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                {t('security_resend_email')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">{t('security_account_actions')}</h4>
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">{t('security_delete_account')}</p>
              <p className="text-sm text-red-700 mt-1">
                {t('security_delete_account_confirm')}
              </p>
            </div>
            <button
              onClick={onDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              {t('security_delete_account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

