/**
 * DOM Helpers JS - Async Module Only (No Core)
 * debounce, throttle, sleep, enhancedFetch, fetchJSON, fetchText, fetchBlob,
 * asyncHandler, parallelAll, raceWithTimeout, sanitize.
 * Requires: Core module to be loaded first!
 * @version 2.9.0
 * @license MIT
 */

import './09_async/01_dh-async.js';

// Export global APIs (should already exist from core)
export const DOMHelpers   = typeof window !== 'undefined' ? window.DOMHelpers   : {};
export const AsyncHelpers = typeof window !== 'undefined' ? window.AsyncHelpers : {};

export default typeof window !== 'undefined' ? window.AsyncHelpers : {};
