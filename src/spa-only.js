/**
 * DOM Helpers JS — SPA Module (Standalone)
 * Client-side router with hash/history mode, transitions, guards, and declarative links.
 * Works independently — no other DOM Helpers modules required.
 * @version 2.9.0
 * @license MIT
 */

// Load order matters: core router first, then addons
import './10_spa/01_dh-router.js';
import './10_spa/02_dh-router-view.js';
import './10_spa/03_dh-router-link.js';
import './10_spa/04_dh-router-guards.js';

// Export global API (set on window by the modules)
export const Router = typeof window !== 'undefined' ? window.Router : {};

export default typeof window !== 'undefined' ? window.Router : {};
