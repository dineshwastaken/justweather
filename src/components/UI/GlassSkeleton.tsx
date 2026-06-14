/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import GlassCard from './GlassCard';

/**
 * GlassSkeleton Components matching Liquid Glass layout proportions.
 * Implements smooth pulsate animations and frosted blur filters.
 */
export const GlassSkeleton: React.FC = () => {
  return (
    <div className="w-full flex flex-col justify-center items-center py-2 z-10 space-y-6">
      
      {/* 1. Location Selector Skeleton */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center space-y-4 pointer-events-none px-4">
        {/* Mock Search Bar */}
        <div className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-white/15" />
            <div className="w-36 h-3.5 bg-white/10 rounded-md" />
          </div>
          <div className="w-4 h-4 rounded-full bg-white/15" />
        </div>
        {/* Mock Saved Bookmarks Grid */}
        <div className="flex gap-3 justify-center w-full overflow-hidden max-w-md">
          <div className="w-28 h-9 rounded-xl bg-white/[0.04] border border-white/8 animate-pulse flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-white/15" />
            <div className="w-12 h-3 bg-white/10 rounded" />
          </div>
          <div className="w-28 h-9 rounded-xl bg-white/[0.04] border border-white/8 animate-pulse flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-white/15" />
            <div className="w-12 h-3 bg-white/10 rounded" />
          </div>
        </div>
      </div>

      {/* 2. Notice Warning/Alert Skeleton */}
      <div className="w-full max-w-md mx-auto h-11 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center px-4">
        <div className="w-32 h-3 bg-white/10 rounded" />
      </div>

      {/* 3. Current Weather Glass Panel Skeleton */}
      <GlassCard className="p-8 w-full md:max-w-2xl mx-auto flex flex-col justify-between h-96 animate-pulse">
        {/* Top Header Section */}
        <div className="flex justify-between items-start w-full">
          <div className="space-y-4">
            <div className="w-28 h-3.5 bg-white/[0.08] rounded" />
            <div className="w-44 h-9 bg-white/[0.12] rounded" />
            <div className="w-20 h-4 bg-white/[0.08] rounded" />
          </div>
          <div className="w-20 h-20 bg-white/[0.08] rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white/[0.08] rounded-full" />
          </div>
        </div>

        {/* Middle Stats Grid Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 border-t border-b border-white/5 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-12 h-3 bg-white/[0.06] rounded" />
              <div className="w-16 h-4 bg-white/[0.1] rounded" />
            </div>
          ))}
        </div>

        {/* Bottom TimeSlider Section */}
        <div className="w-full space-y-2">
          <div className="flex justify-between w-full">
            <div className="w-12 h-3 bg-white/[0.06] rounded" />
            <div className="w-12 h-3 bg-white/[0.06] rounded" />
          </div>
          <div className="w-full h-2.5 bg-white/[0.06] rounded-full" />
        </div>
      </GlassCard>

      {/* 4. Timeline 7-Day Forecast Skeleton */}
      <div className="w-full max-w-4xl mx-auto mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-48 h-4 bg-white/[0.08] rounded" />
          <div className="w-20 h-3 bg-white/[0.06] rounded" />
        </div>

        <div className="overflow-x-auto w-full no-scrollbar pb-3">
          <div className="flex gap-4 min-w-max">
            {Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="w-36 p-4 flex flex-col items-center text-center justify-between h-56 animate-pulse">
                <div className="space-y-2 w-full flex flex-col items-center">
                  <div className="w-14 h-4 bg-white/[0.1] rounded" />
                  <div className="w-10 h-3 bg-white/[0.06] rounded" />
                </div>
                <div className="w-10 h-10 bg-white/[0.08] rounded-full" />
                <div className="w-full space-y-2">
                  <div className="flex justify-between px-1">
                    <div className="w-6 h-3.5 bg-white/[0.06] rounded" />
                    <div className="w-6 h-3.5 bg-white/[0.1] rounded" />
                  </div>
                  <div className="w-full h-1 bg-white/[0.06] rounded-full" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default GlassSkeleton;
