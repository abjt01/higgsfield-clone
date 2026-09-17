import type { Preset } from './types'

/**
 * Camera moves. Each scaffold describes lens, framing and the physical motion
 * of the camera, because that is what actually changes the generated frame.
 * Every entry also carries the motion the renderer performs on the still.
 */
export const CAMERA_PRESETS: Preset[] = [
  // ---------------------------------------------------------------- zoom
  {
    id: 'crash-zoom-in',
    label: 'Crash Zoom In',
    group: 'camera',
    family: 'Zoom',
    description: 'Violent snap toward the subject',
    scaffold:
      'captured mid crash zoom, the lens punching hard and fast into the subject, extreme rapid focal length change, radial motion blur streaking from the frame edges toward the centre, subject locked dead centre and rushing at the viewer, aggressive kinetic energy',
    motion: { kind: 'zoom', scale: [1, 1.95], easing: 'easeInExpo', duration: 2.2 },
    keywords: ['snap', 'punch in', 'fast'],
  },
  {
    id: 'crash-zoom-out',
    label: 'Crash Zoom Out',
    group: 'camera',
    family: 'Zoom',
    description: 'Violent snap away, revealing scale',
    scaffold:
      'captured mid crash zoom out, the lens ripping backward away from the subject, the world opening up violently around it, radial blur pulling inward, sudden reveal of the surrounding environment and its scale',
    motion: { kind: 'zoom', scale: [1.95, 1], easing: 'easeOutExpo', duration: 2.2 },
    keywords: ['snap out', 'reveal'],
  },
  {
    id: 'slow-zoom-in',
    label: 'Slow Zoom In',
    group: 'camera',
    family: 'Zoom',
    description: 'Creeping, patient push',
    scaffold:
      'a slow deliberate zoom creeping toward the subject, almost imperceptible movement, mounting tension, perfectly steady framing, long lens compression flattening the background',
    motion: { kind: 'zoom', scale: [1, 1.28], easing: 'easeInOut', duration: 4 },
    keywords: ['creep', 'tension', 'slow push'],
  },
  {
    id: 'slow-zoom-out',
    label: 'Slow Zoom Out',
    group: 'camera',
    family: 'Zoom',
    description: 'Patient widening reveal',
    scaffold:
      'a slow patient zoom out, the frame gradually widening to reveal context around the subject, contemplative pacing, steady tripod-locked horizon',
    motion: { kind: 'zoom', scale: [1.28, 1], easing: 'easeInOut', duration: 4 },
    keywords: ['widen', 'reveal', 'pull back'],
  },
  {
    id: 'dolly-zoom',
    label: 'Dolly Zoom',
    group: 'camera',
    family: 'Zoom',
    description: 'Vertigo effect, background warps',
    scaffold:
      'the vertigo dolly zoom effect, camera tracking backward while the lens zooms in, subject held at a constant size while the background stretches and warps unnervingly behind them, distorted perspective, disorienting depth compression',
    motion: { kind: 'zoom', scale: [1.5, 1.05], easing: 'easeInOut', duration: 3.2 },
    keywords: ['vertigo', 'contra zoom', 'hitchcock'],
  },
  {
    id: 'snap-zoom',
    label: 'Snap Zoom',
    group: 'camera',
    family: 'Zoom',
    description: 'Abrupt single-beat punch',
    scaffold:
      'an abrupt snap zoom landing hard on the subject, single decisive beat, slight overshoot and settle, documentary urgency, handheld imperfection at the moment of impact',
    motion: { kind: 'zoom', scale: [1, 1.5], easing: 'easeInExpo', duration: 1.2, shake: 0.004 },
    keywords: ['punch', 'abrupt'],
  },
  {
    id: 'super-dolly-in',
    label: 'Super Dolly In',
    group: 'camera',
    family: 'Zoom',
    description: 'Relentless straight-line push',
    scaffold:
      'a relentless super dolly pushing dead straight into the subject along a perfectly level axis, no deviation, hypnotic forward motion, symmetrical one-point perspective converging at the centre of frame',
    motion: { kind: 'zoom', scale: [1, 1.65], easing: 'linear', duration: 3 },
    keywords: ['straight', 'symmetrical', 'hypnotic'],
  },

  // ------------------------------------------------------------- dolly
  {
    id: 'dolly-in',
    label: 'Dolly In',
    group: 'camera',
    family: 'Dolly',
    description: 'Camera physically advances',
    scaffold:
      'camera mounted on a dolly advancing smoothly toward the subject, real parallax between foreground and background as the camera travels, shallow depth of field, cinematic tracking',
    motion: { kind: 'zoom', scale: [1, 1.35], easing: 'easeInOut', duration: 3.2 },
    keywords: ['push in', 'track in', 'parallax'],
  },
  {
    id: 'dolly-out',
    label: 'Dolly Out',
    group: 'camera',
    family: 'Dolly',
    description: 'Camera retreats, space opens',
    scaffold:
      'camera on a dolly retreating smoothly from the subject, foreground elements sliding past the lens, the space opening out, sense of abandonment and scale',
    motion: { kind: 'zoom', scale: [1.35, 1], easing: 'easeInOut', duration: 3.2 },
    keywords: ['pull out', 'retreat'],
  },
  {
    id: 'tracking-left',
    label: 'Tracking Left',
    group: 'camera',
    family: 'Dolly',
    description: 'Lateral travel, subject held',
    scaffold:
      'a lateral tracking shot gliding left alongside the subject, camera moving parallel to the action, strong foreground parallax streaking past, subject held steady in frame',
    motion: { kind: 'pan', scale: [1.2, 1.2], offset: [[0.12, 0], [-0.12, 0]], easing: 'easeInOut', duration: 3.4 },
    keywords: ['truck left', 'lateral', 'side'],
  },
  {
    id: 'tracking-right',
    label: 'Tracking Right',
    group: 'camera',
    family: 'Dolly',
    description: 'Lateral travel, subject held',
    scaffold:
      'a lateral tracking shot gliding right alongside the subject, camera travelling parallel to the action, foreground elements whipping past the lens, subject anchored in frame',
    motion: { kind: 'pan', scale: [1.2, 1.2], offset: [[-0.12, 0], [0.12, 0]], easing: 'easeInOut', duration: 3.4 },
    keywords: ['truck right', 'lateral', 'side'],
  },
  {
    id: 'follow-behind',
    label: 'Follow Behind',
    group: 'camera',
    family: 'Dolly',
    description: 'Third-person trailing shot',
    scaffold:
      'camera trailing directly behind the subject at shoulder height, following them through the space, back of the subject filling the lower frame, the world opening ahead of them, steadicam smoothness',
    motion: { kind: 'zoom', scale: [1.1, 1.3], easing: 'easeInOut', duration: 3.6, shake: 0.002 },
    keywords: ['third person', 'trail', 'steadicam'],
  },
  {
    id: 'lead-in-front',
    label: 'Lead In Front',
    group: 'camera',
    family: 'Dolly',
    description: 'Retreating ahead of the subject',
    scaffold:
      'camera retreating ahead of the subject as they advance toward it, holding them in frame while the environment streams past on both sides, direct eyeline, confident forward energy',
    motion: { kind: 'zoom', scale: [1.3, 1.08], easing: 'easeInOut', duration: 3.4, shake: 0.002 },
    keywords: ['walk and talk', 'retreat', 'facing'],
  },

  // -------------------------------------------------------------- crane
  {
    id: 'crane-up',
    label: 'Crane Up',
    group: 'camera',
    family: 'Crane',
    description: 'Rises, revealing the vista',
    scaffold:
      'camera craning upward from ground level, rising steadily above the subject to reveal the wider landscape beyond, grand vertical reveal, epic scale, horizon dropping away below',
    motion: { kind: 'crane', scale: [1.3, 1.05], offset: [[0, 0.16], [0, -0.1]], easing: 'easeInOut', duration: 4 },
    keywords: ['jib up', 'boom up', 'rise'],
  },
  {
    id: 'crane-down',
    label: 'Crane Down',
    group: 'camera',
    family: 'Crane',
    description: 'Descends into the scene',
    scaffold:
      'camera craning down from high above, descending into the scene toward the subject, the world rising around the frame, intimate arrival after an establishing height',
    motion: { kind: 'crane', scale: [1.05, 1.3], offset: [[0, -0.1], [0, 0.16]], easing: 'easeInOut', duration: 4 },
    keywords: ['jib down', 'boom down', 'descend'],
  },
  {
    id: 'jib-reveal',
    label: 'Jib Reveal',
    group: 'camera',
    family: 'Crane',
    description: 'Rises over an obstruction',
    scaffold:
      'camera rising on a jib arm over a foreground obstruction, cresting it to reveal the subject and the scene hidden behind, dramatic unveiling, layered foreground and background depth',
    motion: { kind: 'crane', scale: [1.35, 1.1], offset: [[0, 0.2], [0, -0.04]], easing: 'easeOut', duration: 3.8 },
    keywords: ['reveal', 'crest', 'over'],
  },
  {
    id: 'pedestal-up',
    label: 'Pedestal Up',
    group: 'camera',
    family: 'Crane',
    description: 'Straight vertical rise',
    scaffold:
      'camera pedestalling straight up on a fixed vertical axis, no tilt, the frame sliding upward across the subject from feet to face, formal and controlled',
    motion: { kind: 'crane', scale: [1.2, 1.2], offset: [[0, 0.18], [0, -0.18]], easing: 'easeInOut', duration: 3.4 },
    keywords: ['vertical', 'rise', 'boom'],
  },

  // -------------------------------------------------------------- orbit
  {
    id: 'orbit-left',
    label: 'Orbit Left',
    group: 'camera',
    family: 'Orbit',
    description: 'Arcs around counter-clockwise',
    scaffold:
      'camera arcing counter-clockwise around the subject on a perfect circular path, background sweeping past behind them, subject held centred and sharp, continuous orbital motion',
    motion: { kind: 'orbit', scale: [1.25, 1.25], offset: [[0.14, 0.03], [-0.14, -0.03]], rotate: [2.5, -2.5], easing: 'easeInOut', duration: 4 },
    keywords: ['arc', 'circle', 'around'],
  },
  {
    id: 'orbit-right',
    label: 'Orbit Right',
    group: 'camera',
    family: 'Orbit',
    description: 'Arcs around clockwise',
    scaffold:
      'camera arcing clockwise around the subject on a smooth circular track, environment rotating behind them, subject locked in the centre of frame, elegant orbital sweep',
    motion: { kind: 'orbit', scale: [1.25, 1.25], offset: [[-0.14, -0.03], [0.14, 0.03]], rotate: [-2.5, 2.5], easing: 'easeInOut', duration: 4 },
    keywords: ['arc', 'circle', 'around'],
  },
  {
    id: 'full-360-orbit',
    label: '360 Orbit',
    group: 'camera',
    family: 'Orbit',
    description: 'Complete revolution',
    scaffold:
      'a full 360 degree orbit around the subject, complete revolution revealing every side, the background cycling entirely through the frame, hero product cinematography, flawless centring',
    motion: { kind: 'orbit', scale: [1.3, 1.3], offset: [[0.16, 0], [-0.16, 0]], rotate: [4, -4], easing: 'linear', duration: 5 },
    keywords: ['revolve', 'turntable', 'product'],
  },
  {
    id: 'arc-shot',
    label: 'Arc Shot',
    group: 'camera',
    family: 'Orbit',
    description: 'Half-circle sweep',
    scaffold:
      'a sweeping arc shot curving around the subject through roughly ninety degrees, dynamic parallax between subject and background, sense of the camera discovering the scene',
    motion: { kind: 'orbit', scale: [1.2, 1.28], offset: [[0.1, 0.04], [-0.1, -0.02]], rotate: [1.5, -1.5], easing: 'easeInOut', duration: 3.6 },
    keywords: ['curve', 'sweep'],
  },
  {
    id: 'bullet-time',
    label: 'Bullet Time',
    group: 'camera',
    family: 'Orbit',
    description: 'Frozen moment, camera flies',
    scaffold:
      'bullet time, the subject frozen mid-action while the camera sweeps around them at speed, time suspended, debris and droplets hanging motionless in the air, dramatic rim lighting picking out the silhouette',
    motion: { kind: 'orbit', scale: [1.35, 1.35], offset: [[0.18, 0.02], [-0.18, -0.02]], rotate: [6, -6], easing: 'easeInOut', duration: 4.2 },
    keywords: ['frozen', 'time stop', 'matrix', 'slow motion'],
  },

  // ------------------------------------------------------------- aerial
  {
    id: 'drone-fly-over',
    label: 'Drone Fly Over',
    group: 'camera',
    family: 'Aerial',
    description: 'Passes overhead at altitude',
    scaffold:
      'aerial drone shot flying over the scene at altitude, the landscape unrolling beneath the camera, vast scale, crisp atmospheric haze toward the horizon, smooth gimbal stabilisation',
    motion: { kind: 'crane', scale: [1.25, 1.1], offset: [[0, 0.14], [0, -0.14]], easing: 'linear', duration: 4.4 },
    keywords: ['aerial', 'flyover', 'uav'],
  },
  {
    id: 'drone-pull-back',
    label: 'Drone Pull Back',
    group: 'camera',
    family: 'Aerial',
    description: 'Rises and retreats, epic reveal',
    scaffold:
      'drone pulling back and climbing simultaneously, the subject shrinking into an immense landscape, epic establishing reveal, dramatic sense of isolation and scale',
    motion: { kind: 'crane', scale: [1.7, 1], offset: [[0, 0.08], [0, -0.12]], easing: 'easeOut', duration: 4.6 },
    keywords: ['reveal', 'establishing', 'epic'],
  },
  {
    id: 'birds-eye',
    label: "Bird's Eye",
    group: 'camera',
    family: 'Aerial',
    description: 'High angle looking down',
    scaffold:
      'a high bird’s eye view looking down over the scene at a steep angle, subject small within a graphic composition of the ground plane, strong geometric patterning below',
    motion: { kind: 'zoom', scale: [1.1, 1.3], easing: 'easeInOut', duration: 3.6 },
    keywords: ['high angle', 'above', 'overhead'],
  },
  {
    id: 'top-down',
    label: 'Top Down',
    group: 'camera',
    family: 'Aerial',
    description: 'Straight down, 90 degrees',
    scaffold:
      'a perfectly perpendicular top down shot looking straight down at ninety degrees, flat graphic composition, subject centred against the ground plane, strong symmetry and negative space',
    motion: { kind: 'zoom', scale: [1, 1.22], easing: 'easeInOut', duration: 3.4 },
    keywords: ['overhead', 'flat lay', 'nadir', '90 degrees'],
  },
  {
    id: 'fpv-dive',
    label: 'FPV Dive',
    group: 'camera',
    family: 'Aerial',
    description: 'Racing drone plunge',
    scaffold:
      'first person view racing drone diving toward the subject at speed, wide angle lens with heavy barrel distortion, ground rushing up, extreme velocity, slight roll through the dive',
    motion: { kind: 'zoom', scale: [1, 1.8], rotate: [-4, 3], easing: 'easeInExpo', duration: 2.6, shake: 0.004 },
    keywords: ['fpv', 'dive', 'racing', 'plunge'],
  },
  {
    id: 'low-orbit-flyby',
    label: 'Low Flyby',
    group: 'camera',
    family: 'Aerial',
    description: 'Fast pass at low altitude',
    scaffold:
      'a fast low altitude flyby skimming past the subject, foreground elements blurring as they whip through the frame, strong sense of speed and proximity to the ground',
    motion: { kind: 'pan', scale: [1.35, 1.35], offset: [[0.2, 0.02], [-0.2, -0.02]], easing: 'linear', duration: 2.8, shake: 0.003 },
    keywords: ['flyby', 'fast', 'low'],
  },

  // ---------------------------------------------------------- handheld
  {
    id: 'handheld-follow',
    label: 'Handheld Follow',
    group: 'camera',
    family: 'Handheld',
    description: 'Documentary, breathing frame',
    scaffold:
      'handheld camera following the subject, natural breathing movement in the frame, slight imperfect reframing, documentary immediacy, available light, unpolished and real',
    motion: { kind: 'handheld', scale: [1.12, 1.2], easing: 'linear', duration: 3.4, shake: 0.007 },
    keywords: ['documentary', 'verite', 'natural'],
  },
  {
    id: 'shaky-cam',
    label: 'Shaky Cam',
    group: 'camera',
    family: 'Handheld',
    description: 'Chaotic, urgent, unstable',
    scaffold:
      'violently unstable shaky handheld camera, chaotic reframing, motion blur from sudden jolts, urgent frantic energy, news footage immediacy, imperfect focus',
    motion: { kind: 'handheld', scale: [1.2, 1.24], easing: 'linear', duration: 2.6, shake: 0.016 },
    keywords: ['chaos', 'unstable', 'frantic', 'news'],
  },
  {
    id: 'whip-pan-left',
    label: 'Whip Pan Left',
    group: 'camera',
    family: 'Handheld',
    description: 'Violent horizontal smear',
    scaffold:
      'a violent whip pan to the left, extreme horizontal motion blur smearing the entire frame, the scene barely resolving at the end of the movement, kinetic transition energy',
    motion: { kind: 'pan', scale: [1.3, 1.3], offset: [[0.22, 0], [-0.22, 0]], easing: 'easeInOut', duration: 1.1 },
    keywords: ['swish', 'whip', 'fast pan'],
  },
  {
    id: 'whip-pan-right',
    label: 'Whip Pan Right',
    group: 'camera',
    family: 'Handheld',
    description: 'Violent horizontal smear',
    scaffold:
      'a violent whip pan to the right, extreme horizontal streaking blur across the frame, scene snapping into clarity as the movement halts, high energy transition',
    motion: { kind: 'pan', scale: [1.3, 1.3], offset: [[-0.22, 0], [0.22, 0]], easing: 'easeInOut', duration: 1.1 },
    keywords: ['swish', 'whip', 'fast pan'],
  },
  {
    id: 'snorricam',
    label: 'Snorricam',
    group: 'camera',
    family: 'Handheld',
    description: 'Rig-mounted, world spins',
    scaffold:
      'snorricam shot with the camera rigged to the subject’s body, subject locked perfectly still and centred in frame while the entire world lurches and spins chaotically behind them, deeply disorienting',
    motion: { kind: 'roll', scale: [1.25, 1.25], rotate: [-7, 7], easing: 'easeInOut', duration: 3.2, shake: 0.006 },
    keywords: ['body mount', 'disorienting', 'rig'],
  },

  // --------------------------------------------------------- framing
  {
    id: 'dutch-angle',
    label: 'Dutch Angle',
    group: 'camera',
    family: 'Framing',
    description: 'Tilted horizon, unease',
    scaffold:
      'a pronounced dutch angle with the horizon canted hard off level, unsettling diagonal composition, psychological unease, strong directional shadows reinforcing the tilt',
    motion: { kind: 'roll', scale: [1.2, 1.24], rotate: [-9, -12], easing: 'easeInOut', duration: 3 },
    keywords: ['canted', 'tilted', 'oblique', 'unease'],
  },
  {
    id: 'tilt-up',
    label: 'Tilt Up',
    group: 'camera',
    family: 'Framing',
    description: 'Pivots upward, reveals height',
    scaffold:
      'camera tilting upward from a fixed position, revealing the full height of the subject from base to top, towering perspective, converging vertical lines, imposing scale',
    motion: { kind: 'pan', scale: [1.25, 1.25], offset: [[0, 0.18], [0, -0.18]], easing: 'easeInOut', duration: 3.2 },
    keywords: ['pivot up', 'reveal height'],
  },
  {
    id: 'tilt-down',
    label: 'Tilt Down',
    group: 'camera',
    family: 'Framing',
    description: 'Pivots downward',
    scaffold:
      'camera tilting downward from a fixed position, the frame travelling from sky to ground, gradual reveal of what lies below, deliberate and controlled',
    motion: { kind: 'pan', scale: [1.25, 1.25], offset: [[0, -0.18], [0, 0.18]], easing: 'easeInOut', duration: 3.2 },
    keywords: ['pivot down'],
  },
  {
    id: 'pan-left',
    label: 'Pan Left',
    group: 'camera',
    family: 'Framing',
    description: 'Horizontal pivot, steady',
    scaffold:
      'a smooth controlled pan to the left from a locked tripod, the scene sliding steadily through the frame, even pacing, stable horizon throughout',
    motion: { kind: 'pan', scale: [1.22, 1.22], offset: [[0.16, 0], [-0.16, 0]], easing: 'easeInOut', duration: 3.6 },
    keywords: ['sweep left'],
  },
  {
    id: 'pan-right',
    label: 'Pan Right',
    group: 'camera',
    family: 'Framing',
    description: 'Horizontal pivot, steady',
    scaffold:
      'a smooth controlled pan to the right from a locked tripod, scene gliding evenly across the frame, measured pacing, rock-steady horizon',
    motion: { kind: 'pan', scale: [1.22, 1.22], offset: [[-0.16, 0], [0.16, 0]], easing: 'easeInOut', duration: 3.6 },
    keywords: ['sweep right'],
  },
  {
    id: 'low-angle-hero',
    label: 'Low Angle Hero',
    group: 'camera',
    family: 'Framing',
    description: 'Looking up, subject dominates',
    scaffold:
      'a dramatic low angle looking sharply up at the subject, camera near ground level, subject towering over the lens and dominating the sky behind them, heroic and powerful, strong upward convergence',
    motion: { kind: 'zoom', scale: [1.08, 1.32], easing: 'easeInOut', duration: 3.2 },
    keywords: ['worm eye', 'heroic', 'up at', 'powerful'],
  },
  {
    id: 'over-the-shoulder',
    label: 'Over The Shoulder',
    group: 'camera',
    family: 'Framing',
    description: 'Framed past a foreground figure',
    scaffold:
      'an over the shoulder framing, a soft out of focus figure occupying the near corner of the frame, the subject sharp beyond them, layered depth, classic conversational coverage',
    motion: { kind: 'zoom', scale: [1.1, 1.26], easing: 'easeInOut', duration: 3.2 },
    keywords: ['ots', 'conversation', 'foreground'],
  },
  {
    id: 'extreme-close-up',
    label: 'Extreme Close Up',
    group: 'camera',
    family: 'Framing',
    description: 'Detail fills the frame',
    scaffold:
      'an extreme close up, a single detail filling the entire frame, razor thin depth of field, macro intimacy, every texture and imperfection rendered in fine detail',
    motion: { kind: 'zoom', scale: [1.15, 1.42], easing: 'easeInOut', duration: 3.4 },
    keywords: ['ecu', 'macro', 'detail', 'tight'],
  },
  {
    id: 'wide-establishing',
    label: 'Wide Establishing',
    group: 'camera',
    family: 'Framing',
    description: 'Full context, subject small',
    scaffold:
      'a wide establishing shot placing the subject small within the full environment, deep focus holding everything sharp from foreground to horizon, clear geography of the space',
    motion: { kind: 'zoom', scale: [1.18, 1.02], easing: 'easeInOut', duration: 4 },
    keywords: ['establishing', 'wide', 'context', 'landscape'],
  },
  {
    id: 'rack-focus',
    label: 'Rack Focus',
    group: 'camera',
    family: 'Framing',
    description: 'Attention shifts through depth',
    scaffold:
      'a rack focus pulling attention from the foreground to the subject behind, shallow depth of field with creamy circular bokeh, the moment of transfer caught mid-pull',
    motion: { kind: 'static', scale: [1.12, 1.18], easing: 'easeInOut', duration: 2.8 },
    keywords: ['focus pull', 'bokeh', 'depth'],
  },
  {
    id: 'static-lockoff',
    label: 'Static Lock-Off',
    group: 'camera',
    family: 'Framing',
    description: 'Perfectly still, composed',
    scaffold:
      'a perfectly static locked-off tripod shot, absolutely no camera movement, meticulously composed symmetrical framing, every element deliberately placed, stillness as a statement',
    motion: { kind: 'static', scale: [1, 1], easing: 'linear', duration: 3 },
    keywords: ['locked', 'tripod', 'still', 'symmetry'],
  },
]
