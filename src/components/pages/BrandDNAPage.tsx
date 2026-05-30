'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import {
  Globe,
  Palette,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Edit3,
  Check,
  X,
  Plus,
  Upload,
  Trash2,
  Heart,
  Eye,
  FileText,
  ImageIcon,
  Building2,
  Crown,
  Type,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { usePipelineStore } from '../../store/pipeline';
import { api } from '~/trpc/react';

// ─── Editable Tag ───
function EditableTag({
  value,
  onUpdate,
  onRemove,
  colorClass = 'bg-[#FAD400]/15 border-[#FAD400]/30 text-neutral-800'
}: {
  value: string;
  onUpdate: (newValue: string) => void;
  onRemove: () => void;
  colorClass?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim()) onUpdate(editValue.trim());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-neutral-900 w-36 focus:outline-none focus:border-[#FAD400]"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <button onClick={handleSave} className="p-1.5 hover:bg-neutral-200 rounded-lg">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-neutral-200 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <span className={`group/tag relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-default ${colorClass}`}>
      {value}
      <button
        onClick={() => setIsEditing(true)}
        className="ml-0.5 p-0.5 rounded hover:bg-neutral-100 opacity-40 group-hover/tag:opacity-100 transition-opacity"
        title="Edit"
      >
        <Edit3 className="w-3 h-3" />
      </button>
      <button
        onClick={onRemove}
        className="p-0.5 rounded hover:bg-red-500/20 opacity-40 group-hover/tag:opacity-100 transition-opacity"
        title="Remove"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Editable Text Field ───
function EditableField({
  label,
  icon,
  value,
  onUpdate,
  multiline = false,
  placeholder = 'Click to edit...'
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onUpdate: (newValue: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onUpdate(editValue);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-display font-semibold text-[#FAD400] flex items-center gap-2">
          {icon}
          {label}
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-600 hover:text-[#FAD400] hover:bg-[#FAD400]/15 border border-transparent hover:border-[#FAD400]/30 transition-all"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-900 text-sm leading-relaxed resize-none focus:outline-none focus:border-[#FAD400] focus:ring-1 focus:ring-[#FAD400]/30"
              rows={5}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-[#FAD400] focus:ring-1 focus:ring-[#FAD400]/30"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-1.5 bg-[#FAD400] hover:brightness-95 text-neutral-900 font-display font-semibold text-sm rounded-lg transition-colors">
              Save
            </button>
            <button onClick={() => { setEditValue(value); setIsEditing(false); }} className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-sm rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-neutral-700 text-sm leading-relaxed cursor-pointer p-3 -m-1 rounded-xl border border-transparent hover:border-neutral-200 hover:bg-neutral-50 transition-all"
          onClick={() => setIsEditing(true)}
        >
          {value ? (
            <p className="whitespace-pre-line">{value}</p>
          ) : (
            <span className="text-neutral-500 italic">{placeholder}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Tag Input ───
function AddTagInput({
  field,
  placeholder,
  colorClass,
  isActive,
  onActivate,
  newValue,
  setNewValue,
  onAdd,
  onCancel,
}: {
  field: string;
  placeholder: string;
  colorClass: string;
  isActive: boolean;
  onActivate: () => void;
  newValue: string;
  setNewValue: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}) {
  if (isActive) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-neutral-900 w-32 focus:outline-none focus:border-[#FAD400]"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={placeholder}
        />
        <button onClick={onAdd} className="p-1.5 hover:bg-neutral-200 rounded-lg">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        </button>
        <button onClick={onCancel} className="p-1.5 hover:bg-neutral-200 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onActivate}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-dashed text-sm transition-colors ${colorClass}`}
    >
      <Plus className="w-3.5 h-3.5" />
      Add
    </button>
  );
}

// ─── Color Role Label ───
function getColorRole(index: number): string {
  if (index === 0) return 'Primary';
  if (index === 1) return 'Secondary';
  return 'Accent';
}

// ─── Main Component ───
export function BrandDNAPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const websiteData = usePipelineStore((state: any) => state.websiteData);
  const brandDNA = usePipelineStore((state: any) => state.brandDNA);
  const websiteColors = usePipelineStore((state: any) => state.websiteColors);
  const websiteFonts = usePipelineStore((state: any) => state.websiteFonts);
  const websiteLogo = usePipelineStore((state: any) => state.websiteLogo);
  const tagline = usePipelineStore((state: any) => state.tagline);
  const aboutSection = usePipelineStore((state: any) => state.aboutSection);
  const heroText = usePipelineStore((state: any) => state.heroText);
  const projectId = usePipelineStore((state: any) => state.projectId);
  const setCurrentPage = usePipelineStore((state: any) => state.setCurrentPage);
  const updateBrandDNA = usePipelineStore((state: any) => state.updateBrandDNA);
  const updateWebsiteExtras = usePipelineStore((state: any) => state.updateWebsiteExtras);
  const setWebsiteData = usePipelineStore((state: any) => state.setWebsiteData);
  const runPipeline = usePipelineStore((state: any) => state.runPipeline);
  const trpcUtils = api.useUtils();

  const [newValue, setNewValue] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [showAddColorPicker, setShowAddColorPicker] = useState(false);
  const [pendingColor, setPendingColor] = useState('#6366f1');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [userUploadedImages, setUserUploadedImages] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) setUserUploadedImages((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) updateWebsiteExtras('websiteLogo', dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    if (!websiteData) return;
    const websiteImagesCount = (websiteData.images || []).length;
    if (index < websiteImagesCount) {
      const newImages = (websiteData.images || []).filter((_: string, i: number) => i !== index);
      setWebsiteData({ ...websiteData, images: newImages });
    } else {
      const uploadedIdx = index - websiteImagesCount;
      setUserUploadedImages((prev) => prev.filter((_, i) => i !== uploadedIdx));
    }
  };

  const allImages = [...(websiteData?.images || []), ...userUploadedImages];

  if (!brandDNA || !websiteData) return null;

  const colors: string[] = (
    (websiteColors as string[] | undefined)?.length
      ? (websiteColors as string[])
      : (websiteData?.colors as string[] | undefined)?.length
        ? (websiteData.colors as string[])
        : []
  );
  const fonts = websiteFonts.length > 0 ? websiteFonts : ['Sans-serif', 'Serif'];
  const brandValues = (brandDNA.brandValues || []) as string[];
  const brandToneOfVoice = (brandDNA.brandToneOfVoice || []) as string[];
  const brandAestheticItems = (brandDNA.brandAesthetic?.split(/[,.]/).filter(Boolean).map((s: string) => s.trim()) || []) as string[];

  // Combined brand overview from multiple sources
  const buildBrandOverview = (): string => {
    if (aboutSection) return aboutSection;
    const parts: string[] = [];
    if (websiteData.aboutSection) parts.push(websiteData.aboutSection);
    if (websiteData.heroText && websiteData.heroText !== tagline) parts.push(websiteData.heroText);
    if (websiteData.description && !parts.some((p: string) => p.includes(websiteData.description))) parts.push(websiteData.description);
    return parts.filter(Boolean).join('\n\n') || '';
  };

  const updateArrayField = (field: keyof typeof brandDNA, index: number, newVal: string) => {
    const currentArray = (brandDNA[field] as string[]) || [];
    const newArray = [...currentArray];
    newArray[index] = newVal;
    updateBrandDNA({ [field]: newArray });
  };

  const removeFromArrayField = (field: keyof typeof brandDNA, index: number) => {
    const currentArray = (brandDNA[field] as string[]) || [];
    updateBrandDNA({ [field]: currentArray.filter((_, i) => i !== index) });
  };

  const addToArrayField = (field: keyof typeof brandDNA) => {
    if (!newValue.trim()) return;
    const currentArray = (brandDNA[field] as string[]) || [];
    updateBrandDNA({ [field]: [...currentArray, newValue.trim()] });
    setNewValue('');
    setAddingTo(null);
  };

  const updateAestheticItem = (index: number, newVal: string) => {
    const items = [...brandAestheticItems];
    items[index] = newVal;
    updateBrandDNA({ brandAesthetic: items.join(', ') });
  };

  const removeAestheticItem = (index: number) => {
    const items = brandAestheticItems.filter((_: string, i: number) => i !== index);
    updateBrandDNA({ brandAesthetic: items.join(', ') });
  };

  const addAestheticItem = () => {
    if (!newValue.trim()) return;
    const items = [...brandAestheticItems, newValue.trim()];
    updateBrandDNA({ brandAesthetic: items.join(', ') });
    setNewValue('');
    setAddingTo(null);
  };

  const handleConfirmResetBrandDNA = async () => {
    const url = websiteData?.url;
    if (!url || isResetting) return;
    setShowResetModal(false);
    setResetFeedback(null);
    setIsResetting(true);
    try {
      await runPipeline(url, { preserveBrandPage: true });
      await trpcUtils.project.invalidate();
      const pid =
        usePipelineStore.getState().projectId ?? searchParams.get('projectId') ?? undefined;
      if (pid) {
        await trpcUtils.project.getDetails.refetch({ projectId: pid });
      }
      setResetFeedback({
        type: 'success',
        text: 'Re-analysis complete. Brand DNA was refreshed from your website (replaced with a new scan, not removed). Campaigns and creatives were cleared. The project still appears under Existing Projects so you can continue with a clean slate.',
      });
    } catch (error) {
      console.error('Reset Brand DNA failed:', error);
      setResetFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not re-run analysis. Try again.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleContinueToCampaigns = () => {
    setCurrentPage('campaigns');
    const targetProjectId = searchParams.get('projectId') ?? projectId;
    router.push(targetProjectId ? `/campaigns?projectId=${targetProjectId}` : '/campaigns');
  };

  const industry = brandDNA.industry || '';
  const positioning = brandDNA.positioning || '';

  return (
    <div className="min-h-screen pt-8 pb-28 px-4 lg:px-8">
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            key="reset-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-dna-title"
            onClick={() => !isResetting && setShowResetModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="reset-dna-title" className="text-lg font-display font-semibold text-[#FAD400] mb-2">
                Re-run website analysis?
              </h2>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                We will scrape your site again and replace Brand DNA with fresh AI output. All campaigns and creatives for this project will be permanently removed. Your project will stay in Existing Projects.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-100 border border-neutral-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => void handleConfirmResetBrandDNA()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  Re-run analysis
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {isResetting && (
          <div className="mb-6 rounded-xl border border-[#FAD400]/40 bg-[#FAD400]/15 px-4 py-3 text-sm text-neutral-800 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Re-analyzing your website and refreshing Brand DNA. This may take up to a minute…
          </div>
        )}
        {resetFeedback && (
          <div
            className={[
              'mb-6 rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-4',
              resetFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800',
            ].join(' ')}
          >
            <p className="leading-relaxed">{resetFeedback.text}</p>
            <button
              type="button"
              onClick={() => setResetFeedback(null)}
              className="shrink-0 p-1 rounded-lg hover:bg-neutral-100 text-current opacity-80 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAD400]/20 to-amber-100 border border-[#FAD400]/25 mb-4">
            <Sparkles className="w-7 h-7 text-[#FAD400]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-[#FAD400] mb-2">Your Brand DNA</h1>
          <p className="text-neutral-600 max-w-lg mx-auto">
            A snapshot of your brand identity. We use this to generate on-brand campaigns.
            <span className="text-[#FAD400] ml-1">Click any section to edit.</span>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left Column ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* ── Business Card ── */}
            <div className="card p-8">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="group relative w-28 h-28 rounded-2xl bg-neutral-100 border-2 border-neutral-200 hover:border-[#FAD400]/50 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors"
                >
                  {websiteLogo ? (
                    <img src={websiteLogo} alt="Logo" className="w-full h-full object-contain p-3" />
                  ) : (
                    <span className="text-4xl font-bold text-[#FAD400]">
                      {websiteData.title?.charAt(0) || 'B'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                    <Upload className="w-5 h-5 text-white" />
                    <span className="text-[10px] text-white/80 font-medium">Change Logo</span>
                  </div>
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-display font-bold text-neutral-900 mb-1 truncate">
                    {websiteData.brandName || websiteData.title || 'Your Brand'}
                  </h2>
                  <div className="flex items-center gap-2 text-neutral-600 mb-4">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <a href={websiteData.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#FAD400] transition-colors text-sm truncate">
                      {websiteData.url}
                    </a>
                  </div>

                  {/* Industry & Positioning Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {industry && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-medium">
                        <Building2 className="w-3 h-3" />
                        {industry.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </span>
                    )}
                    {positioning && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        {positioning.charAt(0).toUpperCase() + positioning.slice(1)} Positioning
                      </span>
                    )}
                  </div>

                  {/* Fonts */}
                  <div className="flex items-center gap-3">
                    <Type className="w-4 h-4 text-neutral-500" />
                    <div className="flex gap-4">
                      {fonts.map((font: string, idx: number) => (
                        <div key={idx} className="text-center">
                          <span className="text-lg text-white" style={{ fontFamily: font }}>Aa</span>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{font}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Brand Colors ── */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-display font-semibold text-[#FAD400] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-400" />
                  Brand Colors
                </h3>
                <span className="text-xs text-neutral-500">{colors.length} color{colors.length !== 1 ? 's' : ''}</span>
              </div>

              {colors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3">
                    <Palette className="w-5 h-5 text-neutral-500" />
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">No brand colors detected</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setPendingColor('#6366f1'); setShowAddColorPicker(true); }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAD400] hover:brightness-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#FAD400]/25 hover:shadow-[#FAD400]/40"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Color
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-5 flex-wrap items-start">
                  {colors.map((color: string, idx: number) => (
                    <div key={idx} className="group/color text-center">
                      <div className="relative">
                        <div
                          className="w-20 h-20 rounded-2xl border-2 border-neutral-200 cursor-pointer hover:ring-2 hover:ring-[#FAD400]/40 hover:scale-105 transition-all shadow-lg"
                          style={{ backgroundColor: color }}
                          title="Click to change color"
                        />
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...colors];
                            newColors[idx] = e.target.value;
                            updateWebsiteExtras('websiteColors', newColors);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateWebsiteExtras('websiteColors', colors.filter((_: string, i: number) => i !== idx));
                          }}
                          className="absolute -top-2 -right-2 z-10 p-1 bg-neutral-100 hover:bg-red-600 border border-neutral-300 hover:border-red-500 rounded-full opacity-0 group-hover/color:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3 text-neutral-700 hover:text-white" />
                        </button>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono mt-2 block">{color}</span>
                      <span className="text-[10px] text-neutral-500 block">{getColorRole(idx)}</span>
                    </div>
                  ))}
                  {/* Add color */}
                  <div className="text-center">
                    <div className="relative w-20 h-20">
                      <button
                        type="button"
                        onClick={() => { setPendingColor('#6366f1'); setShowAddColorPicker(true); }}
                        className="w-20 h-20 rounded-3xl border border-neutral-300/80 bg-neutral-100/70 hover:bg-neutral-100 hover:border-[#FAD400]/50 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:shadow-[#FAD400]/20"
                        aria-label="Add a color"
                      >
                        <div className="w-10 h-10 rounded-2xl border border-dashed border-[#FAD400]/40 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-neutral-800" />
                        </div>
                      </button>
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-2 block font-medium">Add Color</span>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showAddColorPicker && (
                  <>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAddColorPicker(false)}
                      className="fixed inset-0 z-50 bg-black/55"
                      aria-label="Close color picker backdrop"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                      className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-md border border-white/10 shrink-0"
                            style={{ backgroundColor: pendingColor }}
                          />
                          <p className="text-sm font-semibold text-white truncate">Pick a color</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddColorPicker(false)}
                          className="p-2 rounded-xl text-neutral-700 hover:text-white hover:bg-neutral-100/70 transition-colors"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-3">
                          <HexColorPicker color={pendingColor} onChange={setPendingColor} />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[11px] text-neutral-500 mb-1.5">Hex</label>
                            <input
                              value={pendingColor}
                              onChange={(e) => setPendingColor(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200/70 text-neutral-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FAD400]/40"
                              placeholder="#6366f1"
                            />
                          </div>
                          <div className="w-14">
                            <label className="block text-[11px] text-neutral-500 mb-1.5">&nbsp;</label>
                            <div className="w-14 h-10 rounded-xl border border-neutral-200/70" style={{ backgroundColor: pendingColor }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddColorPicker(false)}
                            className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateWebsiteExtras('websiteColors', colors.length ? [...colors, pendingColor] : [pendingColor]);
                              setShowAddColorPicker(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-[#FAD400] hover:brightness-95 text-white text-sm font-semibold transition-all shadow-lg shadow-[#FAD400]/20"
                          >
                            Add Color
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* ── Tagline ── */}
            <div className="card p-6">
              <EditableField
                label="Tagline"
                icon={<Sparkles className="w-5 h-5 text-yellow-400" />}
                value={tagline || ''}
                onUpdate={(val) => updateWebsiteExtras('tagline', val)}
                placeholder="Add your brand tagline..."
              />
              {tagline && (
                <p className="text-xl text-neutral-800/80 italic font-display mt-3 pl-3 border-l-2 border-[#FAD400]/50">
                  &ldquo;{tagline}&rdquo;
                </p>
              )}
            </div>

            {/* ── Brand Values & Aesthetic ── */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brand Values */}
              <div className="card p-6">
                <h3 className="text-lg font-display font-semibold text-[#FAD400] mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-400" />
                  Brand Values
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brandValues.map((value: string, idx: number) => (
                    <EditableTag
                      key={idx}
                      value={value}
                      onUpdate={(newVal) => updateArrayField('brandValues', idx, newVal)}
                      onRemove={() => removeFromArrayField('brandValues', idx)}
                      colorClass="bg-[#FAD400]/15 border-[#FAD400]/30 text-neutral-800"
                    />
                  ))}
                  <AddTagInput
                    field="brandValues"
                    placeholder="Add value..."
                    colorClass="border-neutral-300 hover:border-[#FAD400] text-neutral-500 hover:text-[#FAD400]"
                    isActive={addingTo === 'brandValues'}
                    onActivate={() => setAddingTo('brandValues')}
                    newValue={newValue}
                    setNewValue={setNewValue}
                    onAdd={() => addToArrayField('brandValues')}
                    onCancel={() => { setAddingTo(null); setNewValue(''); }}
                  />
                </div>
              </div>

              {/* Brand Aesthetic */}
              <div className="card p-6">
                <h3 className="text-lg font-display font-semibold text-[#FAD400] mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Brand Aesthetic
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brandAestheticItems.map((item: string, idx: number) => (
                    <EditableTag
                      key={idx}
                      value={item}
                      onUpdate={(newVal) => updateAestheticItem(idx, newVal)}
                      onRemove={() => removeAestheticItem(idx)}
                      colorClass="bg-violet-50 border-violet-200 text-violet-800"
                    />
                  ))}
                  <AddTagInput
                    field="brandAesthetic"
                    placeholder="Add style..."
                    colorClass="border-neutral-300 hover:border-violet-300 text-neutral-500 hover:text-violet-700"
                    isActive={addingTo === 'brandAesthetic'}
                    onActivate={() => setAddingTo('brandAesthetic')}
                    newValue={newValue}
                    setNewValue={setNewValue}
                    onAdd={addAestheticItem}
                    onCancel={() => { setAddingTo(null); setNewValue(''); }}
                  />
                </div>
              </div>
            </div>

            {/* ── Tone of Voice ── */}
            <div className="card p-6">
              <h3 className="text-lg font-display font-semibold text-[#FAD400] mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Brand Tone of Voice
              </h3>
              <div className="flex flex-wrap gap-2">
                {brandToneOfVoice.map((tone: string, idx: number) => (
                  <EditableTag
                    key={idx}
                    value={tone}
                    onUpdate={(newVal) => updateArrayField('brandToneOfVoice', idx, newVal)}
                    onRemove={() => removeFromArrayField('brandToneOfVoice', idx)}
                    colorClass="bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                  />
                ))}
                <AddTagInput
                  field="brandToneOfVoice"
                  placeholder="Add tone..."
                  colorClass="border-neutral-300 hover:border-cyan-500 text-neutral-500 hover:text-cyan-400"
                  isActive={addingTo === 'brandToneOfVoice'}
                  onActivate={() => setAddingTo('brandToneOfVoice')}
                  newValue={newValue}
                  setNewValue={setNewValue}
                  onAdd={() => addToArrayField('brandToneOfVoice')}
                  onCancel={() => { setAddingTo(null); setNewValue(''); }}
                />
              </div>
            </div>

            {/* ── Business Overview ── */}
            <div className="card p-6">
              <EditableField
                label="Brand Overview"
                icon={<FileText className="w-5 h-5 text-emerald-400" />}
                value={buildBrandOverview()}
                onUpdate={(val) => updateWebsiteExtras('aboutSection', val)}
                multiline
                placeholder="Add a description of your business..."
              />
            </div>
          </motion.div>

          {/* ── Right Column - Brand Assets ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-display font-semibold text-[#FAD400] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-neutral-600" />
                Brand Assets
                {allImages.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-neutral-100 text-[10px] text-neutral-600 font-medium">
                    {allImages.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAD400] hover:brightness-95 text-neutral-900 font-display font-semibold text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Hero / First image displayed larger */}
            {allImages.length > 0 && (
              <div className="group/img relative aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 hover:border-[#FAD400]/50 transition-colors">
                <img
                  src={allImages[0]}
                  alt="Primary brand image"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {websiteLogo && allImages[0] === websiteLogo && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] text-white/80 font-medium backdrop-blur-sm">
                    Logo
                  </span>
                )}
                <button
                  onClick={() => handleRemoveImage(0)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 opacity-0 group-hover/img:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}

            {/* Remaining images in grid */}
            <div className="grid grid-cols-2 gap-3">
              {allImages.slice(1, 20).map((img, rawIdx) => {
                const idx = rawIdx + 1;
                return (
                  <div
                    key={idx}
                    className="group/img relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 hover:border-[#FAD400]/50 transition-colors"
                  >
                    <img
                      src={img}
                      alt={`Brand image ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 opacity-0 group-hover/img:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                );
              })}
              {/* Upload tile */}
              <button
                onClick={() => imageInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-indigo-500 flex flex-col items-center justify-center gap-1.5 transition-colors group/upload"
              >
                <Upload className="w-5 h-5 text-neutral-500 group-hover/upload:text-[#FAD400] transition-colors" />
                <span className="text-[10px] text-neutral-500 group-hover/upload:text-[#FAD400] transition-colors">Add Image</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── Bottom Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-neutral-200 z-50"
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              disabled={isResetting || !websiteData?.url}
              className={[
                'group relative px-5 py-2.5 rounded-xl text-sm font-semibold',
                'inline-flex items-center gap-2',
                'border border-red-500/25 bg-gradient-to-r from-red-500/10 via-rose-500/10 to-orange-500/10',
                'text-red-200/90 hover:text-white',
                'shadow-lg shadow-black/20 hover:shadow-red-500/15',
                'transition-all duration-200 ease-out',
                'hover:-translate-y-0.5 hover:border-red-400/45 hover:bg-white/90',
                'active:translate-y-0 active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100',
              ].join(' ')}
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
              )}
              {isResetting ? 'Resetting...' : 'Reset Business DNA'}
            </button>
            <button
              onClick={handleContinueToCampaigns}
              className="relative px-6 py-2.5 bg-[#FAD400] hover:brightness-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-[#FAD400]/25 hover:shadow-[#FAD400]/40 transition-all flex items-center gap-2"
            >
              Continue to Campaigns
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
