'use client';

import { motion } from 'framer-motion';
import { Check, Loader2, Circle, Database, Target, Palette, PenTool, Image, Sparkles } from 'lucide-react';
import { usePipelineStore, useCurrentStep } from '@/store/pipeline';
import { planById } from '~/lib/pricing';

const LAYERS = [
  { id: 1, name: 'Brand DNA', icon: Database, description: 'Extract brand attributes' },
  { id: 2, name: 'Strategy', icon: Target, description: 'Generate campaigns' },
  { id: 3, name: 'Creative', icon: Palette, description: 'Architect visuals' },
  { id: 4, name: 'Prompts', icon: PenTool, description: 'Build image prompts' },
  { id: 5, name: 'Images', icon: Image, description: 'Generate visuals' },
  { id: 6, name: 'Complete', icon: Sparkles, description: 'Ready to export' },
];

export function PipelineProgress() {
  const status = usePipelineStore((state) => state.status);
  const currentLayer = usePipelineStore((state) => state.currentLayer);
  const currentStep = useCurrentStep();
  const userPlan = usePipelineStore((state) => state.userPlan);
  const maxLayer = planById(userPlan).limits.aiLayers ?? 6;

  if (status === 'idle') return null;

  const getLayerStatus = (layerId: number) => {
    if (status === 'error') return layerId <= currentLayer ? 'error' : 'pending';
    if (status === 'complete') return 'complete';
    if (layerId < currentLayer) return 'complete';
    if (layerId === currentLayer) return 'active';
    return 'pending';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-8"
    >
      <div className="max-w-5xl mx-auto">
        <div className="card glow-accent">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="heading-3 text-white">Pipeline Progress</h2>
              <p className="text-surface-400 mt-1">{currentStep}</p>
            </div>
            {status === 'complete' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Complete</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <Circle className="w-4 h-4" />
                <span className="text-sm font-medium">Error</span>
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-surface-700">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ 
                  width: status === 'complete' 
                    ? '100%' 
                    : `${Math.max(0, ((currentLayer - 1) / (LAYERS.length - 1)) * 100)}%`
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {LAYERS.map((layer) => {
                const layerStatus = getLayerStatus(layer.id);
                const Icon = layer.icon;
                const isLocked = layer.id > maxLayer;

                return (
                  <div key={layer.id} className="flex flex-col items-center">
                    {/* Circle */}
                    <motion.div
                      className={`
                        relative w-12 h-12 rounded-full flex items-center justify-center z-10
                        transition-all duration-300
                        ${isLocked
                          ? 'bg-surface-800 text-surface-500 border border-surface-700'
                          : layerStatus === 'complete' 
                          ? 'bg-emerald-500 text-white' 
                          : layerStatus === 'active'
                          ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30'
                          : layerStatus === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-surface-700 text-surface-400'
                        }
                      `}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: layer.id * 0.1 }}
                    >
                      {isLocked ? (
                        <Icon className="w-5 h-5" />
                      ) : layerStatus === 'complete' ? (
                        <Check className="w-5 h-5" />
                      ) : layerStatus === 'active' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      
                      {/* Pulse ring for active */}
                      {layerStatus === 'active' && !isLocked && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-indigo-500"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </motion.div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-medium ${
                        isLocked
                          ? 'text-surface-500'
                          : layerStatus === 'complete' || layerStatus === 'active'
                          ? 'text-white'
                          : 'text-surface-500'
                      }`}>
                        {layer.name}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5 hidden sm:block">
                        {isLocked ? 'Upgrade to unlock' : layer.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

