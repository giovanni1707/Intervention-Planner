/**
 * DOM Helpers JS — Core + SPA Bundle
 * Full DOM Helpers library plus the SPA Router module.
 * @version 2.9.0
 * @license MIT
 */

// DOM Helpers core and all feature modules
import './01_core/01_dh-core.js';
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
import './03_reactive/01_dh-reactive.js';
import './03_reactive/02_dh-reactive-array-patch.js';
import './03_reactive/03_dh-reactive-collections.js';
import './03_reactive/04_dh-reactive-form.js';
import './03_reactive/05_dh-reactive-cleanup.js';
import './03_reactive/06_dh-reactive-enhancements.js';
import './03_reactive/07_dh-reactive-storage.js';
import './03_reactive/08_dh-reactive-namespace-methods.js';
import './03_reactive/09_dh-reactiveUtils-shortcut.js';
import './04_conditions/01_dh-conditional-rendering.js';
import './04_conditions/02_dh-conditions-default.js';
import './04_conditions/03_dh-conditions-collection-extension.js';
import './04_conditions/04_dh-conditions-apply-index-support.js';
import './04_conditions/05_dh-conditions-global-shortcut.js';
import './04_conditions/06_dh-matchers-handlers-shortcut.js';
import './04_conditions/07_dh-conditions-array-support.js';
import './04_conditions/08_dh-conditions-batch-states.js';
import './04_conditions/09_dh-conditions-cleanup-fix.js';
import './05_storage/01_dh-storage-standalone.js';
import './06_native-enhance/01_dh-getbyid-enhance.js';
import './06_native-enhance/02_dh-getElementsBy-enhance.js';
import './06_native-enhance/03_dh-document-query-enhance.js';
import './07_dom-form/01_dh-form.js';
import './10_spa/00_dh-forms-helper-shim.js';
import './07_dom-form/02_dh-form-enhance.js';
import './08_animation/01_dh-animation.js';
import './09_async/01_dh-async.js';

// SPA Router modules
import './10_spa/01_dh-router.js';
import './10_spa/02_dh-router-view.js';
import './10_spa/03_dh-router-link.js';
import './10_spa/04_dh-router-guards.js';

// Export all global APIs
export const DOMHelpers   = typeof window !== 'undefined' ? window.DOMHelpers   : {};
export const Elements     = typeof window !== 'undefined' ? window.Elements     : {};
export const Collections  = typeof window !== 'undefined' ? window.Collections  : {};
export const Selector     = typeof window !== 'undefined' ? window.Selector     : {};
export const createElement = typeof window !== 'undefined' ? window.createElement : {};
export const ReactiveState = typeof window !== 'undefined' ? window.ReactiveState : {};
export const ReactiveUtils = typeof window !== 'undefined' ? window.ReactiveUtils : {};
export const StorageUtils  = typeof window !== 'undefined' ? window.StorageUtils  : {};
export const Forms         = typeof window !== 'undefined' ? window.Forms         : {};
export const Animation     = typeof window !== 'undefined' ? window.Animation     : {};
export const AsyncHelpers  = typeof window !== 'undefined' ? window.AsyncHelpers  : {};
export const Router        = typeof window !== 'undefined' ? window.Router        : {};

export default typeof window !== 'undefined' ? window.DOMHelpers : {};
