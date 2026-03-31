/**
 * DOM Helpers JS - Enhancers Module Only (No Core)
 * Bulk updates, shortcuts, indexed updates
 * Requires: Core module to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './02_enhancers/01_dh-bulk-property-updaters.js';
import './02_enhancers/02_dh-collection-shortcuts.js';
import './02_enhancers/03_dh-global-query.js';
import './02_enhancers/04_dh-indexed-collection-updates.js';
import './02_enhancers/05_dh-index-selection.js';
import './02_enhancers/06_dh-global-collection-indexed-updates.js';
import './02_enhancers/07_dh-bulk-properties-updater-global-query.js';
import './02_enhancers/08_dh-selector-update-patch.js';
import './02_enhancers/09_dh-idShortcut.js';
import './02_enhancers/10_dh-array-based-updates.js';

// Export global APIs (should already exist from core)
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
