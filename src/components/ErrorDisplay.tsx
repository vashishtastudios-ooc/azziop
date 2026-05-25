'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';

export function ErrorDisplay() {
  const error = usePipelineStore((state) => state.error);
  const reset = usePipelineStore((state) => state.reset);

  if (!error) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="card border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-red-500/10">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Pipeline Error</h3>
              <p className="text-surface-300 text-sm mb-4">{error}</p>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

