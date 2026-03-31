/**
 * DOM Helpers JS - Native Enhance Module Only (No Core)
 * Patches document.getElementById, getElementsByClassName/TagName/Name,
 * document.querySelector and document.querySelectorAll to use the DOM Helpers
 * enhancement pipeline.
 * Requires: Core module (and Enhancers) to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './06_native-enhance/01_dh-getbyid-enhance.js';
import './06_native-enhance/02_dh-getElementsBy-enhance.js';
import './06_native-enhance/03_dh-document-query-enhance.js';

// Export global APIs (should already exist from core)
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
