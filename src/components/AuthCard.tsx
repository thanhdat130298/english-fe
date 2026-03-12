import React, { useState } from 'react';
import { AuthForm } from './AuthForm';
type AuthMode = 'login' | 'register';
type AuthCardProps = {
  onLogin: () => void;
};
export function AuthCard({ onLogin }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-[#213A58] rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            English Learning App
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <AuthForm mode={mode} onSuccess={onLogin} />

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ?
            "Don't have an account? " :
            'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium text-gray-900 hover:underline focus:outline-none">

              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>);

}