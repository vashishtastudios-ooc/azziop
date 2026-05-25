// ============================================
// Industry Archetypes Library
// Dynamic creative direction per industry
// ============================================

export interface IndustryArchetype {
    label: string;
    keywords: string[]; // Used to match detected industry strings
    creativeArchetypes: {
        slot1_hero: string;
        slot2_story: string;
        slot3_lifestyle: string;
        slot4_universe: string;
    };
    photographyStyles: string[];
    colorPalettes: Record<string, string>;
    sceneVocabulary: {
        surfaces: string[];
        props: string[];
        atmospherics: string[];
        materials: string[];
    };
    qualityBoosters: string[];
    negativeElements: string[];
    premiumMandates: string[];
    exampleImageIntent: string;
}

// ============================================
// INDUSTRY DEFINITIONS
// ============================================

const FRAGRANCE: IndustryArchetype = {
    label: 'Fragrance & Perfume',
    keywords: ['fragrance', 'perfume', 'cologne', 'oud', 'attar', 'scent', 'eau de'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT SHOWCASE — Perfume bottle on premium surface (marble pedestal, natural stone slab, brushed gold platform). Dramatic editorial lighting — golden backlight, Rembrandt side-light. Luxury atmospheric effects: subtle smoke wisps, gold dust particles, liquid light reflections. Camera: eye-level or slightly low angle, 85mm portrait lens, shallow depth of field.`,
        slot2_story: `INGREDIENT / NOTE STORY — Visual breakdown of fragrance notes (top, heart, base). Floating ingredient elements with fine golden particles (saffron threads, rose petals, vanilla pods, bergamot slices, amber resin, spice pods). Arranged in elegant editorial infographic style — layered panels, thin gold connecting lines, circular flow. Macro photography feel with extreme texture detail.`,
        slot3_lifestyle: `LIFESTYLE ASPIRATION — Bottle in cinematic aspirational setting: Arabian desert sunset with golden dunes, rooftop terrace at golden hour, candlelit luxury interior. Warm golden-hour lighting, deep atmospheric depth. Shot as if from a high-end fragrance film — wide angle or medium shot.`,
        slot4_universe: `BRAND UNIVERSE COLLAGE — Modern luxury campaign collage layout. Central hero product surrounded by layered textured panels: desert dunes, macro spice textures, oud wood, leather, silk fabric, incense smoke, glowing amber resin. Smooth golden liquid light trails flowing across the composition.`,
    },
    photographyStyles: [
        'High-end fragrance campaign photography',
        'Luxury editorial (Vogue, GQ, Harper\'s Bazaar)',
        'Cinematic product film still',
        'Ingredient macro / texture art',
        'Fashion campaign collage / moodboard',
    ],
    colorPalettes: {
        'ultra-luxury': 'warm gold, deep bronze, dark chocolate brown, ivory cream',
        'arabian-nights': 'deep amber, saffron gold, burgundy, oud brown, sand beige',
        'dark-opulence': 'midnight navy, antique gold, oxblood, espresso',
        'fresh-luxury': 'champagne, blush pink, eucalyptus green, crystal white',
    },
    sceneVocabulary: {
        surfaces: ['marble pedestal', 'natural stone slab', 'brushed gold platform', 'dark velvet drape', 'obsidian surface'],
        props: ['saffron threads', 'rose petals', 'vanilla pods', 'bergamot slices', 'amber resin chunks', 'cardamom pods', 'oud wood', 'incense sticks'],
        atmospherics: ['incense smoke wisps', 'gold dust particles', 'golden liquid light trails', 'soft bokeh sparkles', 'warm volumetric light rays'],
        materials: ['marble grain', 'amber resin', 'leather texture', 'silk fabric', 'oud wood grain', 'crystal glass'],
    },
    qualityBoosters: [
        'high-end fragrance campaign photography',
        'luxury editorial for Vogue',
        '8k hyper-realistic detail',
        'cinematic contrast',
        'shot on Phase One IQ4 150MP',
        'retouched by high-end post-production studio',
        'ultra premium sensual mood',
    ],
    negativeElements: [
        'cheap plastic look', 'flat lighting', 'plain white background',
        'clip art', 'text overlay', 'watermarks', 'stock photo feel',
    ],
    premiumMandates: [
        'SPECIFIC SURFACE — marble, stone, velvet, gold platform (not just "background")',
        'PRECISE LIGHTING — golden backlight, warm rim-light, Rembrandt side-light',
        'ATMOSPHERIC EFFECTS — smoke wisps, gold dust, liquid light trails, incense haze',
        'MATERIAL TEXTURES — leather, silk, amber resin, oud wood, saffron, rose petals, vanilla',
        'CAMERA & MOOD — lens choice, angle, depth of field, cinematic/sensual/mysterious mood',
        'COLOR DIRECTION — deep bronze, dark chocolate, warm gold accents (specific tertiary colors)',
    ],
    exampleImageIntent: 'Luxury perfume bottle on dark marble pedestal with dramatic golden backlight creating warm halo, surrounded by floating saffron threads and amber resin with fine gold dust particles, subtle incense smoke wisps curling around the base, smooth golden liquid light trails, deep bronze and dark chocolate palette, 85mm f/1.4 slightly low angle, shallow depth of field, cinematic editorial fragrance campaign.',
};

const FASHION_SPORTSWEAR: IndustryArchetype = {
    label: 'Fashion & Sportswear',
    keywords: ['fashion', 'sportswear', 'gymwear', 'activewear', 'clothing', 'apparel', 'athleisure', 'streetwear', 'athletic', 'workout wear', 'leggings', 'sneakers', 'shoes', 'footwear'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT ON MODEL — Athletic/fashion model wearing the product in a powerful stance. Premium environment (modern gym with industrial concrete walls, sleek studio, or urban rooftop). Strong directional side-lighting to highlight fabric texture and body definition. Subtle sweat glow or movement blur for realism. Camera: low angle for dominance, 85mm lens, shallow depth of field.`,
        slot2_story: `FABRIC & DETAIL STORY — Extreme close-up macro shots of fabric details: compression zones, breathable mesh textures, stitching quality, zipper pulls, logo embossing. Split-panel editorial layout showing multiple texture details. Dramatic directional lighting raking across fabric surface to reveal weave patterns. Studio product photography with dark moody backdrop.`,
        slot3_lifestyle: `LIFESTYLE ACTION SHOT — Model mid-workout or mid-movement wearing the product: running through city streets at dawn, training in premium gym, yoga in minimalist studio with floor-to-ceiling windows. Dynamic motion capture, morning/golden-hour light, energy and power. Camera: wide 35mm for environmental context or telephoto for compression.`,
        slot4_universe: `BRAND UNIVERSE FLATLAY — Premium product flatlay/knolling arrangement: garments styled with complementary accessories (water bottle, wireless earbuds, gym bag, running shoes). Dark textured surface (concrete, slate, matte black). Overhead shot with dramatic shadows, editorial styling. Clean geometric composition.`,
    },
    photographyStyles: [
        'Commercial sportswear campaign photography',
        'Athletic editorial (Nike, Adidas campaign style)',
        'Dynamic action/motion photography',
        'Fabric macro / texture detail',
        'Premium flat lay / knolling',
        'Urban street style editorial',
    ],
    colorPalettes: {
        'power-dark': 'black, charcoal, metallic grey, muted warm highlights',
        'urban-energy': 'deep navy, electric blue accents, concrete grey, white',
        'street-bold': 'black, hot red, white, anthracite',
        'natural-athlete': 'olive green, sand, warm grey, cream, terracotta',
    },
    sceneVocabulary: {
        surfaces: ['concrete floor', 'rubber gym mat', 'industrial metal bench', 'slate surface', 'matte black platform', 'raw wood bench'],
        props: ['dumbbells', 'kettlebells', 'resistance bands', 'boxing gloves', 'water bottle', 'wireless earbuds', 'gym bag', 'running shoes', 'towel'],
        atmospherics: ['dust particles in light beams', 'cinematic light rays through windows', 'subtle sweat glow on skin', 'motion blur trails', 'dramatic gym shadows'],
        materials: ['compression fabric', 'breathable mesh', 'technical knit', 'reflective strips', 'rubber sole texture', 'nylon webbing', 'concrete walls', 'industrial steel'],
    },
    qualityBoosters: [
        'commercial sportswear photography',
        'Nike/Adidas campaign quality',
        '8k ultra-realistic detail',
        'cinematic athletic lighting',
        'shot on Canon R5 with 85mm f/1.2',
        'professional sports editorial',
        'powerful dominant elite athlete energy',
    ],
    negativeElements: [
        'cheap gym selfie look', 'flat overhead lighting', 'cluttered background',
        'blurry fabric detail', 'unrealistic body proportions', 'stock photo pose',
    ],
    premiumMandates: [
        'SPECIFIC ENVIRONMENT — premium gym, industrial studio, urban rooftop, minimalist training space (not generic background)',
        'DRAMATIC LIGHTING — strong side-light for muscle/fabric definition, rim-light for silhouette, cinematic beams',
        'FABRIC REALISM — visible compression zones, mesh texture, realistic fabric folds, stretch detail',
        'DYNAMIC ENERGY — powerful stance, mid-workout tension, motion blur, sweat glow',
        'CAMERA TECHNIQUE — low angle for power, 85mm for compression, shallow depth of field',
        'COLOR SPECIFICITY — black, charcoal, metallic grey with warm accent highlights',
    ],
    exampleImageIntent: 'Muscular athletic model in sleek black compression gymwear, powerful mid-deadlift stance inside premium modern gym with concrete walls and large industrial windows. Strong side-lighting highlighting muscle definition and fabric texture, subtle sweat glow on skin, dust particles floating in cinematic light beams. Low angle shot for dominance effect, 85mm lens, shallow depth of field. Black, charcoal, metallic grey palette with warm highlights.',
};

const BEAUTY_SKINCARE: IndustryArchetype = {
    label: 'Beauty & Skincare',
    keywords: ['beauty', 'skincare', 'cosmetics', 'makeup', 'serum', 'moisturizer', 'cleanser', 'cream', 'skin care', 'derma', 'facial', 'anti-aging'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT SHOWCASE — Serum/cream bottle floating or placed on smooth gradient surface (cream, soft pink, glass shelf). Soft diffused studio lighting, subtle water droplets or dewy texture on product surface. Botanical elements (eucalyptus, lavender, aloe) artfully placed nearby. Camera: eye-level macro, 100mm lens, focus on product texture and label.`,
        slot2_story: `INGREDIENT SCIENCE STORY — Clean infographic layout with key ingredients floating around product: vitamin C serum with orange slice, hyaluronic acid with water molecules, retinol with molecular structures, botanical extracts with fresh leaves. Soft diffused lighting, clinical-meets-luxury aesthetic. White/cream backgrounds with subtle gradient.`,
        slot3_lifestyle: `SKINCARE RITUAL MOMENT — Model mid-application: serum dropper on fingertip with golden liquid, cream application on dewy skin, or peaceful morning routine in bright bathroom. Soft natural window light, clean minimalist interior. Close-up on skin texture showing glow and dewiness. Warm, serene, self-care mood.`,
        slot4_universe: `BRAND WORLD FLATLAY — Products arranged in aesthetic flat lay with botanical ingredients: fresh flowers, citrus slices, honey, jade roller, clean towel, botanical sprigs. Marble or terrazzo surface. Overhead shot with soft shadows, editorial beauty magazine styling. Clean, fresh, luminous color palette.`,
    },
    photographyStyles: [
        'Premium beauty editorial photography',
        'Clean skincare product photography (Glossier, Drunk Elephant style)',
        'Ingredient macro / botanical art',
        'Skincare ritual lifestyle',
        'Beauty flat lay editorial',
        'Clinical luxury product shot',
    ],
    colorPalettes: {
        'clean-luxury': 'soft cream, blush pink, white, gold accents',
        'botanical': 'sage green, cream, terracotta, soft brown, white',
        'clinical-premium': 'white, silver, ice blue, translucent, pearl',
        'warm-glow': 'golden honey, warm peach, cream, soft amber',
    },
    sceneVocabulary: {
        surfaces: ['marble countertop', 'frosted glass shelf', 'terrazzo surface', 'soft linen fabric', 'cream gradient backdrop', 'light wood vanity'],
        props: ['jade roller', 'gua sha', 'botanical sprigs', 'citrus slices', 'fresh flowers', 'cotton pads', 'clean towel', 'water droplets', 'honey drizzle'],
        atmospherics: ['soft dewy mist', 'water splash in slow motion', 'golden serum droplets', 'soft diffused window light', 'steam from warm towel', 'light prism rainbow'],
        materials: ['frosted glass', 'matte ceramic', 'fresh botanical leaves', 'liquid serum texture', 'cream swirl texture', 'dewy skin surface'],
    },
    qualityBoosters: [
        'premium beauty editorial photography',
        'Glossier/La Mer campaign quality',
        '8k ultra-realistic skin texture detail',
        'soft diffused studio lighting',
        'shot on Hasselblad medium format',
        'clean minimalist beauty aesthetic',
        'dewy luminous skincare campaign',
    ],
    negativeElements: [
        'harsh direct lighting', 'oily/greasy look', 'cluttered background',
        'unrealistic skin smoothing', 'cheap drugstore feel', 'stock photo pose',
    ],
    premiumMandates: [
        'SKIN TEXTURE — realistic dewy glow, visible pores at macro level, no plastic-smooth skin',
        'PRODUCT DETAIL — visible product texture (serum viscosity, cream swirl, dropper with golden liquid)',
        'SOFT LIGHTING — diffused, flattering, no harsh shadows, slight warmth for skin glow',
        'BOTANICAL ELEMENTS — fresh real ingredients, not clip art (actual leaves, fruits, flowers)',
        'CLEAN COMPOSITION — minimalist, lots of breathing room, magazine editorial feel',
        'COLOR HARMONY — soft tertiary palette (cream, blush, sage) not saturated primary colors',
    ],
    exampleImageIntent: 'Luxury serum bottle with golden dropper suspended above, golden liquid drop about to fall, placed on smooth cream marble surface. Fresh eucalyptus sprigs and white peonies artfully arranged nearby, soft water droplets on product surface. Diffused studio lighting with subtle warm glow, soft cream and blush pink gradient backdrop. Macro 100mm lens, eye-level, cream/gold/soft pink palette, clean minimalist beauty editorial.',
};

const FOOD_RESTAURANT: IndustryArchetype = {
    label: 'Food & Restaurant',
    keywords: ['food', 'restaurant', 'cafe', 'bakery', 'delivery', 'meal', 'cuisine', 'chef', 'catering', 'kitchen', 'dining', 'recipe', 'gourmet'],
    creativeArchetypes: {
        slot1_hero: `HERO DISH SHOWCASE — Signature dish plated on premium surface, dramatic dark moody lighting. Steam rising, cheese pull, sauce drizzle, or garnish placement caught mid-action. Extreme close-up showing texture detail: grill marks, caramelization, crumb detail. Camera: 45-degree angle, 50mm lens, dark background with warm accent lighting.`,
        slot2_story: `INGREDIENT STORY — Fresh ingredients arranged in editorial flat-lay: herbs, spices, vegetables, meats, oils. Rustic wood surface or dark slate. Artful scatter with intentional composition. Overhead shot showing ingredient-to-dish transformation. Kitchen utensils as supporting props. Natural light with warm fill.`,
        slot3_lifestyle: `DINING EXPERIENCE — Beautiful table setting in atmospheric restaurant environment: candlelight, warm ambient glow, elegant plating, wine glasses, satisfied diners. Intimate mood, soft bokeh background. Environmental portrait showing the dining experience, not just food. Warm tungsten + candle lighting.`,
        slot4_universe: `BRAND WORLD COLLAGE — Multi-image editorial: kitchen action shot, ingredient close-up, finished dish, dining atmosphere. Layered panels showing the journey from ingredient to plate. Dark moody color grading, cinematic food campaign. Rich textures throughout.`,
    },
    photographyStyles: [
        'Dark moody food photography',
        'Professional culinary editorial',
        'Ingredient flat lay photography',
        'Restaurant atmosphere / lifestyle',
        'Dynamic food action shots (pour, pull, drizzle)',
        'Overhead editorial plating',
    ],
    colorPalettes: {
        'dark-moody': 'deep charcoal, warm amber, rich brown, burgundy, cream accent',
        'rustic-warm': 'terracotta, olive green, warm wood, cream, burnt orange',
        'fresh-clean': 'white, sage green, lemon yellow, natural wood, soft grey',
        'fine-dining': 'black, gold, white, deep red, dark wood',
    },
    sceneVocabulary: {
        surfaces: ['dark slate board', 'rustic wood table', 'marble countertop', 'cast iron skillet', 'ceramic plate', 'parchment paper'],
        props: ['fresh herbs', 'olive oil drizzle', 'sea salt flakes', 'vintage cutlery', 'linen napkin', 'wine glass', 'candle', 'bread basket', 'copper pot'],
        atmospherics: ['rising steam', 'cheese pull strings', 'sauce drizzle mid-air', 'flour dust in light', 'sizzle smoke from grill', 'warm candlelight glow'],
        materials: ['caramelized crust', 'crispy texture', 'melted cheese', 'fresh herb leaves', 'cracked pepper', 'grill marks', 'rustic bread crust'],
    },
    qualityBoosters: [
        'professional food photography',
        'Bon Appétit / Food & Wine editorial quality',
        '8k resolution macro food detail',
        'dark moody culinary lighting',
        'shot on Canon EOS R5 with 50mm f/1.4',
        'award-winning restaurant campaign',
        'appetizing indulgent mood',
    ],
    negativeElements: [
        'flat overhead fluorescent lighting', 'messy unappetizing presentation',
        'fast food chain aesthetic', 'blurry food texture', 'oversaturated colors', 'plastic-looking food',
    ],
    premiumMandates: [
        'TEXTURE DETAIL — visible grill marks, caramelization, bread crust, herb leaves at macro level',
        'DYNAMIC ELEMENTS — steam, cheese pull, sauce drizzle, or garnish mid-air (action)',
        'MOODY LIGHTING — dark background, warm directional side-light, no flat lighting',
        'SURFACE CHOICE — dark slate, rustic wood, or matte ceramic (not plastic plates)',
        'COLOR WARMTH — rich warm tones, deep shadows, amber highlights, dark moody grading',
        'APPETITE APPEAL — must look delicious, indulgent, and photo-worthy on first glance',
    ],
    exampleImageIntent: 'Gourmet burger on dark slate board with melted cheese pull caught mid-stretch, steam rising from premium brioche bun with sesame seeds. Crispy bacon with visible texture, fresh lettuce and tomato glistening. Dark moody restaurant setting with warm tungsten accent lights, shallow depth of field, 45-degree angle, 50mm lens. Rich browns, golden yellows against charcoal background.',
};

const TECH_SAAS: IndustryArchetype = {
    label: 'Tech & SaaS',
    keywords: ['tech', 'saas', 'software', 'app', 'platform', 'digital', 'ai', 'cloud', 'startup', 'fintech', 'blockchain', 'automation', 'analytics'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT / INTERFACE SHOWCASE — Sleek device (laptop, phone, dashboard) displaying the product UI on a clean minimal desk setup. Subtle holographic or gradient light reflections on screen. Minimal props: wireless mouse, plant, coffee cup. Clean futuristic environment. Camera: slight angle showing depth, soft edge lighting.`,
        slot2_story: `FEATURE / DATA STORY — Abstract data visualization: floating UI cards, dashboard elements, analytics charts arranged in 3D space. Subtle glow connections between elements. Dark gradient background (deep navy to black) with accent color highlights. Clean infographic editorial layout with depth layers.`,
        slot3_lifestyle: `PROFESSIONAL IN CONTEXT — Person interacting with the product in a modern workspace: glass-walled office, co-working space, or home office setup. Screen showing product UI. Natural light from windows, contemporary interior. Shot showing productivity and confidence. Medium shot, environmental context.`,
        slot4_universe: `BRAND WORLD ABSTRACT — Abstract tech composition: gradient mesh backgrounds, glassmorphism cards, floating geometric shapes, subtle grid patterns. Product screenshots or icons integrated into the abstract layout. Futuristic, clean, sophisticated. Neon or gradient accent lines.`,
    },
    photographyStyles: [
        'Sleek tech product photography',
        'UI/UX showcase with device mockup',
        'Modern workspace lifestyle',
        'Abstract gradient / 3D composition',
        'Data visualization art',
        'Futuristic brand identity',
    ],
    colorPalettes: {
        'tech-dark': 'deep navy, electric blue, white, subtle purple accents',
        'modern-clean': 'white, light grey, ocean blue, mint green accent',
        'futuristic': 'black, neon cyan, electric purple, dark gradient',
        'warm-tech': 'off-white, warm grey, coral accent, deep charcoal',
    },
    sceneVocabulary: {
        surfaces: ['minimal white desk', 'glass desk surface', 'matte dark desk', 'floating in gradient space', 'clean workspace surface'],
        props: ['MacBook Pro', 'iPhone', 'wireless mouse', 'minimal plant', 'coffee cup', 'notebook', 'AirPods'],
        atmospherics: ['subtle screen glow', 'holographic light reflections', 'gradient mesh background', 'floating UI elements', 'neon accent lines', 'glassmorphism blur'],
        materials: ['brushed aluminum', 'frosted glass', 'matte plastic', 'gradient mesh', 'glassmorphism panels', 'sleek chrome'],
    },
    qualityBoosters: [
        'sleek tech product photography',
        'Apple campaign quality aesthetic',
        '8k ultra-sharp detail',
        'clean minimal lighting',
        'professional SaaS brand campaign',
        'modern futuristic tech editorial',
        'premium startup brand photography',
    ],
    negativeElements: [
        'outdated technology', 'cluttered desk', 'cheesy stock photo',
        'clip art icons', 'busy chaotic background', 'low-res screenshots',
    ],
    premiumMandates: [
        'CLEAN MINIMALISM — lots of negative space, uncluttered, sophisticated simplicity',
        'DEVICE REALISM — realistic device renders with actual UI screenshots, not mockup placeholders',
        'MODERN LIGHTING — soft ambient, subtle edge glow, no harsh shadows',
        'GRADIENT & DEPTH — subtle gradient backgrounds, glassmorphism, layered depth',
        'COLOR PRECISION — brand accent color used sparingly on neutral base',
        'FUTURISTIC FEEL — should feel forward-looking, innovative, trustworthy',
    ],
    exampleImageIntent: 'Sleek MacBook Pro on minimal matte white desk displaying analytics dashboard with clean UI, subtle holographic light reflection on screen edge. Wireless mouse and small potted succulent nearby. Soft ambient lighting, deep navy to charcoal gradient backdrop with subtle grid pattern. Slight 30-degree angle showing depth, clean edge lighting on aluminum. Modern tech product photography, minimalist futuristic mood.',
};

const REAL_ESTATE: IndustryArchetype = {
    label: 'Real Estate & Property',
    keywords: ['real estate', 'property', 'apartment', 'villa', 'home', 'house', 'condo', 'residence', 'realty', 'construction', 'interior design', 'architecture'],
    creativeArchetypes: {
        slot1_hero: `HERO PROPERTY EXTERIOR — Stunning architectural exterior at golden hour or blue hour. Dramatic sky, warm interior lights glowing through windows. Landscaped grounds, pool reflection. Wide angle architecture photography showing full building grandeur. Low angle for imposing feel.`,
        slot2_story: `INTERIOR SHOWCASE — Beautifully staged living space: open-plan living room, luxury kitchen, or spa-like bathroom. Natural light flooding through large windows, city skyline or nature views visible. Styled with premium furniture. Wide angle interior photography showing space and flow.`,
        slot3_lifestyle: `ASPIRATIONAL LIVING — Family or couple enjoying the space: cooking in the kitchen, relaxing on terrace with view, hosting dinner party. Warm golden-hour light, lifestyle documentary style. Environmental portrait showing the life, not just the property.`,
        slot4_universe: `PROPERTY COLLAGE — Editorial layout combining: aerial drone shot, interior detail, neighborhood amenity, lifestyle moment. Multiple panels showing the complete living experience. Warm, aspirational, premium grading throughout.`,
    },
    photographyStyles: [
        'Architectural photography (golden hour / blue hour)',
        'Premium interior design editorial',
        'Aerial / drone real estate photography',
        'Luxury lifestyle documentary',
        'Real estate twilight photography',
        'Interior detail macro',
    ],
    colorPalettes: {
        'luxury-property': 'warm cream, deep walnut, gold accents, ivory, soft sage',
        'modern-arch': 'white, concrete grey, black accents, warm wood, glass blue',
        'twilight': 'deep blue hour sky, warm amber interior glow, charcoal, gold',
        'mediterranean': 'terracotta, warm cream, olive green, azure blue, natural stone',
    },
    sceneVocabulary: {
        surfaces: ['marble floors', 'hardwood flooring', 'granite countertop', 'infinity pool edge', 'manicured lawn', 'paved terrace'],
        props: ['designer furniture', 'statement lighting fixture', 'floor-to-ceiling windows', 'fireplace', 'kitchen island', 'balcony railing', 'pool', 'landscaped garden'],
        atmospherics: ['golden hour warm light', 'blue hour sky glow', 'warm interior lights through windows', 'morning mist over grounds', 'pool water reflections', 'sunset sky gradients'],
        materials: ['marble', 'natural stone', 'warm wood', 'glass curtain wall', 'brushed brass fixtures', 'polished concrete', 'premium tile'],
    },
    qualityBoosters: [
        'architectural photography golden hour',
        'Architectural Digest quality',
        '8k ultra-sharp detail',
        'professional real estate twilight photography',
        'shot on tilt-shift lens for architecture',
        'luxury property campaign',
        'aspirational living editorial',
    ],
    negativeElements: [
        'empty unfurnished rooms', 'harsh midday lighting', 'cluttered lived-in mess',
        'fish-eye distortion', 'dark underexposed interiors', 'construction site debris',
    ],
    premiumMandates: [
        'GOLDEN/BLUE HOUR — exterior shots at golden hour or twilight with dramatic sky',
        'NATURAL LIGHT — interiors flooded with warm window light, no flash photography look',
        'STAGED LUXURY — spaces styled with premium furniture and decor, lived-in but curated',
        'WIDE PERSPECTIVE — wide angle to show space and flow, no claustrophobic crops',
        'WARM ASPIRATION — must evoke "I want to live here" emotion immediately',
        'ARCHITECTURAL DETAIL — show material quality: marble, wood grain, brass fixtures',
    ],
    exampleImageIntent: 'Modern luxury villa exterior at golden hour, warm amber sunset sky behind, interior lights glowing warmly through floor-to-ceiling glass walls. Infinity pool in foreground reflecting the building and sky. Landscaped garden with olive trees. Wide angle architectural photography from low angle, dramatic sky gradient. Warm cream, walnut, and gold palette, aspirational luxury living mood.',
};

const FITNESS_WELLNESS: IndustryArchetype = {
    label: 'Fitness & Wellness',
    keywords: ['fitness', 'wellness', 'yoga', 'pilates', 'gym', 'personal training', 'health', 'nutrition', 'supplements', 'protein', 'workout', 'crossfit', 'meditation'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT/SERVICE — Product (supplement tub, yoga mat, equipment) or coach portrait in premium fitness environment. Clean studio lighting, motivational energy. If product: on clean surface with lifestyle props. If person: powerful confident pose, professional portraiture.`,
        slot2_story: `TRANSFORMATION / RESULTS — Before/after energy (not literal split), or mid-workout intensity shot showing the journey. Sweat detail, muscle definition focus, raw determination. Drama through lighting and angle. Close crop on effort and strength.`,
        slot3_lifestyle: `ASPIRATIONAL ACTIVE LIFESTYLE — Person mid-activity in beautiful setting: sunrise beach run, mountain trail, outdoor yoga at golden hour, modern home gym. Environmental context showing the ideal fit lifestyle. Cinematic golden-hour light, freedom and energy.`,
        slot4_universe: `WELLNESS WORLD FLATLAY — Flat lay/knolling of fitness lifestyle essentials: supplements, healthy meal prep, workout gear, water bottle, resistance bands, journal, fresh fruits. Clean surface, overhead shot, editorial styling, cohesive color palette.`,
    },
    photographyStyles: [
        'Athletic fitness campaign photography',
        'Wellness lifestyle editorial',
        'Dynamic workout action photography',
        'Outdoor active lifestyle',
        'Flat lay / knolling wellness',
        'Motivational fitness portrait',
    ],
    colorPalettes: {
        'power-energy': 'black, electric orange, white, dark grey',
        'zen-wellness': 'sage green, cream, warm beige, soft terracotta',
        'clean-active': 'white, ocean blue, light grey, fresh green',
        'dark-intensity': 'charcoal, deep red, black, amber highlight',
    },
    sceneVocabulary: {
        surfaces: ['yoga mat', 'gym floor', 'outdoor trail path', 'clean white surface', 'natural wood platform', 'sand beach'],
        props: ['dumbbells', 'resistance bands', 'protein shaker', 'yoga blocks', 'foam roller', 'jump rope', 'healthy smoothie', 'fresh fruits', 'workout journal'],
        atmospherics: ['sunrise golden rays', 'sweat droplets in light', 'morning mist outdoors', 'dust particles in gym light', 'steam from hot yoga', 'breath vapor in cold air'],
        materials: ['athletic fabric', 'rubber grip texture', 'stainless steel equipment', 'natural cork', 'bamboo', 'fresh produce texture'],
    },
    qualityBoosters: [
        'professional fitness photography',
        'Nike Training/Lululemon campaign quality',
        '8k ultra-realistic detail',
        'dynamic motivational lighting',
        'shot on Canon R5',
        'wellness lifestyle editorial',
        'empowering active energy mood',
    ],
    negativeElements: [
        'cheesy gym selfie', 'unrealistic body manipulation', 'harsh flash lighting',
        'cluttered gym background', 'low energy static pose', 'overly filtered look',
    ],
    premiumMandates: [
        'AUTHENTIC ENERGY — real effort, sweat, determination, not fake posed smiles',
        'DYNAMIC LIGHTING — side-light for definition, golden hour for lifestyle, dramatic for intensity',
        'MOVEMENT — capture mid-motion energy, not static standing poses',
        'ENVIRONMENT — premium space (modern studio, scenic outdoor, clean home gym)',
        'BODY POSITIVITY — powerful, fit, inclusive, celebrating strength not just aesthetics',
        'TEXTURE DETAIL — sweat, fabric stretch, grip texture, raw authentic details',
    ],
    exampleImageIntent: 'Athletic woman mid-warrior yoga pose in sleek leggings, morning golden light streaming through floor-to-ceiling windows of minimalist Scandinavian loft studio. Soft directional side-lighting creating gentle body definition shadows, warm muted earth tones with sage green accents. Eye-level 85mm portrait lens, shallow depth of field, serene yet empowering mood.',
};

const JEWELRY_ACCESSORIES: IndustryArchetype = {
    label: 'Jewelry & Accessories',
    keywords: ['jewelry', 'jewellery', 'watch', 'watches', 'bracelet', 'necklace', 'ring', 'earring', 'diamond', 'gold jewelry', 'accessories', 'luxury watches', 'handbag', 'sunglasses'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT MACRO — Extreme close-up of jewelry piece showing sparkle, cut facets, metal finish. Dramatic spotlight creating prismatic light reflections. Dark velvet or black surface. Product fills 60-70% of frame. Macro lens capturing every facet and light refraction.`,
        slot2_story: `CRAFTSMANSHIP STORY — Detail shots showing: clasp mechanism, stone setting, metal texture, engraving detail. Editorial panel layout of multiple detail angles. Workshop/atelier environment hints. Premium artisan craftsmanship focus.`,
        slot3_lifestyle: `ON-BODY LIFESTYLE — Model wearing the piece in elegant setting: candlelit dinner, gallery opening, sun-dappled garden. Focus on how piece catches light on skin. Close-up of hand/neck/wrist with product. Warm, intimate, aspirational. Environmental portrait style.`,
        slot4_universe: `LUXURY DISPLAY — Museum-like presentation: pieces arranged on tiered display or negative space composition. Mixed materials: velvet, marble, fresh flowers alongside. Dramatic spot-lighting with dark backdrop. Gallery/boutique aesthetic.`,
    },
    photographyStyles: [
        'Luxury jewelry macro photography',
        'Fine jewelry editorial (Tiffany, Cartier style)',
        'Craftsmanship detail photography',
        'On-body jewelry lifestyle',
        'Premium product display',
        'Artisan workshop documentary',
    ],
    colorPalettes: {
        'classic-luxury': 'black, gold, cream, deep burgundy',
        'diamond-ice': 'platinum silver, ice blue, white, crystal clear',
        'warm-gold': 'rich gold, dark chocolate, cream, amber',
        'modern-minimal': 'matte black, rose gold, soft blush, white',
    },
    sceneVocabulary: {
        surfaces: ['black velvet display', 'mirror surface', 'marble pedestal', 'dark leather', 'silk fabric drape', 'frosted glass'],
        props: ['jewelry box', 'fresh rose', 'champagne glass', 'candle', 'loupe magnifier', 'silk ribbon', 'pearl scatter'],
        atmospherics: ['prismatic light refractions', 'dramatic spotlight', 'sparkle bokeh', 'candlelight warmth', 'golden hour warm glow on metal'],
        materials: ['polished gold', 'brushed silver', 'diamond facets', 'pearl luster', 'leather strap texture', 'gemstone depth', 'silk shimmer'],
    },
    qualityBoosters: [
        'luxury jewelry macro photography',
        'Cartier/Tiffany campaign quality',
        '8k ultra-sharp macro detail',
        'dramatic spotlight product photography',
        'shot on macro lens at f/2.8',
        'high-end jewelry editorial',
        'exquisite premium mood',
    ],
    negativeElements: [
        'dull flat lighting', 'blurry gemstone detail', 'cheap display surface',
        'over-retouched plastic look', 'cluttered composition', 'costume jewelry feel',
    ],
    premiumMandates: [
        'SPARKLE & LIGHT — prismatic refractions, spotlight catch, light dance on facets/metal',
        'MACRO DETAIL — every facet, every grain of metal texture visible',
        'PREMIUM SURFACE — black velvet, mirror, marble (never plastic or cheap fabric)',
        'SKIN CONTRAST — when on-body, warm skin tone vs cool metal/stone contrast',
        'DRAMATIC LIGHTING — single spotlight or directional light for maximum sparkle',
        'INTIMATE SCALE — close crop to show precious detail, not wide generic shots',
    ],
    exampleImageIntent: 'Diamond solitaire ring extreme macro on black velvet surface, dramatic single spotlight from upper right creating prismatic rainbow refractions through diamond facets. Visible platinum band texture and prong setting detail. Deep black background fading to darkness, sparkle bokeh in soft background. 100mm macro lens f/2.8, eye-level, rich black and platinum palette with prismatic light accents.',
};

const AUTOMOTIVE: IndustryArchetype = {
    label: 'Automotive',
    keywords: ['automotive', 'car', 'cars', 'vehicle', 'motor', 'driving', 'luxury car', 'suv', 'sedan', 'electric vehicle', 'ev', 'motorcycle'],
    creativeArchetypes: {
        slot1_hero: `HERO VEHICLE SHOT — Car in dramatic 3/4 angle on premium location (mountain overlook, urban twilight, desert highway). Dramatic sky, reflections on body panels. Low angle emphasizing vehicle presence. Cinematic automotive photography lighting.`,
        slot2_story: `DETAIL & CRAFTSMANSHIP — Interior luxury details: dashboard, leather seats, steering wheel, controls. Exterior details: headlight design, grille, wheel, emblem. Split-panel editorial showing premium finish quality. Studio lighting revealing material textures.`,
        slot3_lifestyle: `DRIVING EXPERIENCE — Vehicle in motion: mountain road, coastal highway, city nightscape. Dynamic motion blur on background, car sharp. Drone or tracking shot perspective. Freedom, power, exhilaration mood. Golden hour or blue hour lighting.`,
        slot4_universe: `BRAND WORLD — Vehicle in designed environment: modern architecture backdrop, reflected in water, against dramatic landscape. Complementary color grading, cinematic widescreen feel, luxury automotive campaign aesthetic.`,
    },
    photographyStyles: [
        'Cinematic automotive photography',
        'Luxury car editorial',
        'Automotive detail/interior macro',
        'Dynamic driving action/tracking shot',
        'Automotive twilight / light painting',
        'Drone aerial automotive',
    ],
    colorPalettes: {
        'prestige-dark': 'deep black, chrome silver, dark blue, warm amber headlights',
        'desert-drive': 'desert sand, warm sunset orange, dark chassis, golden sky',
        'urban-night': 'deep blue night, neon reflections, wet asphalt, warm interior glow',
        'electric-future': 'pearl white, electric blue accents, silver, clean grey',
    },
    sceneVocabulary: {
        surfaces: ['wet asphalt', 'desert highway', 'mountain road', 'showroom floor', 'polished concrete', 'curved road'],
        props: ['mountain backdrop', 'city skyline', 'modern architecture', 'canyon walls', 'coastal road guardrail', 'tunnel lights'],
        atmospherics: ['motion blur trails', 'headlight beams', 'wet road reflections', 'dust trail', 'dramatic sky', 'light painting streaks', 'exhaust heat shimmer'],
        materials: ['polished paint', 'chrome trim', 'premium leather', 'carbon fiber', 'brushed aluminum', 'alloy wheel', 'glass headlight lens'],
    },
    qualityBoosters: [
        'cinematic automotive photography',
        'luxury car brand campaign quality',
        '8k ultra-sharp detail',
        'dramatic automotive lighting',
        'shot on Phase One with automotive rig',
        'professional car editorial',
        'powerful prestige luxury mood',
    ],
    negativeElements: [
        'parking lot snapshot', 'harsh midday sun', 'dirty vehicle',
        'distorted wide-angle', 'cluttered background', 'dealership showroom fluorescent',
    ],
    premiumMandates: [
        'BODY PANEL REFLECTIONS — show paint quality through environment reflections on panels',
        'LOW ANGLE DOMINANCE — slightly below eye-level for vehicle presence and power',
        'DRAMATIC SKY — golden hour, blue hour, or dramatic cloud formations',
        'MOTION ENERGY — suggest speed/power even when parked (dynamic angle, light trails)',
        'MATERIAL LUXURY — visible leather grain, chrome polish, carbon fiber weave',
        'CINEMATIC GRADING — movie-grade color grading, not flat documentary',
    ],
    exampleImageIntent: 'Luxury sedan in dramatic 3/4 front angle on mountain overlook at golden hour, warm sunset sky behind with dramatic clouds. Polished dark paint reflecting amber sky on body panels, chrome trim catching light. Low angle emphasizing vehicle presence, 35mm wide lens with mountain road curving behind. Deep charcoal, warm amber, chrome silver palette. Cinematic automotive photography, powerful prestige mood.',
};

const HOME_INTERIOR: IndustryArchetype = {
    label: 'Home & Interior',
    keywords: ['home', 'interior', 'furniture', 'decor', 'home decor', 'living room', 'bedroom', 'kitchen design', 'home furnishing', 'cushion', 'candle', 'rug', 'curtain', 'lamp'],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT IN SITU — Furniture/decor piece styled in a beautifully designed room. Natural light from large windows. Product is focal point but room context shows it in life. Warm, inviting, aspirational interior. Photography: 35mm wide showing room context.`,
        slot2_story: `DETAIL & TEXTURE — Close-up on material quality: fabric weave, wood grain, ceramic glaze, metal finish. Split-panel or detail montage showing craftsmanship. Soft directional lighting revealing texture depth. Macro photography of surfaces.`,
        slot3_lifestyle: `LIVING MOMENT — Person enjoying the space/product: reading in armchair, morning coffee at dining table, cozy evening with candles. Warm lifestyle documentary style. Natural window light, lived-in but curated. Intimate and inviting.`,
        slot4_universe: `STYLED ROOM SHOWCASE — Fully styled room/vignette with multiple products in cohesive design. Curated color palette, balanced composition. Editorial interior photography like Architectural Digest or Elle Decor. Wide angle capturing the complete designed space.`,
    },
    photographyStyles: [
        'Interior design editorial photography',
        'Lifestyle home documentary',
        'Furniture product photography',
        'Material / texture macro detail',
        'Styled room / vignette',
        'Cozy lifestyle editorial',
    ],
    colorPalettes: {
        'scandinavian': 'white, light wood, soft grey, sage green, warm cream',
        'warm-modern': 'warm terracotta, cream, olive green, dark walnut, brass',
        'moody-luxe': 'deep forest green, rich burgundy, brass gold, dark wood, cream',
        'coastal': 'off-white, sky blue, natural wood, sandy beige, soft navy',
    },
    sceneVocabulary: {
        surfaces: ['light oak floor', 'marble coffee table', 'linen upholstery', 'jute rug', 'ceramic tile', 'polished concrete floor'],
        props: ['throw pillow', 'potted plant', 'coffee table book', 'ceramic vase', 'candle', 'woven basket', 'fresh flowers', 'knit throw blanket'],
        atmospherics: ['warm morning sunlight through windows', 'soft shadow patterns on wall', 'candlelight glow', 'soft natural breeze on curtains', 'dust motes in sunbeam'],
        materials: ['natural linen', 'bouclé fabric', 'solid walnut', 'handmade ceramic', 'brushed brass', 'natural stone', 'rattan weave'],
    },
    qualityBoosters: [
        'interior design editorial photography',
        'Architectural Digest / Elle Decor quality',
        '8k ultra-sharp detail',
        'warm natural lighting',
        'professionally styled room',
        'premium home lifestyle campaign',
        'cozy inviting aspirational mood',
    ],
    negativeElements: [
        'empty unfurnished look', 'harsh flash lighting', 'cluttered messy room',
        'cheap furniture feel', 'dark underexposed', 'catalog-style flat shot',
    ],
    premiumMandates: [
        'NATURAL LIGHT — warm window light flooding the space, creating soft shadows',
        'STYLING — curated, intentional arrangement, not showroom catalog feel',
        'TEXTURE RICHNESS — fabric, wood grain, ceramic glaze all visually tactile',
        'LIVED-IN WARMTH — should feel like someone wonderful lives here, not a furniture store',
        'COLOR COHESION — harmonious palette throughout the scene, nothing jarring',
        'SPACE & FLOW — capture the room breathing, generous composition, not cramped',
    ],
    exampleImageIntent: 'Elegant bouclé armchair in warm cream beside large window, morning sunlight flooding in creating soft shadow patterns on light oak floor. Styled with knit throw blanket, ceramic coffee mug on small walnut side table, potted fiddle leaf fig nearby. Warm Scandinavian interior, soft sage and cream palette. 35mm wide angle showing room context, warm natural lighting, interior design editorial.',
};

const EDUCATION_COURSES: IndustryArchetype = {
    label: 'Education & Courses',
    keywords: ['education', 'course', 'learning', 'training', 'academy', 'school', 'university', 'online course', 'tutorial', 'coaching', 'mentoring', 'workshop', 'e-learning'],
    creativeArchetypes: {
        slot1_hero: `HERO KNOWLEDGE VISUAL — Laptop/tablet showing course content in an inspiring workspace. Books, notes, coffee. Clean motivational environment. Warm lighting, organized desk. Subject feels approachable yet professional.`,
        slot2_story: `TRANSFORMATION STORY — Before/after or journey visual: confused to confident, beginner to expert energy. Split composition or progress visual. Person at desk having "aha moment." Bright inspirational lighting symbolizing growth.`,
        slot3_lifestyle: `LEARNING IN CONTEXT — Student/professional learning in aspirational setting: café, home office, library, co-working space. Focused engaged expression. Natural light, productive energy. Lifestyle documentary style.`,
        slot4_universe: `KNOWLEDGE WORLD — Abstract composition of learning elements: books, devices, certificates, graphs going up, lightbulb/brain imagery. Motivational editorial layout. Clean modern design with brand colors. Inspiring and achievement-oriented.`,
    },
    photographyStyles: [
        'Professional workspace photography',
        'Knowledge / education editorial',
        'Motivational portrait photography',
        'Clean modern lifestyle',
        'Abstract concept visualization',
        'Professional headshot / portrait',
    ],
    colorPalettes: {
        'professional-trust': 'navy blue, white, gold accent, warm grey',
        'growth-energy': 'teal, warm orange, white, charcoal',
        'creative-learning': 'deep purple, warm yellow, white, soft grey',
        'clean-modern': 'white, soft blue, light grey, green accent',
    },
    sceneVocabulary: {
        surfaces: ['clean wooden desk', 'white workspace', 'library table', 'café counter', 'modern conference table'],
        props: ['laptop', 'notebook', 'pen', 'books stack', 'coffee cup', 'headphones', 'sticky notes', 'whiteboard', 'certificate', 'diploma'],
        atmospherics: ['warm natural window light', 'soft desk lamp glow', 'library ambience', 'morning productivity light', 'focused concentration mood'],
        materials: ['paper texture', 'book spines', 'leather notebook', 'wood desk grain', 'glass screen', 'whiteboard surface'],
    },
    qualityBoosters: [
        'professional education campaign photography',
        'MasterClass/Coursera brand quality',
        '8k resolution',
        'warm inspirational lighting',
        'clean modern editorial',
        'motivational aspirational mood',
        'professional knowledge brand campaign',
    ],
    negativeElements: [
        'boring classroom fluorescent', 'messy cluttered desk',
        'cheesy stock photo pointing at screen', 'overly corporate stiff', 'childish cartoon elements',
    ],
    premiumMandates: [
        'ASPIRATIONAL SETTING — beautiful workspace, not generic office cubicle',
        'WARM MOTIVATION — lighting and mood should inspire action, not feel like homework',
        'AUTHENTIC ENGAGEMENT — real focus and concentration, not staged pointing at screen',
        'CLEAN ORGANIZATION — organized desk, intentional composition, professional feel',
        'GROWTH SYMBOLISM — visual metaphors for progress, achievement, transformation',
        'PROFESSIONAL QUALITY — should feel like a premium course brand, not budget tutorial',
    ],
    exampleImageIntent: 'Focused professional woman at clean modern desk with MacBook showing course dashboard, warm morning light from window behind. Organized workspace with notebook, premium pen, and coffee in ceramic mug. Soft warm natural lighting, navy blue and warm gold palette with white accents. Eye-level 50mm portrait, slight shallow depth of field, motivational productive mood. Professional education campaign photography.',
};

// ============================================
// FALLBACK / GENERAL
// ============================================
const GENERAL: IndustryArchetype = {
    label: 'General / Multi-industry',
    keywords: [],
    creativeArchetypes: {
        slot1_hero: `HERO PRODUCT/SERVICE SHOWCASE — Product or service representation on premium surface with dramatic editorial lighting. Clean composition with the subject as unmistakable focal point. Professional commercial photography with appropriate mood lighting.`,
        slot2_story: `FEATURE / BENEFIT STORY — Visual breakdown of key selling points or product details. Editorial panel layout with close-up detail shots. Clean infographic-style arrangement showing quality and craftsmanship.`,
        slot3_lifestyle: `LIFESTYLE IN CONTEXT — Person using/experiencing the product or service in an aspirational real-world setting. Natural lighting, genuine emotion, storytelling composition. Shows the product fitting into an ideal life.`,
        slot4_universe: `BRAND WORLD COMPOSITION — Curated editorial arrangement of brand elements, products, and lifestyle props. Cohesive color palette, professional styling. The image tells the complete brand story at a glance.`,
    },
    photographyStyles: [
        'Professional commercial photography',
        'Lifestyle editorial',
        'Product detail photography',
        'Brand campaign photography',
        'Environmental portrait',
        'Editorial flat lay',
    ],
    colorPalettes: {
        'premium-neutral': 'charcoal, cream, warm grey, gold accent',
        'modern-clean': 'white, soft blue, light grey, warm wood',
        'bold-energy': 'black, vibrant brand accent, white, dark grey',
        'warm-approachable': 'warm cream, terracotta, soft green, natural wood',
    },
    sceneVocabulary: {
        surfaces: ['clean minimal surface', 'neutral background', 'styled desk', 'natural setting', 'premium material surface'],
        props: ['product-relevant items', 'lifestyle accessories', 'branded elements', 'fresh natural elements'],
        atmospherics: ['soft natural light', 'professional studio lighting', 'golden hour warmth', 'clean shadow patterns'],
        materials: ['premium packaging', 'natural textures', 'clean modern finishes', 'quality material surfaces'],
    },
    qualityBoosters: [
        'professional commercial photography',
        'premium brand campaign quality',
        '8k ultra-sharp detail',
        'editorial lighting',
        'award-winning product photography',
        'clean modern aesthetic',
        'aspirational premium mood',
    ],
    negativeElements: [
        'amateur snapshot', 'flat lighting', 'cluttered background',
        'cheap stock photo feel', 'blurry detail', 'oversaturated colors',
    ],
    premiumMandates: [
        'PROFESSIONAL QUALITY — every image should look like a paid campaign, not user-generated content',
        'INTENTIONAL LIGHTING — directional, mood-appropriate, never flat or harsh',
        'CLEAN COMPOSITION — clear focal point, balanced framing, purposeful negative space',
        'MATERIAL QUALITY — show texture and finish quality of products/environment',
        'EMOTIONAL RESONANCE — the image must evoke the desired feeling within 1 second',
        'BRAND CONSISTENCY — colors, mood, and quality should feel cohesive across all 4 creatives',
    ],
    exampleImageIntent: 'Premium product elegantly placed on clean neutral surface with soft directional side-lighting creating gentle shadows. Tasteful styling with minimal complementary props. Warm neutral color palette with subtle brand accent. Eye-level commercial photography, shallow depth of field. Professional clean modern aesthetic.',
};

// ============================================
// REGISTRY & MATCHER
// ============================================

const ALL_ARCHETYPES: IndustryArchetype[] = [
    FRAGRANCE,
    FASHION_SPORTSWEAR,
    BEAUTY_SKINCARE,
    FOOD_RESTAURANT,
    TECH_SAAS,
    REAL_ESTATE,
    FITNESS_WELLNESS,
    JEWELRY_ACCESSORIES,
    AUTOMOTIVE,
    HOME_INTERIOR,
    EDUCATION_COURSES,
];

/**
 * Match the detected industry string to an archetype.
 * Uses keyword matching against the industry + productType strings.
 * Falls back to GENERAL if no match.
 */
export function getIndustryArchetype(industry?: string, productType?: string): IndustryArchetype {
    if (!industry && !productType) return GENERAL;

    const searchText = `${industry || ''} ${productType || ''}`.toLowerCase();

    // Score each archetype by keyword matches
    let bestMatch: IndustryArchetype | null = null;
    let bestScore = 0;

    for (const archetype of ALL_ARCHETYPES) {
        let score = 0;
        for (const keyword of archetype.keywords) {
            if (searchText.includes(keyword.toLowerCase())) {
                score += keyword.length; // Longer keyword matches score higher
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = archetype;
        }
    }

    return bestMatch || GENERAL;
}

/**
 * Get formatted creative archetypes string for Layer 3 system prompt injection.
 */
export function getCreativeArchetypesPrompt(archetype: IndustryArchetype): string {
    return `INDUSTRY-SPECIFIC CREATIVE ARCHETYPES (${archetype.label}):

- Creative 1: HERO SHOWCASE
  ${archetype.creativeArchetypes.slot1_hero}

- Creative 2: STORY / DETAILS
  ${archetype.creativeArchetypes.slot2_story}

- Creative 3: LIFESTYLE ASPIRATION
  ${archetype.creativeArchetypes.slot3_lifestyle}

- Creative 4: BRAND UNIVERSE
  ${archetype.creativeArchetypes.slot4_universe}`;
}

/**
 * Get formatted scene vocabulary for Layer 4 prompt injection.
 */
export function getSceneVocabularyPrompt(archetype: IndustryArchetype): string {
    return `INDUSTRY SCENE VOCABULARY (${archetype.label}):
Surfaces: ${archetype.sceneVocabulary.surfaces.join(', ')}
Props: ${archetype.sceneVocabulary.props.join(', ')}
Atmospheric Effects: ${archetype.sceneVocabulary.atmospherics.join(', ')}
Material Textures: ${archetype.sceneVocabulary.materials.join(', ')}`;
}

/**
 * Get formatted premium mandates for prompt injection.
 */
export function getPremiumMandatesPrompt(archetype: IndustryArchetype): string {
    return archetype.premiumMandates.map((m, i) => `${i + 1}. ${m}`).join('\n');
}

/**
 * Get formatted photography styles.
 */
export function getPhotographyStylesPrompt(archetype: IndustryArchetype): string {
    return archetype.photographyStyles.map(s => `- ${s}`).join('\n');
}

/**
 * Get formatted color palettes.
 */
export function getColorPalettesPrompt(archetype: IndustryArchetype): string {
    return Object.entries(archetype.colorPalettes)
        .map(([name, colors]) => `- ${name}: ${colors}`)
        .join('\n');
}

/**
 * Get formatted quality boosters for Layer 4.
 */
export function getQualityBoostersPrompt(archetype: IndustryArchetype): string {
    return archetype.qualityBoosters.map(b => `- "${b}"`).join('\n');
}

/**
 * Get formatted negative elements for Layer 4.
 */
export function getNegativeElementsPrompt(archetype: IndustryArchetype): string {
    return archetype.negativeElements.join(', ');
}
