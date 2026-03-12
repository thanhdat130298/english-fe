import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
type AuthMode = 'login' | 'register';
type AuthFormProps = {
  mode: AuthMode;
  onSuccess: () => void;
};
type FormData = {
  username: string;
  displayName?: string;
  password: string;
  confirmPassword: string;
};
type FormErrors = {
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};
export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleChange =
  (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'register' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'register') {
        await authApi.register(formData.username, formData.password);
      } else {
        await authApi.login(formData.username, formData.password);
      }
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.message || 'An error occurred';
      if (errorMessage.includes('already exists')) {
        setErrors({ general: 'Username already exists' });
      } else if (errorMessage.includes('invalid credentials')) {
        setErrors({ general: 'Invalid username or password' });
      } else if (errorMessage.includes('message')) {
        // Handle validation errors from API
        try {
          const errorData = JSON.parse(errorMessage);
          if (Array.isArray(errorData.message)) {
            setErrors({ general: errorData.message.join(', ') });
          } else {
            setErrors({ general: errorData.message || errorMessage });
          }
        } catch {
          setErrors({ general: errorMessage });
        }
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general &&
      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          {errors.general}
        </div>
      }

      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700">

          Username
        </label>
        <input
          id="username"
          type="text"
          value={formData.username}
          onChange={handleChange('username')}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] transition-all text-sm"
          placeholder="johndoe" />

        {errors.username &&
        <p className="text-xs text-red-500">{errors.username}</p>
        }
      </div>

      {mode === 'register' &&
      <div className="space-y-1.5">
          <label
          htmlFor="displayName"
          className="block text-sm font-medium text-gray-700">

            Display Name{' '}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
          id="displayName"
          type="text"
          value={formData.displayName}
          onChange={handleChange('displayName')}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] transition-all text-sm"
          placeholder="John Doe" />

        </div>
      }

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700">

          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange('password')}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] transition-all text-sm pr-10"
            placeholder="••••••••" />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">

            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password &&
        <p className="text-xs text-red-500">{errors.password}</p>
        }
      </div>

      {mode === 'register' &&
      <div className="space-y-1.5">
          <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700">

            Confirm Password
          </label>
          <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange('confirmPassword')}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15919B]/20 focus:border-[#15919B] transition-all text-sm"
          placeholder="••••••••" />

          {errors.confirmPassword &&
        <p className="text-xs text-red-500">{errors.confirmPassword}</p>
        }
        </div>
      }

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center py-2.5 px-4 bg-[#213A58] hover:bg-[#0C6478] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#213A58] disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2">

        {isLoading ?
        <Loader2 className="w-4 h-4 animate-spin" /> :
        mode === 'login' ?
        'Sign in' :

        'Create account'
        }
      </button>
    </form>);

}