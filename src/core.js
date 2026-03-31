/**
 * DOM Helpers JS - Core Module Only
 * Elements, Collections, Selector, createElement
 * @version 2.9.0
 * @license MIT
 */

import './01_core/01_dh-core.js';

// Export global APIs
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};
export const createElement = typeof window !== 'undefined' ? window.createElement : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
