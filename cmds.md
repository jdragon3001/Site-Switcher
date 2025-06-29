# Site Switcher - Commands Documentation

This document contains all the commands needed to start, test, and manage the Site Switcher Chrome extension.

## Development Commands

### Load Extension in Chrome
```bash
# Open Chrome and navigate to:
chrome://extensions/

# Enable Developer mode (toggle in top right)
# Click "Load unpacked" button
# Select the "Site Switcher" directory
```

### Reload Extension After Changes
```bash
# In Chrome extensions page (chrome://extensions/)
# Find "Site Switcher" extension
# Click the reload icon (circular arrow)
# OR use keyboard shortcut: Ctrl+R (Windows/Linux) or Cmd+R (Mac)
```

### View Extension Console Logs
```bash
# For popup logs:
# Right-click extension icon → "Inspect popup"

# For content script logs:
# Open website → F12 → Console tab → Look for "Site Switcher" messages

# For background script logs:
# Go to chrome://extensions/ → "Site Switcher" → "service worker" link
```

## Testing Commands

### Test on Different Websites
```bash
# Navigate to test websites in Chrome:
https://example.com
https://github.com
https://news.ycombinator.com
https://stripe.com
https://tailwindcss.com

# Test extension functionality on each site
```

### Check Extension Status
```bash
# In browser console (F12):
window.SiteSwitcher.getState()

# Check if content scripts loaded:
window.SiteSwitcher.initialize()

# Debug content detection:
window.SiteSwitcher.detector().detectTextElements()

# Check detection stats:
window.SiteSwitcher.detector().getStats()

# Test simple element selection:
document.querySelectorAll('h1,h2,h3,p').length

# Quick test of content detection:
(() => {
  const detector = new ContentDetector();
  const elements = detector.detectTextElements();
  console.log('🔍 Content Detection Test:');
  console.log('- Total elements found:', elements.size);
  console.log('- Page has basic elements:', document.querySelectorAll('h1,h2,h3,p').length);
  console.log('- Detection stats:', detector.getStats());
  return elements.size > 0 ? '✅ Detection working' : '❌ No elements detected';
})()

# Complete extension test (run this after reloading extension):
(() => {
  console.log('🧪 COMPLETE SITE SWITCHER TEST');
  console.log('================================');
  
  // Test 1: Check if content script loaded
  console.log('📍 Test 1: Content Script Loading');
  if (window.SiteSwitcher) {
    console.log('✅ Content script loaded successfully');
  } else {
    console.log('❌ Content script not loaded');
    return '❌ Content script failed to load';
  }
  
  // Test 2: Check page elements
  console.log('📍 Test 2: Page Elements');
  const basicElements = window.SiteSwitcher.simpleTest();
  const totalElements = Object.values(basicElements).reduce((a, b) => a + b, 0);
  console.log(`✅ Found ${totalElements} total elements on page`);
  
  // Test 3: Detection system
  console.log('📍 Test 3: Content Detection System');
  const detectionResult = window.SiteSwitcher.testDetection();
  if (detectionResult && detectionResult.size > 0) {
    console.log(`✅ Detection working: Found ${detectionResult.size} transformable elements`);
  } else {
    console.log('❌ Detection failed');
    return '❌ Content detection failed';
  }
  
  // Test 4: Communication test (ping)
  console.log('📍 Test 4: Extension Communication');
  try {
    chrome.runtime.sendMessage({action: 'ping'}, (response) => {
      if (response) {
        console.log('✅ Extension communication working');
      } else {
        console.log('⚠️ Extension communication limited');
      }
    });
  } catch (e) {
    console.log('⚠️ Communication test skipped (normal in content script)');
  }
  
  console.log('================================');
  console.log('🎯 OVERALL RESULT: Extension is ready for API testing!');
  console.log('📝 Next step: Add your OpenAI API key and test transformation');
  
  return '✅ All systems operational - Ready for API testing!';
})()
```

### Test NEW Visual Analysis System with GPT-4o
```javascript
// In browser console on any webpage (after loading extension)

// 1. Test basic content detection with enhanced features
const detector = new ContentDetector();
const elements = detector.detectTextElements();
console.log('🧠 ENHANCED DETECTION FEATURES:');
console.log('- Site brand detected:', detector.siteBrand);
console.log('- Brand variations:', detector.brandVariations);
elements.forEach((info, element) => {
    console.log(`${info.tagName}: "${info.originalText.substring(0, 30)}..." (${info.lengthCategory}, ${info.wordCount} words, brand: ${info.isBrandElement})`);
});

// 2. Test NEW Visual Analysis with Screenshots (requires API key)
const visualAnalyzer = new VisualAnalyzer();
const transformData = {
    productTitle: "Your LSAT Tutoring Service",
    productDescription: "Comprehensive LSAT preparation with personalized tutoring",
    tone: "professional",
    apiKey: "your-api-key-here"
};

// This will capture screenshots and analyze with GPT-4o Vision
visualAnalyzer.analyzePageVisually(transformData)
    .then(analysis => {
        console.log('📸 VISUAL ANALYSIS WITH GPT-4o:');
        console.log('- Visual Analysis:', analysis.visualAnalysis);
        console.log('- Page Structure:', analysis.pageStructure);
        console.log('- Implementation Steps:', analysis.implementationSteps);
        console.log('- Quality Checks:', analysis.qualityChecks);
        return analysis;
    })
    .catch(error => console.error('Visual analysis failed:', error));

// 3. Test Complete Comprehensive Transformation
window.SiteSwitcher.instance.analyzeAndTransformPage(transformData, (response) => {
    console.log('🎯 COMPREHENSIVE TRANSFORMATION RESPONSE:', response);
});

// 4. Monitor the full transformation process
const originalLog = console.log;
console.log = (...args) => {
    if (args[0] && args[0].includes('📸') || args[0].includes('🧠') || args[0].includes('🎯')) {
        originalLog('🔍 TRANSFORMATION STEP:', ...args);
    }
    originalLog(...args);
};

// 5. Test individual components
console.log('🧪 TESTING INDIVIDUAL COMPONENTS:');

// Test brand detection
const brands = document.querySelectorAll('h1, h2, .logo, .brand, [class*="logo"]');
console.log('📍 Potential brand elements found:', brands.length);
brands.forEach((brand, i) => {
    console.log(`Brand ${i + 1}: "${brand.textContent.trim().substring(0, 50)}..."`);
});

// Test button detection
const buttons = document.querySelectorAll('button, .btn, [role="button"], input[type="submit"], a[class*="button"]');
console.log('🔘 Buttons found:', buttons.length);
buttons.forEach((btn, i) => {
    const text = btn.textContent.trim() || btn.getAttribute('aria-label') || 'No text';
    console.log(`Button ${i + 1}: "${text}"`);
});

// Test section detection
const sections = document.querySelectorAll('section, .section, main > div, [class*="section"]');
console.log('📑 Sections found:', sections.length);
sections.forEach((section, i) => {
    const type = section.className.toLowerCase().includes('hero') ? 'hero' : 
                 section.className.toLowerCase().includes('feature') ? 'features' :
                 section.className.toLowerCase().includes('about') ? 'about' : 'content';
    console.log(`Section ${i + 1}: ${type} (${section.offsetHeight}px tall)`);
});
```

### Test Screenshot Capture System (Fixed CSP Issues)
```javascript
// Test html2canvas screenshot functionality (now bundled locally)
const visualAnalyzer = new VisualAnalyzer();

// Test screenshot capture (without API call)
visualAnalyzer.capturePageScreenshots()
    .then(() => {
        console.log('📸 Screenshots captured:', visualAnalyzer.screenshots.size);
        visualAnalyzer.screenshots.forEach((screenshot, name) => {
            console.log(`Screenshot ${name}: ${screenshot.length} bytes`);
        });
    })
    .catch(error => console.error('Screenshot capture failed:', error));
```

### Test Comprehensive Page Transformation (Fixed Coverage Issues)
```javascript
// Test the enhanced comprehensive transformation system
const siteSwitcher = window.SiteSwitcher.instance;

// 1. Test comprehensive element detection
const allElements = siteSwitcher.findAllTransformableElements();
console.log('🧪 COMPREHENSIVE ELEMENT DETECTION:');
console.log(`Total transformable elements found: ${allElements.length}`);

// 2. Test section categorization
const elementsBySection = siteSwitcher.categorizeElementsBySection(allElements);
console.log('📑 ELEMENTS BY SECTION:');
Object.entries(elementsBySection).forEach(([section, elements]) => {
    if (elements.length > 0) {
        console.log(`${section}: ${elements.length} elements`);
    }
});

// 3. Test fallback analysis (comprehensive even without screenshots)
const transformData = {
    productTitle: "Your LSAT Tutoring Service",
    productDescription: "Comprehensive LSAT preparation with personalized tutoring",
    tone: "professional",
    apiKey: "your-api-key-here"
};

siteSwitcher.createFallbackAnalysis(transformData)
    .then(analysis => {
        console.log('🔄 COMPREHENSIVE FALLBACK ANALYSIS:');
        console.log('- Brand elements found:', analysis.pageStructure.brandElements.length);
        console.log('- Content sections found:', analysis.pageStructure.contentSections.length);
        console.log('- Buttons found:', analysis.pageStructure.buttonElements.length);
        console.log('- Implementation steps:', analysis.implementationSteps.length);
        return analysis;
    });

// 4. Test the new comprehensive transformation mode
siteSwitcher.executeComprehensivePageTransformation(transformData)
    .then(() => {
        console.log('✅ Comprehensive transformation completed');
        console.log('Transformed elements:', siteSwitcher.transformer.getState().transformedCount);
    })
    .catch(error => console.error('Comprehensive transformation failed:', error));
```

### Debug CSP and Loading Issues
```javascript
// Check if html2canvas is properly loaded
console.log('🧪 HTML2CANVAS STATUS:');
console.log('- Available:', !!window.html2canvas);
console.log('- Version:', window.html2canvas?.version || 'Unknown');

// Check extension loading status
console.log('🧪 EXTENSION STATUS:');
console.log('- Content script loaded:', !!window.SiteSwitcher);
console.log('- Visual analyzer available:', !!window.VisualAnalyzer);
console.log('- Content detector available:', !!window.ContentDetector);
console.log('- Content transformer available:', !!window.ContentTransformer);

// Test comprehensive detection without visual analysis
console.log('🧪 COMPREHENSIVE DETECTION TEST:');
const siteSwitcher = window.SiteSwitcher.instance;
const detectedElements = siteSwitcher.state.detectedElements || siteSwitcher.detector.detectTextElements();
const allElements = siteSwitcher.findAllTransformableElements();

console.log(`Standard detection: ${detectedElements.size || 0} elements`);
console.log(`Comprehensive detection: ${allElements.length} elements`);
console.log(`Coverage improvement: ${allElements.length - (detectedElements.size || 0)} additional elements`);
```

### Validate OpenAI API Key
```bash
# In browser console:
const client = new OpenAIClient('your-api-key-here');
client.testApiKey().then(console.log);
```

## File Management Commands

### View Extension Files Structure
```bash
# PowerShell (Windows):
Get-ChildItem -Recurse -Name

# Command Prompt (Windows):
tree /f

# Or view in File Explorer
```

### Edit Extension Files
```bash
# Open in VS Code:
code .

# Or open specific files:
code popup/popup.js
code content/content.js
code manifest.json
```

## Debugging Commands

### Clear Extension Storage
```bash
# In browser console:
chrome.storage.local.clear()

# Or through extension popup:
# Click "Settings" → "Clear All Data"
```

### Reset Extension State
```bash
# In browser console (on any page):
chrome.runtime.sendMessage({action: 'clearAllData'})

# Or manually reload extension from chrome://extensions/
```

### Check Storage Contents
```bash
# In browser console:
chrome.storage.local.get(null).then(console.log)

# Or specific keys:
chrome.storage.local.get(['apiKey', 'settings']).then(console.log)
```

## API Testing Commands

### Test OpenAI API Connection
```bash
# In browser console:
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY_HERE'
  }
}).then(r => r.json()).then(console.log)
```

### Simulate API Calls
```bash
# In content script context:
const transformer = new ContentTransformer();
transformer.generateContent('Test prompt', 'your-api-key').then(console.log);
```

## Chrome Extension Packaging

### Create Extension Package (for Chrome Web Store)
```bash
# In Chrome extensions page:
# Click "Pack extension"
# Select extension root directory
# This creates a .crx file and .pem key file
```

### Generate Extension ID
```bash
# Load unpacked extension
# Copy the Extension ID from chrome://extensions/
# Use this ID for development and testing
```

## Performance Testing Commands

### Monitor Extension Performance
```bash
# In Chrome DevTools (F12):
# Performance tab → Record → Use extension → Stop recording
# Analyze performance impact

# Memory tab → Take heap snapshot
# Check for memory leaks
```

### Test API Rate Limiting
```bash
# In browser console:
// Test rapid API calls
for(let i = 0; i < 10; i++) {
  chrome.tabs.sendMessage(tabId, {action: 'transform', data: testData});
}
```

## Troubleshooting Commands

### Common Loading Issues

#### Service Worker Registration Failed (Status Code 15)
```bash
# This usually means there's a JavaScript error in background.js
# Check the background script console:
# 1. Go to chrome://extensions/
# 2. Find your extension
# 3. Click "service worker" link to see errors
# 4. Common issues:
#    - Using Chrome APIs without proper permissions (alarms, contextMenus, tabs)
#    - JavaScript syntax errors
#    - Trying to access undefined objects

# Fix by disabling non-essential APIs:
# Comment out: chrome.alarms, chrome.contextMenus, chrome.tabs event listeners
```

#### Missing Icon Files Error
```bash
# If you get icon-related errors:
# 1. Either create actual PNG icon files
# 2. OR remove icon references from manifest.json temporarily

# To work without icons (temporary solution):
# Remove these sections from manifest.json:
# - "default_icon" object in "action"
# - "icons" object at root level
```

#### TypeError: Cannot read properties of undefined (reading 'onAlarm')
```bash
# This means the background script is trying to use Chrome alarms API
# without proper permissions

# Fix: Comment out all chrome.alarms related code in background.js:
# - chrome.alarms.onAlarm.addListener()
# - chrome.alarms.create()
# - setupPeriodicTasks() function calls

# These features are not essential for core extension functionality
```

#### "No transformable content found on this page"
```bash
# This error means the content detection algorithm didn't find any suitable elements
# Debug content detection:

# 1. Check if page has basic elements:
console.log('Basic elements:', document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,div,span').length);

# 2. Test detection algorithm:
const detector = new ContentDetector();
const elements = detector.detectTextElements();
console.log('Detected elements:', elements.size);

# 3. Check detection stats:
console.log('Detection stats:', detector.getStats());

# 4. Test fallback detection:
document.querySelectorAll('h1').forEach(h1 => console.log('H1:', h1.textContent));
document.querySelectorAll('p').forEach(p => console.log('P:', p.textContent.substring(0, 50)));

# Common causes:
# - Page content loaded dynamically (wait a few seconds and try again)
# - Content inside iframes (not accessible)
# - Very restrictive CSS selectors
# - All text is inside forms/navigation (intentionally ignored)
```

### Check Extension Permissions
```bash
# In chrome://extensions/
# Click "Details" on Site Switcher
# Review permissions section
```

### Verify Manifest Validity
```bash
# Use Chrome's manifest validator:
# Load extension → Check for manifest errors in extensions page
```

### Test Content Script Injection
```bash
# In browser console:
console.log('Content scripts loaded:', !!window.SiteSwitcher);
```

## Content Quality Testing (v1.7+)

### Test Quote Prevention and Duplicate Avoidance
```javascript
// 1. Test on any website with the extension loaded
// 2. Open browser console (F12)
// 3. Enter your product details and transform the page
// 4. Monitor console output for:

// - Quote prevention verification:
console.log('🧪 QUOTE PREVENTION TEST:');
// Look for clean content without surrounding quotes in transformed elements

// - Duplicate transformation prevention:
console.log('🧪 DUPLICATE PREVENTION TEST:');
// Watch for "⏭️ Skipping already transformed element" messages

// - Transformation tracking:
console.log('🧪 TRANSFORMATION TRACKING:');
// Final summary will show breakdown by strategy:
// "Total: X elements (brand_replacement: 2, button_preserved: 3, ai_generated: 15)"

// 5. Test regenerate functionality:
// Click "Regenerate" and verify elements aren't transformed multiple times
```

### Test Content Cleaning Function
```javascript
// Test the content cleaning directly in console:
const transformer = new ContentTransformer();

// Test various problematic inputs:
const testInputs = [
    '"This has quotes around it"',
    "'Single quoted text'",
    "Text with **bold** and *italic* markdown",
    "Text with `code blocks` included",
    "Text with <strong>HTML tags</strong>",
    "Multiple    spaces    between    words"
];

console.log('🧪 CONTENT CLEANING TEST:');
testInputs.forEach(input => {
    const cleaned = transformer.cleanGeneratedContent(input);
    console.log(`Input:  "${input}"`);
    console.log(`Output: "${cleaned}"`);
    console.log('---');
});
```

### Verify Transformation Summary
```javascript
// After transforming a page, check the final summary:
const siteSwitcher = window.SiteSwitcher.instance;
const summary = siteSwitcher.getTransformationSummary();
console.log('📊 TRANSFORMATION SUMMARY:', summary);

// Example expected output:
// "Total: 23 elements (brand_replacement: 2, button_preserved: 4, ai_generated: 17)"

// This confirms:
// - Total number of unique transformations
// - Breakdown by transformation strategy
// - No duplicate transformations occurred
```

### Debug Multiple Transformation Issues (Fixed v1.8+)
```javascript
// DIAGNOSTIC TEST - Check for multiple transformation issues
console.log('🔍 DEBUGGING MULTIPLE TRANSFORMATION ISSUES');
console.log('==========================================');

// 1. Check for observer pause/resume system
const siteSwitcher = window.SiteSwitcher.instance;
const transformer = siteSwitcher.transformer;
console.log(`1️⃣ OBSERVER STATUS: ${transformer.observerPaused ? 'PAUSED' : 'ACTIVE'}`);

// 2. Check transformation markers
const transformedMarkers = document.querySelectorAll('[data-site-switcher-transformed]');
console.log(`2️⃣ TRANSFORMATION MARKERS: ${transformedMarkers.length} elements marked`);

// 3. Check transformedContent Map
const transformedElements = transformer.transformedContent;
console.log(`3️⃣ TRANSFORMED CONTENT MAP: ${transformedElements.size} elements tracked`);

// 4. Look for any discrepancies
if (transformedMarkers.length !== transformedElements.size) {
    console.warn(`⚠️ MISMATCH: ${transformedMarkers.length} markers vs ${transformedElements.size} tracked`);
} else {
    console.log(`✅ CONSISTENCY: Markers and tracking aligned`);
}

// 5. Check MutationObserver activity
let mutationCount = 0;
const testObserver = new MutationObserver(() => mutationCount++);
testObserver.observe(document.body, { childList: true, subtree: true });

setTimeout(() => {
    testObserver.disconnect();
    console.log(`5️⃣ MUTATION ACTIVITY: ${mutationCount} mutations detected in last 2 seconds`);
    if (mutationCount > 10) {
        console.warn('⚠️ High mutation activity - may indicate transformation loops');
    }
}, 2000);

// 6. Test transformation safety
const testElement = document.createElement('div');
testElement.textContent = 'Test element';
document.body.appendChild(testElement);
console.log(`6️⃣ TEST ELEMENT: Created for safety testing`);

setTimeout(() => {
    if (testElement.hasAttribute('data-site-switcher-transformed')) {
        console.warn('⚠️ Test element was marked as transformed - possible over-processing');
    } else {
        console.log('✅ Test element not affected - transformation targeting correct');
    }
    testElement.remove();
}, 1000);

console.log('==========================================');
console.log('🎯 MULTIPLE TRANSFORMATION FIXES (v1.8):');
console.log('   - Observer pause/resume during transformations');
console.log('   - Element marking system prevents re-processing');
console.log('   - MutationObserver filters our own changes');
console.log('   - Regenerate/reset properly clears markers');
```

### Force Comprehensive Transformation Test
```javascript
// If only one element is transforming, force comprehensive transformation:
console.log('🚀 FORCING COMPREHENSIVE TRANSFORMATION TEST');

const siteSwitcher = window.SiteSwitcher.instance;
const transformData = {
    productTitle: "Test Product",
    productDescription: "Test description for comprehensive transformation",
    tone: "professional",
    apiKey: "your-api-key-here"
};

// Force run comprehensive page transformation
siteSwitcher.executeComprehensivePageTransformation(transformData)
    .then(() => {
        const finalCount = siteSwitcher.transformer.getState().transformedCount;
        console.log(`✅ COMPREHENSIVE TRANSFORMATION COMPLETE: ${finalCount} elements transformed`);
        console.log('📊 FINAL SUMMARY:', siteSwitcher.getTransformationSummary());
    })
    .catch(error => {
        console.error('❌ COMPREHENSIVE TRANSFORMATION FAILED:', error);
    });
```

### Check Background Script Status
```bash
# Go to chrome://extensions/
# Click "service worker" link under Site Switcher
# Check if background script is active
```

## File Backup Commands

### Backup Extension Data
```bash
# PowerShell:
Copy-Item -Recurse "Site Switcher" "Site Switcher_backup_$(Get-Date -Format 'yyyy-MM-dd')"

# Or create ZIP:
Compress-Archive -Path "Site Switcher" -DestinationPath "site-switcher-backup.zip"
```

### Export User Settings
```bash
# In browser console:
chrome.storage.local.get().then(data => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'site-switcher-settings.json';
  a.click();
});
```

## Quick Reference

### Essential Shortcuts
- **Reload Extension**: Chrome extensions page → Reload button
- **Open Popup**: Click extension icon in toolbar
- **View Console**: F12 → Console
- **Extension Details**: chrome://extensions/ → Details
- **Clear Storage**: Browser console → `chrome.storage.local.clear()`

### Common File Paths
- Extension root: `./`
- Popup files: `./popup/`
- Content scripts: `./content/`
- Background script: `./background/background.js`
- Manifest: `./manifest.json`

### Important URLs
- Extensions page: `chrome://extensions/`
- Extension popup inspection: Right-click icon → Inspect popup
- Chrome Web Store: `https://chrome.google.com/webstore/developer/dashboard`
- OpenAI API: `https://platform.openai.com/api-keys`

---

Keep this document updated as new commands or procedures are added to the development workflow. 