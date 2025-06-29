// Storage Utility Library
// Handles secure storage operations and data management

class StorageManager {
    constructor() {
        this.storage = chrome.storage.local;
        this.encryptionKey = null;
        this.initializeEncryption();
    }

    // Initialize encryption for sensitive data
    async initializeEncryption() {
        try {
            const result = await this.storage.get(['encryptionKey']);
            if (result.encryptionKey) {
                this.encryptionKey = result.encryptionKey;
            } else {
                // Generate new encryption key
                this.encryptionKey = this.generateEncryptionKey();
                await this.storage.set({ encryptionKey: this.encryptionKey });
            }
        } catch (error) {
            console.error('Error initializing encryption:', error);
        }
    }

    // Generate encryption key
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Store user settings
    async saveUserSettings(settings) {
        try {
            const sanitizedSettings = this.sanitizeSettings(settings);
            await this.storage.set({ userSettings: sanitizedSettings });
            return { success: true };
        } catch (error) {
            console.error('Error saving user settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Load user settings
    async loadUserSettings() {
        try {
            const result = await this.storage.get(['userSettings']);
            return {
                success: true,
                settings: result.userSettings || this.getDefaultSettings()
            };
        } catch (error) {
            console.error('Error loading user settings:', error);
            return {
                success: false,
                error: error.message,
                settings: this.getDefaultSettings()
            };
        }
    }

    // Store API key securely
    async saveApiKey(apiKey, shouldSave = true) {
        if (!shouldSave) {
            return this.removeApiKey();
        }

        try {
            const encryptedKey = await this.encryptData(apiKey);
            await this.storage.set({ 
                apiKey: encryptedKey,
                apiKeySaved: true,
                apiKeyTimestamp: Date.now()
            });
            return { success: true };
        } catch (error) {
            console.error('Error saving API key:', error);
            return { success: false, error: error.message };
        }
    }

    // Load API key
    async loadApiKey() {
        try {
            const result = await this.storage.get(['apiKey', 'apiKeySaved']);
            
            if (result.apiKeySaved && result.apiKey) {
                const decryptedKey = await this.decryptData(result.apiKey);
                return { success: true, apiKey: decryptedKey };
            }
            
            return { success: true, apiKey: null };
        } catch (error) {
            console.error('Error loading API key:', error);
            return { success: false, error: error.message, apiKey: null };
        }
    }

    // Remove API key
    async removeApiKey() {
        try {
            await this.storage.remove(['apiKey', 'apiKeySaved', 'apiKeyTimestamp']);
            return { success: true };
        } catch (error) {
            console.error('Error removing API key:', error);
            return { success: false, error: error.message };
        }
    }

    // Store transformation history
    async saveTransformationHistory(transformData) {
        try {
            const result = await this.storage.get(['transformHistory']);
            const history = result.transformHistory || [];
            
            // Add new entry
            const entry = {
                id: this.generateId(),
                timestamp: Date.now(),
                productTitle: transformData.productTitle,
                productDescription: transformData.productDescription,
                tone: transformData.tone,
                url: transformData.url || '',
                domain: transformData.domain || '',
                transformedCount: transformData.transformedCount || 0
            };
            
            history.unshift(entry);
            
            // Keep only last 50 entries
            if (history.length > 50) {
                history.splice(50);
            }
            
            await this.storage.set({ transformHistory: history });
            return { success: true, id: entry.id };
        } catch (error) {
            console.error('Error saving transformation history:', error);
            return { success: false, error: error.message };
        }
    }

    // Load transformation history
    async loadTransformationHistory() {
        try {
            const result = await this.storage.get(['transformHistory']);
            return {
                success: true,
                history: result.transformHistory || []
            };
        } catch (error) {
            console.error('Error loading transformation history:', error);
            return {
                success: false,
                error: error.message,
                history: []
            };
        }
    }

    // Clear transformation history
    async clearTransformationHistory() {
        try {
            await this.storage.remove(['transformHistory']);
            return { success: true };
        } catch (error) {
            console.error('Error clearing transformation history:', error);
            return { success: false, error: error.message };
        }
    }

    // Store usage statistics
    async updateUsageStats(action, success = true, metadata = {}) {
        try {
            const result = await this.storage.get(['usageStats']);
            const stats = result.usageStats || this.getDefaultStats();
            
            // Update counters
            switch (action) {
                case 'transform':
                    stats.totalTransforms++;
                    if (success) {
                        stats.successfulTransforms++;
                    } else {
                        stats.failedTransforms++;
                    }
                    break;
                case 'regenerate':
                    stats.totalRegenerations++;
                    break;
                case 'reset':
                    stats.totalResets++;
                    break;
            }
            
            // Update timestamps
            const now = Date.now();
            if (!stats.firstUsed) {
                stats.firstUsed = now;
            }
            stats.lastUsed = now;
            
            // Update metadata
            if (metadata.elementsTransformed) {
                stats.totalElementsTransformed += metadata.elementsTransformed;
            }
            
            await this.storage.set({ usageStats: stats });
            return { success: true };
        } catch (error) {
            console.error('Error updating usage stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Load usage statistics
    async loadUsageStats() {
        try {
            const result = await this.storage.get(['usageStats']);
            return {
                success: true,
                stats: result.usageStats || this.getDefaultStats()
            };
        } catch (error) {
            console.error('Error loading usage stats:', error);
            return {
                success: false,
                error: error.message,
                stats: this.getDefaultStats()
            };
        }
    }

    // Store favorite transformations
    async saveFavorite(transformData) {
        try {
            const result = await this.storage.get(['favorites']);
            const favorites = result.favorites || [];
            
            const favorite = {
                id: this.generateId(),
                name: transformData.name || `${transformData.productTitle} - ${transformData.tone}`,
                productTitle: transformData.productTitle,
                productDescription: transformData.productDescription,
                tone: transformData.tone,
                customTone: transformData.customTone,
                createdAt: Date.now()
            };
            
            favorites.unshift(favorite);
            
            // Keep only last 20 favorites
            if (favorites.length > 20) {
                favorites.splice(20);
            }
            
            await this.storage.set({ favorites });
            return { success: true, id: favorite.id };
        } catch (error) {
            console.error('Error saving favorite:', error);
            return { success: false, error: error.message };
        }
    }

    // Load favorites
    async loadFavorites() {
        try {
            const result = await this.storage.get(['favorites']);
            return {
                success: true,
                favorites: result.favorites || []
            };
        } catch (error) {
            console.error('Error loading favorites:', error);
            return {
                success: false,
                error: error.message,
                favorites: []
            };
        }
    }

    // Remove favorite
    async removeFavorite(id) {
        try {
            const result = await this.storage.get(['favorites']);
            const favorites = result.favorites || [];
            
            const updatedFavorites = favorites.filter(fav => fav.id !== id);
            await this.storage.set({ favorites: updatedFavorites });
            
            return { success: true };
        } catch (error) {
            console.error('Error removing favorite:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear all data
    async clearAllData() {
        try {
            await this.storage.clear();
            return { success: true };
        } catch (error) {
            console.error('Error clearing all data:', error);
            return { success: false, error: error.message };
        }
    }

    // Export data
    async exportData() {
        try {
            const result = await this.storage.get();
            
            // Remove sensitive data from export
            const exportData = { ...result };
            delete exportData.apiKey;
            delete exportData.encryptionKey;
            
            return {
                success: true,
                data: exportData,
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }

    // Import data
    async importData(data) {
        try {
            // Validate data structure
            if (!this.validateImportData(data)) {
                throw new Error('Invalid import data structure');
            }
            
            // Merge with existing data
            const existing = await this.storage.get();
            const merged = { ...existing, ...data };
            
            // Don't import sensitive data
            delete merged.apiKey;
            delete merged.encryptionKey;
            
            await this.storage.set(merged);
            return { success: true };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    }

    // Encrypt sensitive data
    async encryptData(data) {
        try {
            // Simple encryption - in production, use proper encryption
            const encoder = new TextEncoder();
            const dataArray = encoder.encode(data);
            const keyArray = encoder.encode(this.encryptionKey);
            
            const encrypted = new Uint8Array(dataArray.length);
            for (let i = 0; i < dataArray.length; i++) {
                encrypted[i] = dataArray[i] ^ keyArray[i % keyArray.length];
            }
            
            return Array.from(encrypted).map(byte => 
                byte.toString(16).padStart(2, '0')
            ).join('');
        } catch (error) {
            console.error('Error encrypting data:', error);
            throw error;
        }
    }

    // Decrypt sensitive data
    async decryptData(encryptedData) {
        try {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            
            const encrypted = new Uint8Array(
                encryptedData.match(/.{2}/g).map(byte => parseInt(byte, 16))
            );
            const keyArray = encoder.encode(this.encryptionKey);
            
            const decrypted = new Uint8Array(encrypted.length);
            for (let i = 0; i < encrypted.length; i++) {
                decrypted[i] = encrypted[i] ^ keyArray[i % keyArray.length];
            }
            
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error decrypting data:', error);
            throw error;
        }
    }

    // Sanitize settings
    sanitizeSettings(settings) {
        const sanitized = {};
        
        // Define allowed settings
        const allowedSettings = [
            'productTitle', 'productDescription', 'tone', 'customTone',
            'saveApiKey', 'maxApiCalls', 'batchSize', 'batchDelay',
            'autoSaveSettings', 'showVisualIndicators', 'debugMode'
        ];
        
        allowedSettings.forEach(key => {
            if (settings.hasOwnProperty(key)) {
                sanitized[key] = settings[key];
            }
        });
        
        return sanitized;
    }

    // Get default settings
    getDefaultSettings() {
        return {
            productTitle: '',
            productDescription: '',
            tone: 'professional',
            customTone: '',
            saveApiKey: false,
            maxApiCalls: 50,
            batchSize: 5,
            batchDelay: 200,
            autoSaveSettings: true,
            showVisualIndicators: true,
            debugMode: false
        };
    }

    // Get default statistics
    getDefaultStats() {
        return {
            totalTransforms: 0,
            totalRegenerations: 0,
            totalResets: 0,
            successfulTransforms: 0,
            failedTransforms: 0,
            totalElementsTransformed: 0,
            firstUsed: null,
            lastUsed: null
        };
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validate import data
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check for required structure
        const requiredKeys = ['userSettings'];
        return requiredKeys.every(key => data.hasOwnProperty(key));
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
} else {
    window.StorageManager = StorageManager;
} 