/**
 * DOM Helpers JS - Animation Module Only (No Core)
 * fadeIn, fadeOut, slideUp, slideDown, slideToggle, transform, animation chains.
 * Requires: Core module to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './08_animation/01_dh-animation.js';

// Export global APIs (should already exist from core)
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Animation  = typeof window !== 'undefined' ? window.Animation  : {};

export default typeof window !== 'undefined' ? window.Animation : {};
