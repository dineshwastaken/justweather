/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Check, Loader2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { submitFeedback } from '../../api/feedbackService';

/**
 * Frictionless Liquid Glass Micro-Feedback Widget.
 * Positioned fixed at the bottom-right of the viewport.
 * Dynamically reacts to touch and hover events, providing an elegant serverless feedback channel.
 */
export const FeedbackWidget: React.FC = () => {
  const { currentLocation } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [reaction, setReaction] = useState<'up' | 'down' | null>(null);
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Saturated organic noise overlay url
  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E")`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reaction) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await submitFeedback({
        reaction,
        text: comments.trim() || undefined,
        locationContext: `${currentLocation.name}, ${currentLocation.state}`
      });

      if (response.success) {
        setStatus('success');
        // Reset states and close automatic collapsed sheet after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          // Allow exit animation to finish before clearing input parameters
          setTimeout(() => {
            setReaction(null);
            setComments('');
            setStatus('idle');
          }, 400);
        }, 2200);
      } else {
        setStatus('error');
        setErrorMessage(response.message);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Submission error occurred.');
    }
  };

  const toggleOpen = () => {
    if (status !== 'submitting') {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto select-none">
      <AnimatePresence initial={false} mode="wait">
        {!isOpen ? (
          // 1. COMPACT BUTTON STATE
          <motion.button
            key="collapsed-button"
            layoutId="feedback-container"
            onClick={toggleOpen}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.08] text-white shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-300 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            id="feedback-trigger-btn"
          >
            <MessageSquare className="h-5 w-5 text-sky-200" />
          </motion.button>
        ) : (
          // 2. EXPANDED FEEDBACK SHEET (LIQUID GLASS STYLED)
          <motion.div
            key="expanded-widget"
            layoutId="feedback-container"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-80 overflow-hidden rounded-3xl border border-white/15 bg-slate-900/80 p-5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            id="feedback-expanded-panel"
          >
            {/* Ambient Noise overlay */}
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
              style={{ backgroundImage: noiseBg }}
            />

            {/* Header Title Controls */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
              <span className="text-sm font-semibold tracking-wide text-sky-100 uppercase">
                Submit Feedback
              </span>
              <button
                onClick={toggleOpen}
                disabled={status === 'submitting'}
                className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                // 3. SUCCESS / BRIEF THANKS LAYOUT
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-6 text-center"
                  key="submit-thanks-state"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-3"
                  >
                    <Check className="h-6 w-6" />
                  </motion.div>
                  <p className="font-medium text-emerald-200">Thank You!</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Your feedback assists in architectural refinement.
                  </p>
                </motion.div>
              ) : (
                // 4. MAIN FORM INPUT LAYOUT
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                  key="feedback-main-form"
                >
                  {/* Reaction selector toggles */}
                  <div>
                    <span className="block text-xs text-slate-300 font-medium mb-2">
                      How is the weather rendering?
                    </span>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => setReaction('up')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 border transition-all duration-300 ${
                          reaction === 'up'
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-md shadow-sky-500/10'
                            : 'bg-white/5 border-white/8 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Up</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaction('down')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-3 border transition-all duration-300 ${
                          reaction === 'down'
                            ? 'bg-rose-500/20 border-rose-400/50 text-rose-300 shadow-md shadow-rose-500/10'
                            : 'bg-white/5 border-white/8 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span className="text-xs font-medium">Down</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional message input box */}
                  <div>
                    <label
                      htmlFor="feedback-comment-input"
                      className="block text-xs text-slate-300 font-medium mb-1.5"
                    >
                      Quick Thoughts (Optional)
                    </label>
                    <input
                      id="feedback-comment-input"
                      type="text"
                      maxLength={140}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="e.g., God rays are stunning!"
                      disabled={status === 'submitting'}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-400 transition-colors duration-200 hover:border-white/18 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
                    />
                  </div>

                  {/* Contextual indicators */}
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Context: {currentLocation.name} · India IMD Gateway
                  </p>

                  {/* Error Notification Banner */}
                  {status === 'error' && (
                    <div className="rounded-lg bg-rose-500/15 border border-rose-500/25 p-2 text-[11px] text-rose-300">
                      {errorMessage || 'Submitting failed. Please try again.'}
                    </div>
                  )}

                  {/* Submission and delivery triggering buttons */}
                  <button
                    type="submit"
                    disabled={!reaction || status === 'submitting'}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                      !reaction
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Layout</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackWidget;
