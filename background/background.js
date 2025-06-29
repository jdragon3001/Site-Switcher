// Background Service Worker
// Handles cross-tab communication, API management, and extension lifecycle

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Site Switcher installed:', details.reason);
    
    if (details.reason === 'install') {
        // First installation
        handleFirstInstall();
    } else if (details.reason === 'update') {
        // Extension updated
        handleUpdate(details.previousVersion);
    }
});

// First installation setup
function handleFirstInstall() {
    console.log('Setting up Site Switcher for first use...');
    
    // Set default settings
    chrome.storage.local.set({
        firstRun: true,
        installDate: Date.now(),
        settings: {
            maxApiCalls: 50,
            batchSize: 5,
            batchDelay: 200,
            autoSaveSettings: true
        }
    });
    
    // Optional: Open welcome page
    // chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
}

// Handle extension updates
function handleUpdate(previousVersion) {
    console.log(`Site Switcher updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
    
    // Perform any necessary migrations
    migrateSettings(previousVersion);
}

// Migrate settings between versions
async function migrateSettings(previousVersion) {
    try {
        const data = await chrome.storage.local.get();
        let needsUpdate = false;
        
        // Add migration logic here as needed
        // Example: if (compareVersions(previousVersion, '1.1.0') < 0) { ... }
        
        if (needsUpdate) {
            await chrome.storage.local.set(data);
            console.log('Settings migrated successfully');
        }
    } catch (error) {
        console.error('Error migrating settings:', error);
    }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    
    switch (message.action) {
        case 'transformationComplete':
            handleTransformationComplete(message, sender);
            break;
            
        case 'regenerationComplete':
            handleRegenerationComplete(message, sender);
            break;
            
        case 'resetComplete':
            handleResetComplete(message, sender);
            break;
            
        case 'getSettings':
            handleGetSettings(sendResponse);
            return true; // Keep message channel open
            
        case 'saveSettings':
            handleSaveSettings(message.settings, sendResponse);
            return true;
            
        case 'clearAllData':
            handleClearAllData(sendResponse);
            return true;
            
        case 'getUsageStats':
            handleGetUsageStats(sendResponse);
            return true;
            
        default:
            console.warn('Unknown message action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return false;
});

// Handle transformation completion
function handleTransformationComplete(message, sender) {
    console.log('Transformation completed:', message);
    
    // Update usage statistics
    updateUsageStats('transform', message.success);
    
    // Notify other tabs (disabled for initial version)
    // if (message.success) {
    //     notifyOtherTabs(sender.tab.id, {
    //         action: 'transformationSuccess',
    //         transformedCount: message.transformedCount
    //     });
    // }
}

// Handle regeneration completion
function handleRegenerationComplete(message, sender) {
    console.log('Regeneration completed:', message);
    
    // Update usage statistics
    updateUsageStats('regenerate', message.success);
}

// Handle reset completion
function handleResetComplete(message, sender) {
    console.log('Reset completed:', message);
    
    // Update usage statistics
    updateUsageStats('reset', message.success);
}

// Get extension settings
async function handleGetSettings(sendResponse) {
    try {
        const result = await chrome.storage.local.get([
            'settings',
            'productTitle',
            'productDescription',
            'tone',
            'customTone',
            'saveApiKey'
        ]);
        
        sendResponse({ 
            success: true, 
            settings: result.settings || {},
            userSettings: {
                productTitle: result.productTitle || '',
                productDescription: result.productDescription || '',
                tone: result.tone || 'professional',
                customTone: result.customTone || '',
                saveApiKey: result.saveApiKey || false
            }
        });
    } catch (error) {
        console.error('Error getting settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Save extension settings
async function handleSaveSettings(settings, sendResponse) {
    try {
        await chrome.storage.local.set({ settings });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error saving settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Clear all extension data
async function handleClearAllData(sendResponse) {
    try {
        await chrome.storage.local.clear();
        sendResponse({ success: true });
    } catch (error) {
        console.error('Error clearing data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Get usage statistics
async function handleGetUsageStats(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['usageStats']);
        sendResponse({ 
            success: true, 
            stats: result.usageStats || {
                totalTransforms: 0,
                totalRegenerations: 0,
                totalResets: 0,
                successfulTransforms: 0,
                failedTransforms: 0,
                firstUsed: null,
                lastUsed: null
            }
        });
    } catch (error) {
        console.error('Error getting usage stats:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Update usage statistics
async function updateUsageStats(action, success = true) {
    try {
        const result = await chrome.storage.local.get(['usageStats']);
        const stats = result.usageStats || {
            totalTransforms: 0,
            totalRegenerations: 0,
            totalResets: 0,
            successfulTransforms: 0,
            failedTransforms: 0,
            firstUsed: null,
            lastUsed: null
        };
        
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
        
        await chrome.storage.local.set({ usageStats: stats });
    } catch (error) {
        console.error('Error updating usage stats:', error);
    }
}

// Notify other tabs (disabled for initial version)
// async function notifyOtherTabs(currentTabId, message) {
//     try {
//         const tabs = await chrome.tabs.query({});
//         
//         tabs.forEach(tab => {
//             if (tab.id !== currentTabId) {
//                 chrome.tabs.sendMessage(tab.id, message).catch(() => {
//                     // Tab might not have content script loaded, ignore errors
//                 });
//             }
//         });
//     } catch (error) {
//         console.error('Error notifying other tabs:', error);
//     }
// }

// Handle tab updates (disabled for initial version)
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && tab.url) {
//         // Tab finished loading
//         // Could be used for automatic transformations or other features
//         console.log('Tab updated:', tab.url);
//     }
// });

// Handle tab removal (disabled for initial version)  
// chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
//     // Clean up any tab-specific data if needed
//     console.log('Tab removed:', tabId);
// });

// Context menu setup (disabled for initial version)
// function setupContextMenus() {
//     chrome.contextMenus.create({
//         id: 'siteSwitcher',
//         title: 'Transform with Site Switcher',
//         contexts: ['selection']
//     });
// }

// Context menu functionality removed - not needed for initial version
// chrome.contextMenus.onClicked.addListener((info, tab) => {
//     if (info.menuItemId === 'siteSwitcher') {
//         // Handle context menu click
//         chrome.tabs.sendMessage(tab.id, {
//             action: 'transformSelection',
//             selectedText: info.selectionText
//         });
//     }
// });

// Alarm handling for periodic tasks (disabled for initial version)
// chrome.alarms.onAlarm.addListener((alarm) => {
//     console.log('Alarm triggered:', alarm.name);
//     
//     switch (alarm.name) {
//         case 'cleanup':
//             performCleanup();
//             break;
//         case 'statsUpdate':
//             updateDailyStats();
//             break;
//     }
// });

// Periodic cleanup
async function performCleanup() {
    try {
        const result = await chrome.storage.local.get();
        
        // Clean up old temporary data
        const keysToRemove = [];
        for (const key in result) {
            if (key.startsWith('temp_') && 
                Date.now() - (result[key].timestamp || 0) > 24 * 60 * 60 * 1000) {
                keysToRemove.push(key);
            }
        }
        
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log('Cleaned up old temporary data:', keysToRemove.length, 'items');
        }
    } catch (error) {
        console.error('Error performing cleanup:', error);
    }
}

// Update daily statistics
async function updateDailyStats() {
    try {
        const today = new Date().toDateString();
        const result = await chrome.storage.local.get(['dailyStats']);
        const dailyStats = result.dailyStats || {};
        
        if (!dailyStats[today]) {
            dailyStats[today] = {
                transforms: 0,
                regenerations: 0,
                resets: 0
            };
        }
        
        // Clean up old daily stats (keep only last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        Object.keys(dailyStats).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete dailyStats[date];
            }
        });
        
        await chrome.storage.local.set({ dailyStats });
    } catch (error) {
        console.error('Error updating daily stats:', error);
    }
}

// Set up periodic tasks (disabled for initial version)
// function setupPeriodicTasks() {
//     // Clean up old data daily
//     chrome.alarms.create('cleanup', { 
//         delayInMinutes: 1, 
//         periodInMinutes: 24 * 60 
//     });
//     
//     // Update stats daily
//     chrome.alarms.create('statsUpdate', { 
//         delayInMinutes: 1, 
//         periodInMinutes: 24 * 60 
//     });
// }

// Initialize background script
function initialize() {
    try {
        console.log('Site Switcher background script initialized');
        
        // Set up periodic tasks (disabled for initial version)
        // setupPeriodicTasks();
        
        // Set up context menus (disabled for initial version)
        // setupContextMenus();
        
        console.log('Site Switcher background script initialization complete');
    } catch (error) {
        console.error('Error initializing Site Switcher background script:', error);
    }
}

// Start initialization
try {
    initialize();
} catch (error) {
    console.error('Critical error in Site Switcher background script:', error);
} 