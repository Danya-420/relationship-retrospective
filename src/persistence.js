/**
 * Persistence module for Relationship Retrospective
 * Handles serialization, storage, and restoration of application state.
 */

const STORAGE_KEY = 'retrospective_state_v1';
const CURRENT_VERSION = 1;

/**
 * @typedef {Object} PersistenceState
 * @property {number} currentStep - The current step index
 * @property {Object} answers - User answers (formData)
 * @property {Object} uiFlags - UI state flags (isSubmitted, showGallery, etc.)
 * @property {Object} meta - Metadata (version, timestamp)
 */

/**
 * Saves the application state to localStorage.
 * @param {Object} data - The data to save
 * @param {number} data.step - Current step index
 * @param {Object} data.formData - Form data/answers
 * @param {Object} data.uiState - UI flags like { isSubmitted, showGallery, isClosed, stackLength }
 * @throws {Error} - If quota is exceeded or storage is unavailable
 */
export const saveState = (data) => {
  try {
    const state = {
      currentStep: data.step,
      answers: data.formData,
      uiFlags: data.uiState,
      meta: {
        lastSaved: Date.now(),
        version: CURRENT_VERSION
      }
    };

    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw new Error('Local storage quota exceeded. Unable to save progress.');
    }
    console.warn('Failed to save state:', error);
    throw error;
  }
};

/**
 * Loads the application state from localStorage.
 * Validates version and structure.
 * @returns {PersistenceState|null} - The restored state or null if invalid/missing
 */
export const loadState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;

    const state = JSON.parse(serialized);

    // Basic schema validation
    if (!state || typeof state !== 'object' || !state.meta || state.meta.version !== CURRENT_VERSION) {
      // In a real app, we might handle migrations here.
      // For now, if version mismatch or invalid shape, return null (reset).
      console.warn('Invalid or outdated state found. Resetting.');
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

/**
 * Clears the saved state from localStorage.
 */
export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};
