'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';

export function Navigation() {
  const currentPage = usePipelineStore((state) => state.currentPage);
  const setCurrentPage = usePipelineStore((state) => state.setCurrentPage);
  const websiteData = usePipelineStore((state) => state.websiteData);
  const selectedCampaign = usePipelineStore((state) => state.selectedCampaign);
  const editingCreativeIndex = usePipelineStore((state) => state.editingCreativeIndex);
  const creatives = usePipelineStore((state) => state.creatives);

  const getBackAction = () => {
    switch (currentPage) {
      case 'brand-dna':
        return { label: 'Home', action: () => setCurrentPage('home') };
      case 'campaigns':
        return { label: 'Brand DNA', action: () => setCurrentPage('brand-dna') };
      case 'creatives':
        return { label: 'Campaigns', action: () => setCurrentPage('campaigns') };
      case 'editor':
        return { label: 'Creatives', action: () => setCurrentPage('creatives') };
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'brand-dna':
        return websiteData?.title || 'Brand DNA';
      case 'campaigns':
        return 'Campaign Strategies';
      case 'creatives':
        return selectedCampaign?.title || 'Social Creatives';
      case 'editor':
        return editingCreativeIndex !== null && creatives[editingCreativeIndex]
          ? creatives[editingCreativeIndex].headline
          : 'Edit Creative';
      default:
        return 'NoPain Creative Director';
    }
  };

  const backAction = getBackAction();

  if (currentPage === 'home') return null;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-surface-border"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backAction && (
            <button
              onClick={backAction.action}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-800 transition-colors text-surface-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{backAction.label}</span>
            </button>
          )}
          <div className="h-6 w-px bg-surface-700" />
          <h1 className="font-display font-medium text-white truncate max-w-md">
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className="p-2 rounded-lg hover:bg-surface-800 transition-colors text-surface-400 hover:text-white"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">N</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}


