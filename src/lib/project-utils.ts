/**
 * Utility functions for project operations
 * Replaces Zustand store with direct database calls
 */

import type { WebsiteData, BrandDNA, CampaignStrategy } from '@/types';

export async function fetchProject() {
  const response = await fetch('/api/project');
  const result = await response.json();
  return result.success ? result.data : null;
}

export async function updateBrandDNA(updates: Partial<BrandDNA>) {
  const response = await fetch('/api/brand-dna', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const result = await response.json();
  return result.success ? result.data : null;
}

export async function generateCampaigns(projectId: string, brandDNA: BrandDNA, websiteData: WebsiteData, userPrompt?: string) {
  const businessOverview = [
    websiteData.brandName ? `Brand: ${websiteData.brandName}` : '',
    websiteData.tagline ? `Tagline: ${websiteData.tagline}` : '',
    websiteData.description ? `About: ${websiteData.description}` : '',
    websiteData.heroText ? `Hero: ${websiteData.heroText}` : '',
    websiteData.aboutSection ? `Details: ${websiteData.aboutSection}` : '',
    websiteData.textContent?.slice(0, 800) || '',
  ].filter(Boolean).join('\n');

  const response = await fetch('/api/layer2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      brandDNA,
      businessOverview,
      userPrompt,
    }),
  });
  const result = await response.json();
  return result.success ? result.data : null;
}

