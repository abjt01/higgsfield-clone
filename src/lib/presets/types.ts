export type PresetGroup = 'camera' | 'style'

/**
 * Motion described declaratively so the canvas/MediaRecorder renderer can
 * actually perform the move later. Defined now because retrofitting motion
 * onto 40 presets after the grid exists is a rewrite.
 */
export interface Motion {
  kind: 'zoom' | 'pan' | 'orbit' | 'crane' | 'handheld' | 'roll' | 'static'
  /** Start and end scale. 1 = fit. */
  scale: [number, number]
  /** Start and end centre offset as a fraction of the frame, x and y. */
  offset?: [[number, number], [number, number]]
  /** Start and end rotation in degrees. */
  rotate?: [number, number]
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInExpo' | 'easeOutExpo'
  /** Seconds. */
  duration: number
  /** Adds positional jitter for handheld-style moves. */
  shake?: number
}

export interface Preset {
  id: string
  label: string
  group: PresetGroup
  /** Sub-grouping used for the filter chips above the grid. */
  family: string
  description: string
  /**
   * Real prompt scaffolding. Appended to the user's subject, it is what makes
   * the preset change the image rather than just tagging a label onto it.
   */
  scaffold: string
  /** Terms pushed away from the image where the provider supports it. */
  negative?: string
  motion?: Motion
  /** Extra search terms beyond label and description. */
  keywords?: string[]
}
