/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, BellRing } from 'lucide-react';
import { NowcastAlert as AlertType } from '../../types';
import GlassCard from './GlassCard';

interface NowcastAlertProps {
  alert?: AlertType;
}

export const NowcastAlert: React.FC<NowcastAlertProps> = ({ alert }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!alert) return null;

  // Design config depending on IMD Alert Severity codes
  const severityConfig = {
    yellow: {
      border: 'border-yellow-500/30',
      bgGlow: 'rgba(234,179,8,0.06)',
      text: 'text-yellow-400',
      tagBg: 'bg-yellow-500/20 text-yellow-300',
      glowShadow: 'shadow-[0_0_20px_rgba(234,179,8,0.25)]',
      icon: <Info className="w-5 h-5 text-yellow-400" />
    },
    orange: {
      border: 'border-orange-500/35',
      bgGlow: 'rgba(249,115,22,0.08)',
      text: 'text-orange-400',
      tagBg: 'bg-orange-500/20 text-orange-300',
      glowShadow: 'shadow-[0_0_25px_rgba(249,115,22,0.30)]',
      icon: <AlertTriangle className="w-5 h-5 text-orange-400" />
    },
    red: {
      border: 'border-rose-500/40',
      bgGlow: 'rgba(244,63,94,0.1)',
      text: 'text-red-400',
      tagBg: 'bg-rose-500/25 text-rose-300 animate-pulse',
      glowShadow: 'shadow-[0_0_35px_rgba(244,63,94,0.40)]',
      icon: <AlertCircle className="w-5 h-5 text-red-400 animate-bounce" />
    },
    green: {
      border: 'border-emerald-500/20',
      bgGlow: 'transparent',
      text: 'text-emerald-400',
      tagBg: 'bg-emerald-500/10 text-emerald-300',
      glowShadow: 'shadow-none',
      icon: <BellRing className="w-5 h-5 text-emerald-400" />
    }
  };

  const style = severityConfig[alert.type] || severityConfig.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-2xl mx-auto my-5 z-20 relative px-1"
    >
      <GlassCard 
        className={`border ${style.border} ${style.glowShadow} overflow-hidden`}
        style={{ backgroundColor: style.bgGlow }}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            
            {/* Warning Details Heading */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {style.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full font-mono ${style.tagBg}`}>
                    nowcast alert
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Issued by IMD: {new Date(alert.issuedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className={`text-sm font-bold font-sans mt-1.5 ${style.text}`}>
                  {alert.title}
                </h4>
              </div>
            </div>

            {/* Expand / Close Icon Toggle */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer text-white/60 hover:text-white"
              aria-label="Toggle Warning Guidelines"
              id="alert-toggle-btn"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

          </div>

          <p className="text-white/80 text-xs mt-2 font-sans pl-8 leading-relaxed">
            {alert.message}
          </p>

          {/* Action Guidelines Dropdown */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden pl-8"
              >
                <div className="pt-4 mt-4 border-t border-white/5 text-xs text-white/60 space-y-2">
                  <p className="font-semibold text-white/80">Meteorological Safety Measures Suggested:</p>
                  <ul className="list-disc leading-loose list-inside pl-1 space-y-1 text-white/50 font-sans">
                    <li>Indoors are recommended; disconnect electrostatic devices.</li>
                    <li>Avoid steel railings, concrete boundaries, or isolated tall trees.</li>
                    <li>Stay alert to municipal waterlogging streams in subsequent hours.</li>
                    <li>Keep updated with continuous live IMD Doppler Radar.</li>
                  </ul>
                  <p className="text-[10px] text-indigo-300 font-mono italic pt-1">Station: {alert.station}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </GlassCard>
    </motion.div>
  );
};

export default NowcastAlert;
