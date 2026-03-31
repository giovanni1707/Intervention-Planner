/**
 * DOM Helpers JS - Conditions Module
 * Conditional rendering and state-based updates
 * Requires: Core module
 * @version 2.9.0
 * @license MIT
 */

import './01_core/01_dh-core.js';
import './04_conditions/01_dh-conditional-rendering.js';
import './04_conditions/02_dh-conditions-default.js';
import './04_conditions/03_dh-conditions-collection-extension.js';
import './04_conditions/04_dh-conditions-apply-index-support.js';
import './04_conditions/05_dh-conditions-global-shortcut.js';
import './04_conditions/06_dh-matchers-handlers-shortcut.js';
import './04_conditions/07_dh-conditions-array-support.js';
import './04_conditions/08_dh-conditions-batch-states.js';
import './04_conditions/09_dh-conditions-cleanup-fix.js';

// Export global APIs
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};
export const createElement = typeof window !== 'undefined' ? window.createElement : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
