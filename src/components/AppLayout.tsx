import React, { useState } from 'react';
import { Sidebar, Page } from './Sidebar';
import { Menu, MessageSquare, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { feedbackApi } from '../services/api';
import { RunawayButton } from './RunawayButton';

type AppLayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
};

export function AppLayout({
  children,
  currentPage,
  onNavigate,
  onLogout
}: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const feedbackMutation = useMutation({
    mutationFn: (message: string) => feedbackApi.create(message),
    onSuccess: () => {
      setFeedbackSuccess('Thanks! Feedback sent successfully.');
      setFeedbackError(null);
      setFeedbackMessage('');
      setIsFeedbackModalOpen(false);
    },
    onError: (err: unknown) => {
      setFeedbackSuccess(null);
      setFeedbackError(err instanceof Error ? err.message : 'Failed to send feedback');
    },
  });

  const openFeedbackModal = async () => {
    setIsFeedbackModalOpen(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const closeFeedbackModal = () => {
    if (feedbackMutation.isPending) return;
    setIsFeedbackModalOpen(false);
    setFeedbackError(null);
    setFeedbackSuccess(null);
  };

  const handleSubmitFeedback = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackError('Please enter your feedback message.');
      return;
    }
    feedbackMutation.mutate(message);
  };

  const openHelpModal = () => setIsHelpModalOpen(true);
  const closeHelpModal = () => setIsHelpModalOpen(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 bg-white rounded-lg shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Open menu">
        <Menu size={24} />
      </button>

      <button
        type="button"
        onClick={openHelpModal}
        className="fixed top-4 right-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0C6478] shadow-md hover:bg-gray-50 transition-colors"
        aria-label="About app and limitations"
      >
        ?
      </button>

      <button
        type="button"
        onClick={openFeedbackModal}
        className="fixed bottom-4 right-4 z-30 inline-flex items-center gap-2 rounded-lg bg-[#0C6478] px-3 py-2 text-sm font-medium text-white shadow-md hover:bg-[#213A58] transition-colors"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {isFeedbackModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close feedback modal"
            onClick={closeFeedbackModal}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Send Feedback</h3>
                <p className="text-sm text-gray-500">Max 5/day (UTC), 20 total per account.</p>
              </div>
              <button
                type="button"
                onClick={closeFeedbackModal}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#15919B]"
                  placeholder="Type your feedback..."
                  required
                />
              </div>

              {feedbackError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {feedbackError}
                </div>
              ) : null}
              {feedbackSuccess ? (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {feedbackSuccess}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={feedbackMutation.isPending}
                  className="inline-flex items-center rounded-lg bg-[#0C6478] px-4 py-2 text-sm font-medium text-white hover:bg-[#213A58] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {feedbackMutation.isPending ? 'Sending...' : 'Send feedback'}
                </button>
              </div>
            </form>

          </div>
        </div>
      ) : null}

      {isHelpModalOpen ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close help modal"
            onClick={closeHelpModal}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">About English App</h3>
                <p className="text-sm text-gray-500">Mục tiêu và giới hạn hiện tại của ứng dụng.</p>
              </div>
              <button
                type="button"
                onClick={closeHelpModal}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <section>
                <h4 className="text-sm font-semibold text-gray-900">Giới thiệu nhanh</h4>
                <p className="mt-2 text-sm text-gray-700">
                  Đây là app học tiếng Anh, chức năng chính hiện tại là dịch nhanh từ và hỗ trợ lưu từ vựng để ôn tập. App vẫn đang trong quá trình hoàn thiện, còn nhiều điểm chưa trơn tuột như
                  mong muốn. Rất mong mọi người liệu hồn thông cảm và góp ý kiến ý cò thêm để team cải thiện dần.
                </p>
              </section>

              <div className="flex justify-end gap-2 overflow-visible">
                <button
                  type="button"
                  onClick={closeHelpModal}
                  className="inline-flex items-center rounded-lg bg-[#0C6478] px-4 py-2 text-sm font-medium text-white hover:bg-[#213A58]"
                >
                  Đã hiểu
                </button>
                <RunawayButton
                  onClick={closeHelpModal}
                  className="rounded-lg bg-[#0C6478] px-4 py-2 text-sm font-medium text-white"
                >
                  Chưa hiểu
                </RunawayButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}