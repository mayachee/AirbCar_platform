import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const useFormWithValidation = (schema, defaultValues = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  });

  const handleSubmit = useCallback(async (onSubmit) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      
      await form.handleSubmit(onSubmit)();
    } catch (error) {
      setSubmitError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [form]);

  const clearMessages = useCallback(() => {
    setSubmitError('');
    setSubmitSuccess('');
  }, []);

  const resetForm = useCallback(() => {
    form.reset();
    clearMessages();
  }, [form, clearMessages]);

  return {
    ...form,
    isSubmitting,
    submitError,
    submitSuccess,
    handleSubmit: (onSubmit) => handleSubmit(onSubmit),
    clearMessages,
    resetForm
  };
};

export const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const execute = useCallback(async (operation) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await operation();
      setSuccess('Operation completed successfully');
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return {
    loading,
    error,
    success,
    execute,
    clearMessages
  };
};
