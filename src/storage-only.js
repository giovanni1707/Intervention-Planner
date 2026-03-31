/**
 * DOM Helpers JS - Storage Module Only (Standalone)
 * localStorage / sessionStorage utilities with auto-save, watching, and namespacing
 * Works independently - no other modules required
 * @version 2.9.0
 * @license MIT
 */

import './05_storage/01_dh-storage-standalone.js';

// Export global APIs
export const DOMHelpers = typeof window !== 'undefined' ? window.DOMHelpers : {};
export const Elements = typeof window !== 'undefined' ? window.Elements : {};
export const Collections = typeof window !== 'undefined' ? window.Collections : {};
export const Selector = typeof window !== 'undefined' ? window.Selector : {};
export const StorageUtils = typeof window !== 'undefined' ? window.StorageUtils : {};

export default typeof window !== 'undefined' ? window.StorageUtils : {};
