import type { Preset } from './types'

/**
 * Visual styles. Scaffolds name concrete media, optics and process rather than
 * living artists or studios, both to stay clean and because film stock, lens
 * and lighting language moves an image far more than a name does.
 */
export const STYLE_PRESETS: Preset[] = [
  // ------------------------------------------------------------ cinematic
  {
    id: 'cinematic',
    label: 'Cinematic',
    group: 'style',
    family: 'Cinematic',
    description: 'Anamorphic, teal and orange',
    scaffold:
      'cinematic film still, anamorphic lens with oval bokeh and horizontal flares, teal and orange colour grade, deep contrast with lifted filmic blacks, shallow depth of field, shot on large format digital cinema camera',
    negative: 'flat lighting, snapshot, oversaturated',
    keywords: ['movie', 'film', 'anamorphic', 'blockbuster'],
  },
  {
    id: 'film-noir',
    label: 'Film Noir',
    group: 'style',
    family: 'Cinematic',
    description: 'Hard shadows, venetian light',
    scaffold:
      'black and white film noir, extreme chiaroscuro lighting, hard single key light carving deep shadows, venetian blind shadow patterns across the scene, cigarette haze in the air, high contrast monochrome, 1940s detective mood',
    negative: 'colour, soft even lighting',
    keywords: ['noir', 'black and white', 'monochrome', 'detective', 'shadows'],
  },
  {
    id: 'neon-noir',
    label: 'Neon Noir',
    group: 'style',
    family: 'Cinematic',
    description: 'Rain, neon, wet asphalt',
    scaffold:
      'neon noir, rain-slicked streets mirroring saturated magenta and cyan signage, volumetric light shafts cutting through drizzle and steam, deep blacks, moody nocturnal palette, reflective wet asphalt',
    keywords: ['neon', 'rain', 'night', 'blade runner', 'moody'],
  },
  {
    id: 'blockbuster-epic',
    label: 'Blockbuster Epic',
    group: 'style',
    family: 'Cinematic',
    description: 'Huge scale, dramatic sky',
    scaffold:
      'epic blockbuster cinematography, enormous sense of scale, dramatic god rays breaking through storm clouds, sweeping vista, heroic composition, rich colour grade, IMAX-grade clarity and detail',
    keywords: ['epic', 'grand', 'scale', 'dramatic'],
  },
  {
    id: 'horror',
    label: 'Horror',
    group: 'style',
    family: 'Cinematic',
    description: 'Dread, underlit, desaturated',
    scaffold:
      'horror cinematography, sickly desaturated palette pushed toward green, harsh underlighting from below, oppressive darkness crowding the edges of frame, unsettling negative space, grain and imperfection',
    keywords: ['scary', 'dread', 'dark', 'creepy'],
  },

  // ---------------------------------------------------------- photographic
  {
    id: '35mm-film',
    label: '35mm Film',
    group: 'style',
    family: 'Photographic',
    description: 'Halation, organic grain',
    scaffold:
      'shot on 35mm colour negative film, visible organic grain structure, gentle halation blooming around highlights, soft natural colour rendition, slight gate weave, analogue imperfection',
    keywords: ['analog', 'analogue', 'grain', 'kodak', 'celluloid'],
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    group: 'style',
    family: 'Photographic',
    description: 'Instant film, faded, square',
    scaffold:
      'instant polaroid photograph, washed out faded colours with a warm yellow cast, soft low contrast, slight vignetting at the corners, chemical blooming and streaking, nostalgic snapshot intimacy',
    keywords: ['instant', 'vintage', 'snapshot', 'retro'],
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    group: 'style',
    family: 'Photographic',
    description: 'Low warm sun, long shadows',
    scaffold:
      'golden hour photography, low warm sun raking across the scene, long soft shadows stretching across the ground, amber rim light haloing the subject, atmospheric haze catching the light, glowing highlights',
    keywords: ['sunset', 'warm', 'magic hour', 'sunrise'],
  },
  {
    id: 'blue-hour',
    label: 'Blue Hour',
    group: 'style',
    family: 'Photographic',
    description: 'Post-sunset, cool ambient',
    scaffold:
      'blue hour photography just after sunset, deep cool ambient blue light, artificial warm practical lights beginning to glow against it, tranquil balance of cold and warm, smooth gradient sky',
    keywords: ['twilight', 'dusk', 'cool', 'evening'],
  },
  {
    id: 'high-fashion',
    label: 'High Fashion',
    group: 'style',
    family: 'Photographic',
    description: 'Editorial, sculpted light',
    scaffold:
      'high fashion editorial photography, sculpted beauty lighting with a large softbox and precise fill, immaculate styling, confident posing, clean seamless backdrop, magazine cover polish, medium format clarity',
    keywords: ['editorial', 'vogue', 'model', 'magazine', 'beauty'],
  },
  {
    id: 'product-studio',
    label: 'Product Studio',
    group: 'style',
    family: 'Photographic',
    description: 'Seamless sweep, controlled',
    scaffold:
      'professional product photography on a seamless studio sweep, controlled three point lighting with crisp gradient falloff, pristine reflections, tack sharp focus throughout, commercial catalogue quality',
    keywords: ['product', 'commercial', 'studio', 'ecommerce', 'packshot'],
  },
  {
    id: 'documentary',
    label: 'Documentary',
    group: 'style',
    family: 'Photographic',
    description: 'Available light, unposed',
    scaffold:
      'documentary photojournalism, available light only, unposed candid moment caught as it happens, honest unflattering realism, slight grain, reportage framing',
    keywords: ['photojournalism', 'candid', 'reportage', 'real'],
  },
  {
    id: 'long-exposure',
    label: 'Long Exposure',
    group: 'style',
    family: 'Photographic',
    description: 'Motion smeared into light',
    scaffold:
      'long exposure photograph, moving elements smeared into smooth continuous light trails, static elements rendered razor sharp, silky flowing water and cloud, tripod stability, dreamlike time compression',
    keywords: ['light trails', 'slow shutter', 'motion blur'],
  },
  {
    id: 'tilt-shift',
    label: 'Tilt Shift',
    group: 'style',
    family: 'Photographic',
    description: 'Miniature faking',
    scaffold:
      'tilt shift photography, an extremely narrow band of focus with heavy blur above and below, exaggerated saturation, the whole scene reading as a tiny handcrafted miniature model',
    keywords: ['miniature', 'model', 'diorama', 'toy'],
  },
  {
    id: 'infrared',
    label: 'Infrared',
    group: 'style',
    family: 'Photographic',
    description: 'False colour, white foliage',
    scaffold:
      'infrared photography, foliage rendered in glowing white and pale pink, skies dropping to deep dramatic near-black, surreal false colour palette, otherworldly tonal inversion',
    keywords: ['ir', 'false colour', 'surreal'],
  },
  {
    id: 'double-exposure',
    label: 'Double Exposure',
    group: 'style',
    family: 'Photographic',
    description: 'Two frames blended',
    scaffold:
      'double exposure photograph, two images blended through one another, the silhouette of the subject filled with a second overlapping scene, ghostly translucent layering, high contrast edges',
    keywords: ['multiple exposure', 'blend', 'ghost', 'overlay'],
  },

  // ------------------------------------------------------------ illustrated
  {
    id: 'anime',
    label: 'Anime',
    group: 'style',
    family: 'Illustrated',
    description: 'Cel shaded, expressive',
    scaffold:
      'anime illustration, clean confident linework, flat cel shading with hard-edged shadow shapes, expressive oversized eyes, vivid saturated palette, detailed painted background with soft gradients',
    keywords: ['manga', 'cel', 'japanese', 'animation'],
  },
  {
    id: 'hand-painted-anime',
    label: 'Painted Anime',
    group: 'style',
    family: 'Illustrated',
    description: 'Lush painterly backgrounds',
    scaffold:
      'hand painted animation background, lush naturalistic scenery rendered in gouache, soft billowing clouds, warm nostalgic palette, gentle rim light through leaves, visible brush texture',
    keywords: ['ghibli', 'painted', 'gouache', 'whimsical'],
  },
  {
    id: 'comic-book',
    label: 'Comic Book',
    group: 'style',
    family: 'Illustrated',
    description: 'Ink, halftone, bold panels',
    scaffold:
      'comic book illustration, heavy black ink outlines, bold flat colour fills, visible halftone dot texture, dynamic foreshortened action posing, dramatic speed lines radiating from the subject',
    keywords: ['comics', 'graphic novel', 'halftone', 'ink'],
  },
  {
    id: 'watercolour',
    label: 'Watercolour',
    group: 'style',
    family: 'Illustrated',
    description: 'Bleeding washes, paper grain',
    scaffold:
      'watercolour painting, translucent pigment washes bleeding softly into one another, visible cold press paper texture, delicate granulation and blooms, white paper left breathing through the highlights',
    keywords: ['aquarelle', 'painting', 'soft', 'wash'],
  },
  {
    id: 'oil-painting',
    label: 'Oil Painting',
    group: 'style',
    family: 'Illustrated',
    description: 'Impasto, rich glazes',
    scaffold:
      'classical oil painting, thick impasto strokes catching the light, rich translucent glazes building luminous depth, warm underpainting glowing through, visible canvas weave, old master chiaroscuro',
    keywords: ['classical', 'renaissance', 'painterly', 'canvas'],
  },
  {
    id: 'charcoal-sketch',
    label: 'Charcoal Sketch',
    group: 'style',
    family: 'Illustrated',
    description: 'Smudged, gestural, raw',
    scaffold:
      'charcoal sketch on toothy paper, bold gestural strokes, smudged blended shadows, sharp white highlights lifted with an eraser, raw unfinished energy at the edges of the drawing',
    keywords: ['drawing', 'graphite', 'sketch', 'monochrome'],
  },
  {
    id: 'ukiyo-e',
    label: 'Ukiyo-e',
    group: 'style',
    family: 'Illustrated',
    description: 'Woodblock, flat planes',
    scaffold:
      'traditional Japanese woodblock print, flat planes of muted natural pigment, confident black outlines, stylised wave and cloud patterning, visible wood grain and paper fibre, limited historical palette',
    keywords: ['woodblock', 'japanese', 'hokusai', 'print'],
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    group: 'style',
    family: 'Illustrated',
    description: 'Limited palette, crisp pixels',
    scaffold:
      'detailed pixel art, strictly limited indexed colour palette, crisp unfiltered pixel edges with deliberate dithering for gradients, isometric readability, 16-bit era game aesthetic',
    keywords: ['8 bit', '16 bit', 'retro game', 'sprite'],
  },
  {
    id: 'claymation',
    label: 'Claymation',
    group: 'style',
    family: 'Illustrated',
    description: 'Fingerprints in plasticine',
    scaffold:
      'stop motion claymation, handmade plasticine models with visible fingerprints and tool marks, slightly uneven surfaces, practical miniature set lighting, charming tactile imperfection',
    keywords: ['stop motion', 'plasticine', 'clay', 'handmade'],
  },
  {
    id: 'stylised-3d',
    label: 'Stylised 3D',
    group: 'style',
    family: 'Illustrated',
    description: 'Soft-round animated feature',
    scaffold:
      'stylised 3d animated feature render, soft rounded appealing forms, subsurface scattering in the skin, warm bounce light, physically based shading, immaculate global illumination, family film polish',
    keywords: ['pixar', '3d', 'cgi', 'render', 'animation'],
  },
  {
    id: 'line-art',
    label: 'Line Art',
    group: 'style',
    family: 'Illustrated',
    description: 'Pure contour, no fill',
    scaffold:
      'minimal single weight line art, pure clean contour drawing with no shading or fill, elegant economy of stroke, generous white space, confident unbroken lines',
    keywords: ['minimal', 'outline', 'contour', 'vector'],
  },

  // ------------------------------------------------------------- graphic
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    group: 'style',
    family: 'Graphic',
    description: 'Dense, holographic, high tech',
    scaffold:
      'cyberpunk aesthetic, dense vertical cityscape crusted with holographic advertising, glowing cyan and magenta signage reflecting off every wet surface, industrial decay beside gleaming high technology, perpetual night',
    keywords: ['futuristic', 'dystopia', 'neon', 'tech'],
  },
  {
    id: 'vaporwave',
    label: 'Vaporwave',
    group: 'style',
    family: 'Graphic',
    description: 'Pastel grids, chrome, VHS',
    scaffold:
      'vaporwave aesthetic, pastel pink and cyan gradients, infinite neon grid receding to a chrome sunset, glitched VHS scanlines and chromatic aberration, classical statuary out of place, nostalgic digital decay',
    keywords: ['retrowave', 'synthwave', '80s', 'aesthetic', 'glitch'],
  },
  {
    id: 'retro-futurism',
    label: 'Retro Futurism',
    group: 'style',
    family: 'Graphic',
    description: 'Yesterday’s tomorrow',
    scaffold:
      'retro futurism, the optimistic space age future as imagined in the 1960s, curved chrome and bakelite, atomic age motifs, warm printed colour palette with slight misregistration, analogue instrumentation',
    keywords: ['atomic age', 'space age', 'raygun', 'sixties'],
  },
  {
    id: 'solarpunk',
    label: 'Solarpunk',
    group: 'style',
    family: 'Graphic',
    description: 'Green tech optimism',
    scaffold:
      'solarpunk, architecture fully integrated with abundant living greenery, sunlight filtering through leaves onto clean renewable technology, warm hopeful palette, art nouveau organic curves, communal optimism',
    keywords: ['eco', 'green', 'utopia', 'sustainable'],
  },
  {
    id: 'dark-fantasy',
    label: 'Dark Fantasy',
    group: 'style',
    family: 'Graphic',
    description: 'Gothic, ornate, ominous',
    scaffold:
      'dark fantasy illustration, ornate gothic architecture swallowed by mist, muted desaturated palette pierced by a single ember of warm light, intricate armour and filigree detail, ominous towering scale',
    keywords: ['gothic', 'grimdark', 'fantasy', 'medieval'],
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    group: 'style',
    family: 'Graphic',
    description: 'Raw concrete, heavy mass',
    scaffold:
      'brutalist architecture, raw board-marked concrete with visible formwork texture, monumental geometric mass, harsh directional daylight carving deep shadow, austere monochrome palette, imposing scale',
    keywords: ['concrete', 'architecture', 'modernist', 'monolith'],
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    group: 'style',
    family: 'Graphic',
    description: 'Negative space, one accent',
    scaffold:
      'minimalist composition, vast calm negative space, a single subject placed with deliberate precision, restrained palette of two tones plus one accent, soft even light, quiet and uncluttered',
    keywords: ['simple', 'clean', 'negative space', 'zen'],
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    group: 'style',
    family: 'Graphic',
    description: 'Cyanotype technical drawing',
    scaffold:
      'technical blueprint drawing, white precision linework on deep cyanotype blue, orthographic projection with dimension lines and annotations, drafting grid, engineering schematic clarity',
    keywords: ['technical', 'schematic', 'draft', 'cad', 'patent'],
  },
  {
    id: 'risograph',
    label: 'Risograph',
    group: 'style',
    family: 'Graphic',
    description: 'Misregistered spot colour',
    scaffold:
      'risograph print, two or three spot colours overprinting with visible misregistration, coarse grainy ink texture, bold fluorescent pink and blue, flat poster reduction of form, visible paper stock',
    keywords: ['print', 'zine', 'screenprint', 'poster'],
  },
  {
    id: 'low-poly',
    label: 'Low Poly',
    group: 'style',
    family: 'Graphic',
    description: 'Faceted geometric planes',
    scaffold:
      'low poly 3d render, faceted triangular geometry with flat shaded planes, crisp visible edges between facets, limited pastel palette, clean studio lighting, geometric abstraction of form',
    keywords: ['polygon', 'faceted', 'geometric', 'lowpoly'],
  },
]
