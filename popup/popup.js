// DOM Elements
const form = document.getElementById('transformForm');
const productTitleInput = document.getElementById('productTitle');
const productDescriptionInput = document.getElementById('productDescription');
const toneSelect = document.getElementById('tone');
const customToneGroup = document.getElementById('customToneGroup');
const customToneInput = document.getElementById('customTone');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyCheckbox = document.getElementById('saveApiKey');
const transformBtn = document.getElementById('transformBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const resetBtn = document.getElementById('resetBtn');
const settingsBtn = document.getElementById('settingsBtn');
const status = document.getElementById('status');

// State
let isTransformed = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadSavedSettings();
    setupEventListeners();
    updateButtonStates();
    checkCurrentPageState();
});

// Event Listeners
function setupEventListeners() {
    // Form validation
    [productTitleInput, productDescriptionInput, apiKeyInput].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    // Tone selection
    toneSelect.addEventListener('change', handleToneChange);

    // Character counters
    productTitleInput.addEventListener('input', () => updateCharCount(productTitleInput, 100));
    productDescriptionInput.addEventListener('input', () => updateCharCount(productDescriptionInput, 500));

    // Form submission
    form.addEventListener('submit', handleTransform);

    // Button actions
    regenerateBtn.addEventListener('click', handleRegenerate);
    resetBtn.addEventListener('click', handleReset);
    settingsBtn.addEventListener('click', handleSettings);

    // API key save checkbox
    saveApiKeyCheckbox.addEventListener('change', handleApiKeySave);
}

// Load saved settings
async function loadSavedSettings() {
    try {
        const result = await chrome.storage.local.get([
            'productTitle',
            'productDescription',
            'tone',
            'customTone',
            'apiKey',
            'saveApiKey'
        ]);

        if (result.productTitle) productTitleInput.value = result.productTitle;
        if (result.productDescription) productDescriptionInput.value = result.productDescription;
        if (result.tone) toneSelect.value = result.tone;
        if (result.customTone) customToneInput.value = result.customTone;
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
            saveApiKeyCheckbox.checked = result.saveApiKey || false;
        }

        handleToneChange();
        updateCharCount(productTitleInput, 100);
        updateCharCount(productDescriptionInput, 500);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save settings
async function saveSettings() {
    try {
        const settings = {
            productTitle: productTitleInput.value,
            productDescription: productDescriptionInput.value,
            tone: toneSelect.value,
            customTone: customToneInput.value
        };

        if (saveApiKeyCheckbox.checked) {
            settings.apiKey = apiKeyInput.value;
            settings.saveApiKey = true;
        } else {
            // Remove saved API key if unchecked
            await chrome.storage.local.remove(['apiKey', 'saveApiKey']);
        }

        await chrome.storage.local.set(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Form validation
function validateForm() {
    const isValid = productTitleInput.value.trim() && 
                   productDescriptionInput.value.trim() && 
                   apiKeyInput.value.trim();
    
    transformBtn.disabled = !isValid;
    return isValid;
}

// Update character count
function updateCharCount(input, maxLength) {
    if (!input || typeof input.closest !== 'function') {
        console.error('Invalid input element passed to updateCharCount:', input);
        return;
    }
    
    const fieldGroup = input.closest('.field-group');
    if (!fieldGroup) {
        console.error('Could not find field-group for input:', input);
        return;
    }
    
    const charCount = fieldGroup.querySelector('.char-count');
    if (!charCount) {
        console.error('Could not find char-count element in field-group');
        return;
    }
    
    const currentLength = input.value ? input.value.length : 0;
    
    charCount.textContent = `${currentLength}/${maxLength}`;
    
    // Update styling based on character count
    charCount.classList.remove('warning', 'danger');
    if (currentLength > maxLength * 0.9) {
        charCount.classList.add('warning');
    }
    if (currentLength > maxLength * 0.95) {
        charCount.classList.add('danger');
    }
}

// Handle tone selection
function handleToneChange() {
    const isCustom = toneSelect.value === 'custom';
    customToneGroup.style.display = isCustom ? 'block' : 'none';
    customToneInput.required = isCustom;
}

// Handle API key save
function handleApiKeySave() {
    if (!saveApiKeyCheckbox.checked) {
        chrome.storage.local.remove(['apiKey', 'saveApiKey']);
    }
}

// Transform page
async function handleTransform(event) {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
        setLoadingState(true);
        await saveSettings();

        const transformData = {
            productTitle: productTitleInput.value.trim(),
            productDescription: productDescriptionInput.value.trim(),
            tone: toneSelect.value === 'custom' ? customToneInput.value.trim() : toneSelect.value,
            apiKey: apiKeyInput.value.trim()
        };

        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        showStatus('Connecting to page...', 'info');
        
        // Check if content script is responsive
        let isContentScriptReady = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!isContentScriptReady && retryCount < maxRetries) {
            try {
                const pingResponse = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
                if (pingResponse && pingResponse.success) {
                    isContentScriptReady = true;
                    break;
                }
            } catch (pingError) {
                console.log(`Content script ping failed (attempt ${retryCount + 1}):`, pingError.message);
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                showStatus(`Waiting for page to load... (${retryCount}/${maxRetries})`, 'info');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        if (!isContentScriptReady) {
            throw new Error('Could not establish connection. Please refresh the page and try again.');
        }

        showStatus('Starting visual analysis and transformation...', 'info');

        // Send new comprehensive transform message
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'analyzeAndTransform',
            data: transformData
        });

        if (response && response.success) {
            if (response.status === 'started') {
                showStatus('Visual analysis in progress...', 'info');
                
                // Listen for completion message
                const completionListener = (message) => {
                    if (message.action === 'transformationComplete') {
                        const data = message.data;
                        const analysisType = data.visualAnalysisUsed ? 'GPT-4o Vision' : 'DOM fallback';
                        showStatus(`Successfully transformed ${data.transformedCount || 0} elements using ${analysisType}!`, 'success');
                        isTransformed = true;
                        updateButtonStates();
                        chrome.runtime.onMessage.removeListener(completionListener);
                    } else if (message.action === 'transformationError') {
                        const errorMsg = message.data.error || 'Transformation failed';
                        showStatus(`Error: ${errorMsg}`, 'error');
                        chrome.runtime.onMessage.removeListener(completionListener);
                    }
                };
                
                chrome.runtime.onMessage.addListener(completionListener);
                
                // Set timeout for completion
                setTimeout(() => {
                    chrome.runtime.onMessage.removeListener(completionListener);
                }, 30000); // 30 second timeout
                
            } else {
                showStatus(`Successfully transformed ${response.transformedCount || 0} elements!`, 'success');
                isTransformed = true;
                updateButtonStates();
            }
        } else {
            const errorMsg = response?.error || 'Transformation failed';
            if (errorMsg.includes('No transformable content')) {
                throw new Error(`${errorMsg}\n\nTip: Try a different website or wait for the page to fully load.`);
            } else {
                throw new Error(errorMsg);
            }
        }

    } catch (error) {
        console.error('Transform error:', error);
        
        let displayMessage = error.message;
        
        // Handle specific error types
        if (error.message.includes('Could not establish connection')) {
            displayMessage = 'Could not establish connection. Receiving end does not exist.';
        } else if (error.message.includes('Extension context invalidated')) {
            displayMessage = 'Extension was reloaded. Please refresh the page and try again.';
        }
        
        showStatus(`Error: ${displayMessage}`, 'error');
    } finally {
        setLoadingState(false);
    }
}

// Regenerate content
async function handleRegenerate() {
    try {
        setLoadingState(true);
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'regenerate'
        });

        if (response.success) {
            showStatus('Content regenerated successfully!', 'success');
        } else {
            throw new Error(response.error || 'Regeneration failed');
        }

    } catch (error) {
        console.error('Regenerate error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(false);
    }
}

// Reset page
async function handleReset() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'reset'
        });

        if (response.success) {
            showStatus('Page reset to original content', 'info');
            isTransformed = false;
            updateButtonStates();
        } else {
            throw new Error(response.error || 'Reset failed');
        }

    } catch (error) {
        console.error('Reset error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

// Handle settings
function handleSettings() {
    // TODO: Implement settings panel
    showStatus('Settings panel coming soon!', 'info');
}

// Check current page state
async function checkCurrentPageState() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'getState'
        });

        if (response && response.isTransformed) {
            isTransformed = true;
            updateButtonStates();
            showStatus('Page is currently transformed', 'info');
        }
    } catch (error) {
        // Content script might not be loaded yet, that's okay
        console.log('Could not check page state:', error.message);
    }
}

// Update button states
function updateButtonStates() {
    regenerateBtn.disabled = !isTransformed;
    resetBtn.disabled = !isTransformed;
}

// Set loading state
function setLoadingState(loading) {
    const btnText = transformBtn.querySelector('.btn-text');
    const btnLoader = transformBtn.querySelector('.btn-loader');
    
    transformBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoader.style.display = loading ? 'inline-block' : 'none';
    
    if (loading) {
        regenerateBtn.disabled = true;
        resetBtn.disabled = true;
    } else {
        updateButtonStates();
    }
}

// Show status message
function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Auto-hide success and info messages
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
}

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Popup error:', event.error);
    showStatus('An unexpected error occurred', 'error');
});

// Message listener for background script communications
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateStatus') {
        showStatus(message.message, message.type);
    } else if (message.action === 'updateState') {
        isTransformed = message.isTransformed;
        updateButtonStates();
    }
    
    sendResponse({ received: true });
}); 