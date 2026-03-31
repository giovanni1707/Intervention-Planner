/**
 * DOM Helpers JS - Reactive Module Only (No Core)
 * Reactive state management, forms, async state
 * Requires: Core module to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './03_reactive/01_dh-reactive.js';
import './03_reactive/02_dh-reactive-array-patch.js';
import './03_reactive/03_dh-reactive-collections.js';
import './03_reactive/04_dh-reactive-form.js';
import './03_reactive/05_dh-reactive-cleanup.js';
import './03_reactive/06_dh-reactive-enhancements.js';
import './03_reactive/07_dh-reactive-storage.js';
import './03_reactive/08_dh-reactive-namespace-methods.js';
import './03_reactive/09_dh-reactiveUtils-shortcut.js';

// Export global APIs
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};
export const ReactiveState = typeof window !== 'undefined' ? window.ReactiveState : {};
export const ReactiveUtils = typeof window !== 'undefined' ? window.ReactiveUtils : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
