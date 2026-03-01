'use client';

import { useState } from 'react';
import { usePasswordChange } from '../hooks/usePasswordChange';
import { Input } from '@/components/ui/input';
import { Lock, Key, Shuffle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ChangePasswordSection() {
  const { changePassword, loading, error, success } = usePasswordChange();
  const t = useTranslations('account');
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert(t('cp_passwords_no_match'));
      return;
    }

    if (formData.newPassword.length < 8) {
      alert(t('cp_password_min_length'));
      return;
    }

    const success = await changePassword(formData.oldPassword, formData.newPassword);
    
    if (success) {
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  };

  return (
    <div className="bg-orange-500/5 backdrop-blur-md rounded-2xl p-8 border border-orange-500/10 transition-shadow duration-300 hover:shadow-lg">
      <h3 className="text-lg font-bold text-white-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            {t('cp_change_password')}
      </h3>

      {success && (
        <div className="mb-6 p-4 bg-green-50/50 border border-green-200 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-green-600 text-lg">✓</span>
             </div>
             <div>
                <p className="font-semibold text-green-900">{t('cp_password_updated')}</p>
                <p className="text-sm text-green-700">{t('cp_password_changed_success')}</p>
             </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50/50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-600 text-lg">!</span>
             </div>
             <div>
                <p className="font-semibold text-red-900">{t('cp_error')}</p>
                <p className="text-sm text-red-700">{error}</p>
             </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('cp_current_password')} <span className="text-red-500">*</span>
          </label>
           <Input
            type="password"
            name="oldPassword"
            icon={Lock}
            value={formData.oldPassword}
            onChange={handleChange}
            required
            placeholder={t('cp_enter_current_password')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">
            {t('cp_new_password')} <span className="text-red-500">*</span>
          </label>
           <Input
            type="password"
            name="newPassword"
            icon={Key}
            value={formData.newPassword}
            onChange={handleChange}
            required
            minLength={8}
            placeholder={t('cp_enter_new_password')}
          />
        </div>

        <div className="space-y-2">
           <label className="text-sm font-semibold text-gray-700 block">
            {t('cp_confirm_new_password')} <span className="text-red-500">*</span>
          </label>
           <Input
            type="password"
            name="confirmPassword"
            icon={Key}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            placeholder={t('cp_confirm_placeholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
             <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('cp_changing_password')}
             </>
          ) : (
            <>
                 <Shuffle className="w-4 h-4" />
                {t('cp_change_password')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
