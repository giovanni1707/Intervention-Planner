/**
 * DOM Helpers JS - Form Module Only (No Core)
 * Non-reactive form handling: Forms proxy, validation, serialize, submitData,
 * enhanced submission pipeline, ARIA states, button management.
 * Requires: Core module to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './07_dom-form/01_dh-form.js';
import './07_dom-form/02_dh-form-enhance.js';

// Export global APIs (should already exist from core)
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Forms      = typeof window !== 'undefined' ? window.Forms      : {};

export default typeof window !== 'undefined' ? window.Forms : {};
