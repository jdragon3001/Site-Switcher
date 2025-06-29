// Main Content Script
// Coordinates between detector and transformer, handles popup communication

console.log('🚀 Site Switcher content script loading...');

class SiteSwitcher {
    constructor() {
        this.detector = new ContentDetector();
        this.visualAnalyzer = new VisualAnalyzer();
        this.transformer = new ContentTransformer();
        this.state = {
            isActive: false,
            isAnalyzing: false,
            detectedElements: null,
            visualAnalysis: null
        };
    }

    // Initialize the system
    async initialize() {
        console.log('🔧 Initializing Site Switcher...');
        
        try {
            // Set up message listener for popup communication
            this.setupMessageListener();
            
            // Diagnostic information
            this.logDiagnostics();
            
            console.log('✅ Site Switcher initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Site Switcher initialization failed:', error);
            return false;
        }
    }

    // Set up communication with popup
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📨 Content script received message:', message.action);
            
            this.handleMessage(message, sendResponse);
            return true; // Keep message channel open for async response
        });
    }

    // Handle messages from popup
    async handleMessage(message, sendResponse) {
        try {
            switch (message.action) {
                case 'ping':
                    sendResponse({ success: true, message: 'Content script ready' });
                    break;

                case 'checkReady':
                    const isReady = await this.checkReadiness();
                    sendResponse({ success: true, ready: isReady });
                    break;

                case 'analyzeAndTransform':
                    console.log('🧠 Starting comprehensive visual analysis and transformation...');
                    await this.analyzeAndTransformPage(message.data, sendResponse);
                    break;

                case 'regenerate':
                    console.log('🔄 Regenerating content...');
                    await this.regenerateContent(sendResponse);
                    break;

                case 'reset':
                    console.log('↩️ Resetting to original content...');
                    await this.resetToOriginal(sendResponse);
                    break;

                case 'getState':
                    sendResponse({ 
                        success: true, 
                        state: this.getSystemState() 
                    });
                    break;

                default:
                    console.warn('⚠️ Unknown message action:', message.action);
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            sendResponse({ 
                success: false, 
                error: error.message,
                stack: error.stack 
            });
        }
    }

    // MAIN METHOD: Comprehensive visual analysis and transformation
    async analyzeAndTransformPage(transformData, sendResponse) {
        try {
            this.state.isAnalyzing = true;
            
            // Send initial status
            sendResponse({ 
                success: true, 
                status: 'started',
                message: 'Starting comprehensive analysis...' 
            });

            // Phase 1: Visual Analysis with Screenshots
            console.log('📸 Phase 1: Visual Analysis with Screenshots');
            try {
                this.state.visualAnalysis = await this.visualAnalyzer.analyzePageVisually(transformData);
                console.log('✅ Visual analysis complete:', this.state.visualAnalysis);
            } catch (visualError) {
                console.warn('⚠️ Visual analysis failed, falling back to DOM analysis:', visualError);
                this.state.visualAnalysis = await this.createFallbackAnalysis(transformData);
            }

            // Phase 2: Enhanced Content Detection
            console.log('🔍 Phase 2: Enhanced Content Detection');
            this.state.detectedElements = this.detector.detectTextElements();
            console.log(`✅ Detected ${this.state.detectedElements.size} elements`);

            // Phase 3: Execute Comprehensive Transformation
            console.log('🎯 Phase 3: Executing Comprehensive Transformation');
            await this.executeComprehensiveTransformation(transformData);

            this.state.isActive = true;
            this.state.isAnalyzing = false;

            // Send completion message via chrome.runtime since sendResponse may have timed out
            chrome.runtime.sendMessage({
                action: 'transformationComplete',
                data: {
                    success: true,
                    transformedCount: this.transformer.getState().transformedCount,
                    sectionsAnalyzed: this.state.visualAnalysis.pageStructure?.contentSections?.length || 0,
                    visualAnalysisUsed: !!this.state.visualAnalysis.visualAnalysis
                }
            });

        } catch (error) {
            console.error('❌ Comprehensive transformation failed:', error);
            this.state.isAnalyzing = false;
            
            chrome.runtime.sendMessage({
                action: 'transformationError',
                data: {
                    success: false,
                    error: error.message,
                    fallbackAvailable: true
                }
            });
        }
    }

    // Execute comprehensive transformation using visual analysis
    async executeComprehensiveTransformation(transformData) {
        const implementationSteps = this.state.visualAnalysis.implementationSteps || [];
        
        console.log(`🎯 Executing comprehensive transformation with ${implementationSteps.length} implementation steps...`);
        
        let initialTransformedCount = this.transformer.getState().transformedCount;
        console.log(`📊 Starting transformation phase with ${initialTransformedCount} already transformed elements`);

        // Execute each implementation step
        for (const step of implementationSteps) {
            try {
                const beforeStepCount = this.transformer.getState().transformedCount;
                await this.executeTransformationStep(step, transformData);
                const afterStepCount = this.transformer.getState().transformedCount;
                console.log(`📊 Step ${step.type} added ${afterStepCount - beforeStepCount} transformations`);
            } catch (stepError) {
                console.warn(`⚠️ Step failed: ${step.type}`, stepError);
            }
        }

        // Check coverage after implementation steps
        const afterStepsCount = this.transformer.getState().transformedCount;
        const addedBySteps = afterStepsCount - initialTransformedCount;
        console.log(`📊 Implementation steps complete: ${addedBySteps} new transformations (total: ${afterStepsCount})`);

        // ❌ DISABLED: This was causing re-editing problems!
        // The first round of transformations is perfect - don't mess with it!
        console.log(`✅ Transformation complete! First round results are excellent - preserving them.`);
        console.log(`🎯 Final result: ${afterStepsCount} elements transformed through targeted implementation steps`);
        
        // ORIGINAL PROBLEMATIC CODE (commented out):
        // await this.executeRemainingTransformations(transformData);
    }

    // Execute individual transformation step
    async executeTransformationStep(step, transformData) {
        console.log(`🔧 Executing step: ${step.type} (priority: ${step.priority})`);

        switch (step.type) {
            case 'brand_replacement':
                await this.executeBrandReplacements(step.elements, transformData);
                break;
                
            case 'button_handling':
                await this.executeButtonHandling(step.elements, transformData);
                break;
                
            case 'section_transformation':
                await this.executeSectionTransformations(step.elements, transformData);
                break;
                
            default:
                console.warn(`⚠️ Unknown step type: ${step.type}`);
        }
    }

    // Execute brand replacements (highest priority)
    async executeBrandReplacements(brandReplacements, transformData) {
        console.log(`🏷️ Executing brand replacements... (${brandReplacements?.length || 0} replacements)`);
        
        if (!brandReplacements || brandReplacements.length === 0) {
            console.log('🏷️ No brand replacements to process');
            return;
        }

        let totalBrandReplacements = 0;
        
        for (const replacement of brandReplacements) {
            console.log(`🔍 Looking for brand text: "${replacement.current}" to replace with "${replacement.new || transformData.productTitle}"`);
            
            // Find elements that match the brand replacement criteria
            const elements = this.findElementsForBrandReplacement(replacement);
            console.log(`📍 Found ${elements.length} potential brand elements`);
            
            for (const element of elements) {
                // CRITICAL: Check if element was already transformed
                if (this.transformer.transformedContent.has(element)) {
                    console.log(`⏭️ Skipping already transformed brand element: "${element.textContent.substring(0, 30)}..."`);
                    continue;
                }

                try {
                    // Direct replacement with product title
                    const newText = replacement.new || transformData.productTitle;
                    const originalText = element.textContent;
                    
                    this.transformer.applyTransformation(element, newText);
                    
                    // Mark as transformed immediately
                    this.transformer.transformedContent.set(element, {
                        originalText: originalText,
                        newText: newText,
                        strategy: 'brand_replacement',
                        timestamp: Date.now()
                    });
                    
                    totalBrandReplacements++;
                    console.log(`✅ Brand replacement: "${replacement.current}" → "${newText}"`);
                } catch (error) {
                    console.warn(`⚠️ Brand replacement failed for element:`, error);
                }
            }
        }
        
        console.log(`🏷️ Brand replacement phase complete: ${totalBrandReplacements} elements transformed`);
    }

    // Execute button handling (preserve functionality)
    async executeButtonHandling(buttonStrategy, transformData) {
        console.log('🔘 Executing button handling...');

        for (const btnInfo of buttonStrategy || []) {
            const buttons = this.findButtonsByText(btnInfo.text);
            
            for (const button of buttons) {
                // CRITICAL: Check if element was already transformed
                if (this.transformer.transformedContent.has(button)) {
                    console.log(`⏭️ Skipping already transformed button: "${button.textContent.substring(0, 20)}..."`);
                    continue;
                }

                try {
                    const originalText = button.textContent.trim();
                    let newText = null;
                    let action = 'preserved';

                    if (btnInfo.action === 'preserve') {
                        // Keep original text - no change needed, just mark as processed
                        newText = originalText;
                        action = 'preserved';
                        console.log(`✅ Button preserved: "${btnInfo.text}"`);
                    } else if (btnInfo.action === 'replace' && btnInfo.new) {
                        // Replace with new text
                        newText = btnInfo.new;
                        this.transformer.applyTransformation(button, btnInfo.new);
                        action = 'replaced';
                        console.log(`✅ Button replaced: "${btnInfo.text}" → "${btnInfo.new}"`);
                    } else if (!originalText) {
                        // Fix empty buttons
                        newText = 'Learn More';
                        this.transformer.applyTransformation(button, 'Learn More');
                        action = 'fixed';
                        console.log(`✅ Empty button fixed: → "Learn More"`);
                    }

                    // Mark as processed to prevent future transformation
                    if (newText) {
                        this.transformer.transformedContent.set(button, {
                            originalText: originalText,
                            newText: newText,
                            strategy: `button_${action}`,
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.warn(`⚠️ Button handling failed:`, error);
                }
            }
        }
    }

    // Execute section transformations (comprehensive coverage)
    async executeSectionTransformations(sectionCoverage, transformData) {
        console.log(`📑 Executing section transformations... (${sectionCoverage?.length || 0} sections)`);
        
        if (!sectionCoverage || sectionCoverage.length === 0) {
            console.log('📑 No section transformations to process');
            return;
        }

        let totalSectionTransformations = 0;

        for (const sectionInfo of sectionCoverage) {
            if (!sectionInfo.transform) {
                console.log(`⏭️ Skipping section ${sectionInfo.section} (transform: false)`);
                continue;
            }

            console.log(`🔍 Processing section: ${sectionInfo.section}`);

            try {
                const sectionElements = this.findSectionElements(sectionInfo.section);
                console.log(`📍 Found ${sectionElements.length} elements in ${sectionInfo.section} section`);
                
                let transformedCount = 0;
                let skippedCount = 0;
                
                // Transform elements within this section
                for (const element of sectionElements) {
                    // CRITICAL: Check if element was already transformed
                    if (this.transformer.transformedContent.has(element)) {
                        skippedCount++;
                        console.log(`⏭️ Skipping already transformed element in ${sectionInfo.section}: "${element.textContent.substring(0, 30)}..."`);
                        continue;
                    }

                    const elementInfo = this.createElementInfoForTransformation(element);
                    if (elementInfo) {
                        try {
                            console.log(`🎯 Transforming ${elementInfo.tagName} in ${sectionInfo.section}: "${elementInfo.originalText.substring(0, 30)}..."`);
                            await this.transformer.transformElement(elementInfo, transformData);
                            transformedCount++;
                            totalSectionTransformations++;
                        } catch (error) {
                            console.warn(`⚠️ Failed to transform element in ${sectionInfo.section}:`, error);
                        }
                    } else {
                        console.log(`⏭️ Skipping element in ${sectionInfo.section} (no elementInfo created)`);
                    }
                }
                
                console.log(`✅ Section completed: ${sectionInfo.section} (${transformedCount} new, ${skippedCount} already done, ${sectionElements.length} total)`);
                
            } catch (error) {
                console.warn(`⚠️ Section transformation failed for ${sectionInfo.section}:`, error);
            }
        }
        
        console.log(`📑 Section transformation phase complete: ${totalSectionTransformations} elements transformed`);
    }

    // Execute remaining transformations for comprehensive coverage
    async executeRemainingTransformations(transformData) {
        console.log('🔄 Executing remaining transformations for full page coverage...');

        const detectedElementsArray = Array.from(this.state.detectedElements.values());
        const remainingElements = detectedElementsArray.filter(elementInfo => 
            !this.transformer.transformedContent.has(elementInfo.element)
        );

        console.log(`📝 Found ${remainingElements.length} remaining elements to transform`);

        // If we still have a lot of elements, it means the visual analysis strategy didn't cover much
        // Let's be more aggressive about transforming everything
        if (remainingElements.length > detectedElementsArray.length * 0.7) {
            console.log('🎯 Visual analysis covered minimal elements - switching to comprehensive mode');
            await this.executeComprehensivePageTransformation(transformData);
        } else {
            // Transform remaining elements individually
            console.log(`🔄 Transforming ${remainingElements.length} remaining elements individually...`);
            let individualTransformCount = 0;
            
            for (const elementInfo of remainingElements) {
                try {
                    await this.transformer.transformElement(elementInfo, transformData);
                    individualTransformCount++;
                    console.log(`✅ Individual transform ${individualTransformCount}/${remainingElements.length}: "${elementInfo.originalText.substring(0, 30)}..."`);
                    await this.delay(100); // Small delay between elements
                } catch (elementError) {
                    console.warn(`⚠️ Individual transformation failed:`, elementError);
                }
            }
            
            console.log(`✅ Individual transformations complete: ${individualTransformCount} elements transformed`);
        }

        // Final summary
        const finalStats = this.getTransformationSummary();
        console.log(`✅ Comprehensive transformation complete. ${finalStats}`);
    }

    // Get transformation summary to track duplicates
    getTransformationSummary() {
        const transformedElements = this.transformer.transformedContent;
        const strategies = {};
        
        transformedElements.forEach((info, element) => {
            const strategy = info.strategy || 'unknown';
            strategies[strategy] = (strategies[strategy] || 0) + 1;
        });

        const summary = Object.entries(strategies)
            .map(([strategy, count]) => `${strategy}: ${count}`)
            .join(', ');
            
        return `Total: ${transformedElements.size} elements (${summary})`;
    }

    // Execute comprehensive page transformation (when visual analysis is minimal)
    async executeComprehensivePageTransformation(transformData) {
        console.log('🌐 Starting comprehensive page transformation...');

        // Get ALL text elements from the page, not just detected ones
        const allTextElements = this.findAllTransformableElements();
        console.log(`📋 Found ${allTextElements.length} total transformable elements on page`);

        // Categorize elements by sections for better organization
        const elementsBySection = this.categorizeElementsBySection(allTextElements);
        
        // Transform section by section for better organization
        for (const [sectionName, elements] of Object.entries(elementsBySection)) {
            if (elements.length === 0) continue;
            
            console.log(`📑 Transforming ${sectionName} section: ${elements.length} elements`);
            
            try {
                // Transform all elements in this section
                let sectionTransformed = 0;
                let sectionSkipped = 0;
                
                for (const element of elements) {
                    if (this.transformer.transformedContent.has(element)) {
                        sectionSkipped++;
                        // Skip already transformed elements
                        continue;
                    }

                    const elementInfo = this.createElementInfoForTransformation(element);
                    if (elementInfo) {
                        try {
                            await this.transformer.transformElement(elementInfo, transformData);
                            sectionTransformed++;
                            await this.delay(100); // Small delay between elements
                        } catch (elementError) {
                            console.warn(`⚠️ Failed to transform element in ${sectionName}:`, elementError);
                        }
                    }
                }
                
                console.log(`📊 ${sectionName}: ${sectionTransformed} transformed, ${sectionSkipped} skipped`);
                console.log(`✅ Completed ${sectionName} section`);
                
            } catch (sectionError) {
                console.warn(`⚠️ Error transforming ${sectionName} section:`, sectionError);
            }
        }
    }

    // Find ALL transformable text elements on the page
    findAllTransformableElements() {
        const elements = [];
        
        // Very comprehensive selectors
        const selectors = [
            'h1, h2, h3, h4, h5, h6',  // All headings
            'p',                        // Paragraphs
            'li',                       // List items
            'span',                     // Spans with substantial text
            'div',                      // Divs with direct text content
            'a',                        // Links
            'blockquote',              // Quotes
            'figcaption',              // Figure captions
            '.text, .content, .copy',   // Common text classes
            '[class*="text"]',          // Any class containing "text"
            '[class*="title"]',         // Any class containing "title"
            '[class*="heading"]',       // Any class containing "heading"
            '[class*="description"]',   // Any class containing "description"
            '[class*="content"]'        // Any class containing "content"
        ];

        for (const selector of selectors) {
            try {
                document.querySelectorAll(selector).forEach(element => {
                    const text = element.textContent?.trim();
                    
                    // Check if element has meaningful text content
                    if (text && 
                        text.length >= 3 && 
                        text.length <= 2000 && // Not too long
                        this.isElementVisible(element) &&
                        !this.isIgnoredElement(element) &&
                        this.hasDirectTextContent(element)) {
                        
                        elements.push(element);
                    }
                });
            } catch (selectorError) {
                console.warn(`Error with selector ${selector}:`, selectorError);
            }
        }

        // Remove duplicates
        return [...new Set(elements)];
    }

    // Categorize elements by page sections
    categorizeElementsBySection(elements) {
        const sections = {
            header: [],
            hero: [],
            features: [],
            about: [],
            testimonials: [],
            pricing: [],
            contact: [],
            footer: [],
            other: []
        };

        elements.forEach(element => {
            const sectionType = this.determineSectionType(element);
            sections[sectionType].push(element);
        });

        return sections;
    }

    // Determine which section an element belongs to
    determineSectionType(element) {
        // Check parent containers for section hints
        let current = element;
        while (current && current !== document.body) {
            const classes = current.className?.toLowerCase() || '';
            const tagName = current.tagName?.toLowerCase() || '';
            
            // Header section
            if (tagName === 'header' || classes.includes('header')) return 'header';
            
            // Hero section
            if (classes.includes('hero') || classes.includes('banner') || classes.includes('jumbotron')) return 'hero';
            
            // Features section
            if (classes.includes('feature') || classes.includes('benefit') || classes.includes('service')) return 'features';
            
            // About section
            if (classes.includes('about')) return 'about';
            
            // Testimonials section
            if (classes.includes('testimonial') || classes.includes('review')) return 'testimonials';
            
            // Pricing section
            if (classes.includes('pricing') || classes.includes('plan')) return 'pricing';
            
            // Contact section
            if (classes.includes('contact')) return 'contact';
            
            // Footer section
            if (tagName === 'footer' || classes.includes('footer')) return 'footer';
            
            current = current.parentElement;
        }

        // Check position on page for additional hints
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollTop;
        const pageHeight = document.documentElement.scrollHeight;
        const relativePosition = elementTop / pageHeight;

        if (relativePosition < 0.1) return 'header';
        if (relativePosition < 0.3) return 'hero';
        if (relativePosition < 0.7) return 'features';
        if (relativePosition > 0.9) return 'footer';
        
        return 'other';
    }

    // Check if element should be ignored
    isIgnoredElement(element) {
        const ignoredSelectors = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'footer nav', '.nav', '.navbar', '.menu',
            '.copyright', '.legal', '.breadcrumb', '.pagination',
            'form', 'input', 'textarea', 'select', 'button',
            '[contenteditable="false"]', '.no-transform'
        ];

        return ignoredSelectors.some(selector => {
            try {
                return element.matches(selector) || element.closest(selector);
            } catch (e) {
                return false;
            }
        });
    }

    // Check if element has direct text content (not just nested text)
    hasDirectTextContent(element) {
        // Check if element has text nodes as direct children
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return true;
            }
        }
        
        // If no direct text, check if it's a simple element with minimal nesting
        const textLength = element.textContent?.trim().length || 0;
        const childElementCount = element.children.length;
        
        // Allow simple containers with minimal nesting
        return textLength > 0 && (childElementCount === 0 || (childElementCount <= 2 && textLength > 20));
    }

    // Enhanced visibility check
    isElementVisible(element) {
        try {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            return rect.width > 0 && 
                   rect.height > 0 && 
                   style.display !== 'none' && 
                   style.visibility !== 'hidden' &&
                   style.opacity !== '0';
        } catch (error) {
            return true; // Default to visible if check fails
        }
    }

    // Helper methods for finding elements
    findElementsForBrandReplacement(replacement) {
        const elements = [];
        
        // Be more specific about brand replacement - only exact matches or very close matches
        const brandText = replacement.current.toLowerCase().trim();
        
        // Find by various criteria - but be more selective
        const selectors = [
            'h1', // Only main headings
            '.logo, .brand, .site-title', // Logo/brand classes
            '[class*="logo"], [class*="brand"]' // Partial class matches
        ];

        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(el => {
                const elementText = el.textContent.toLowerCase().trim();
                
                // Only match if it's a very close match (exact match or the brand text is a significant portion)
                const isExactMatch = elementText === brandText;
                const isCloseMatch = brandText.length > 3 && elementText.includes(brandText) && 
                                   (brandText.length / elementText.length) > 0.5; // Brand text is >50% of element text
                
                if (isExactMatch || isCloseMatch) {
                    elements.push(el);
                    console.log(`🎯 Found brand element: "${elementText}" matches "${brandText}"`);
                }
            });
        }

        return elements;
    }

    findButtonsByText(text) {
        const buttons = [];
        const selectors = ['button', '.btn', '[role="button"]', 'input[type="submit"]', 'a[class*="button"]'];
        
        for (const selector of selectors) {
            document.querySelectorAll(selector).forEach(btn => {
                if (btn.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
                    buttons.push(btn);
                }
            });
        }
        
        return buttons;
    }

    findSectionElements(sectionType) {
        const elements = [];
        let sectionSelectors = [];

        // Map section types to selectors
        switch (sectionType) {
            case 'hero':
                sectionSelectors = ['.hero', '.banner', '.jumbotron', 'header.hero'];
                break;
            case 'features':
                sectionSelectors = ['.features', '.benefits', '.services', '[class*="feature"]'];
                break;
            case 'about':
                sectionSelectors = ['.about', '.about-us', '[class*="about"]'];
                break;
            case 'testimonials':
                sectionSelectors = ['.testimonials', '.reviews', '[class*="testimonial"]'];
                break;
            default:
                sectionSelectors = ['section', 'main > div'];
        }

        // Find elements within these sections
        for (const selector of sectionSelectors) {
            document.querySelectorAll(selector).forEach(section => {
                // Get text elements within this section
                section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach(textEl => {
                    if (textEl.textContent.trim().length > 3) {
                        elements.push(textEl);
                    }
                });
            });
        }

        return elements;
    }

    createElementInfoForTransformation(element) {
        const text = element.textContent.trim();
        if (text.length < 3) return null;

        return {
            element: element,
            originalText: text,
            tagName: element.tagName.toLowerCase(),
            type: this.categorizeElement(element),
            category: this.determineCategory(element, text),
            wordCount: text.split(/\s+/).length,
            lengthCategory: this.classifyLength(text),
            priority: 5
        };
    }

    categorizeElement(element) {
        const tagName = element.tagName.toLowerCase();
        if (tagName.match(/^h[1-6]$/)) return 'heading';
        if (tagName === 'p') return 'paragraph';
        if (tagName === 'li') return 'list-item';
        return 'text';
    }

    determineCategory(element, text) {
        const classes = element.className.toLowerCase();
        const textLower = text.toLowerCase();

        if (classes.includes('hero') || classes.includes('banner')) return 'headline';
        if (textLower.includes('feature') || textLower.includes('benefit')) return 'feature';
        if (textLower.includes('about')) return 'about';
        return 'body';
    }

    classifyLength(text) {
        const wordCount = text.split(/\s+/).length;
        if (wordCount <= 3) return 'micro';
        if (wordCount <= 8) return 'short';
        if (wordCount <= 25) return 'medium';
        return 'long';
    }

    // Create fallback analysis if visual analysis fails
    async createFallbackAnalysis(transformData) {
        console.log('🔄 Creating comprehensive fallback analysis...');
        
        // Do a more thorough analysis even without screenshots
        const brandElements = this.findBrandElementsFallback();
        const contentSections = this.findContentSectionsFallback();
        const buttons = this.findButtonsFallback();
        
        // Create more comprehensive implementation steps
        const implementationSteps = [
            {
                priority: 10,
                type: 'brand_replacement',
                elements: brandElements.map(brand => ({
                    current: brand.text,
                    new: transformData.productTitle,
                    element: 'brand_element'
                }))
            },
            {
                priority: 9,
                type: 'button_handling',
                elements: buttons.map(btn => ({
                    text: btn.text,
                    action: btn.text.length > 0 ? 'preserve' : 'fix',
                    reason: 'maintain_functionality'
                }))
            }
        ];

        // Add section transformations for each found section
        contentSections.forEach((section, index) => {
            implementationSteps.push({
                priority: 8 - index,
                type: 'section_transformation',
                elements: [{
                    section: section.type,
                    transform: true,
                    element_count: section.elementCount || 1
                }]
            });
        });

        return {
            visualAnalysis: {
                page_analysis: {
                    layout_sections: contentSections.map(s => s.type),
                    brand_locations: brandElements.length > 0 ? ['header', 'main'] : ['header'],
                    visual_hierarchy: 'standard',
                    button_count: buttons.length,
                    total_sections: contentSections.length
                },
                transformation_plan: {
                    brand_replacements: brandElements.map(brand => ({
                        element: 'brand_element',
                        current: brand.text,
                        new: transformData.productTitle
                    })),
                    button_strategy: buttons.map(btn => ({
                        text: btn.text,
                        action: btn.text.length > 0 ? 'preserve' : 'fix',
                        reason: 'maintain_functionality'
                    })),
                    section_coverage: contentSections.map(section => ({
                        section: section.type,
                        transform: true,
                        elements: section.elementCount || 1
                    }))
                }
            },
            pageStructure: {
                brandElements: brandElements,
                contentSections: contentSections,
                buttonElements: buttons
            },
            implementationSteps: implementationSteps
        };
    }

    findBrandElementsFallback() {
        const brands = [];
        
        // Enhanced brand detection
        const brandSelectors = [
            'h1', 'h2',                          // Main headings
            '.logo', '.brand', '.site-title',    // Logo/brand classes
            '[class*="logo"]', '[class*="brand"]', // Partial matches
            'header h1', 'header h2',            // Header headings
            '.navbar-brand', '.header-brand'     // Navigation brands
        ];

        brandSelectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 0 && text.length < 100 && this.isElementVisible(el)) {
                        brands.push({ 
                            element: el, 
                            text: text,
                            selector: selector,
                            prominence: this.calculateElementProminence(el)
                        });
                    }
                });
            } catch (e) {
                console.warn(`Error with brand selector ${selector}:`, e);
            }
        });

        // Sort by prominence and remove duplicates
        return brands
            .sort((a, b) => b.prominence - a.prominence)
            .filter((brand, index, array) => 
                array.findIndex(b => b.text.toLowerCase() === brand.text.toLowerCase()) === index
            )
            .slice(0, 5); // Limit to top 5 brand candidates
    }

    findContentSectionsFallback() {
        const sections = [];
        
        // Comprehensive section detection
        const sectionSelectors = [
            { selector: 'section', type: 'section' },
            { selector: 'main', type: 'main' },
            { selector: '.hero, .banner, .jumbotron', type: 'hero' },
            { selector: '.features, .benefits, .services', type: 'features' },
            { selector: '.about, .about-us', type: 'about' },
            { selector: '.testimonials, .reviews', type: 'testimonials' },
            { selector: '.pricing, .plans', type: 'pricing' },
            { selector: '.contact, .contact-us', type: 'contact' },
            { selector: 'article', type: 'article' },
            { selector: '[class*="section"]', type: 'content' },
            { selector: 'main > div', type: 'content' },
            { selector: '.container > div', type: 'content' }
        ];

        sectionSelectors.forEach(({ selector, type }) => {
            try {
                document.querySelectorAll(selector).forEach(section => {
                    if (section.offsetHeight > 50 && this.isElementVisible(section)) {
                        const textElements = section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div');
                        const meaningfulElements = Array.from(textElements).filter(el => {
                            const text = el.textContent?.trim();
                            return text && text.length > 3 && this.hasDirectTextContent(el);
                        });

                        if (meaningfulElements.length > 0) {
                            sections.push({ 
                                element: section, 
                                type: type,
                                elementCount: meaningfulElements.length,
                                height: section.offsetHeight,
                                selector: selector
                            });
                        }
                    }
                });
            } catch (e) {
                console.warn(`Error with section selector ${selector}:`, e);
            }
        });

        // Remove duplicate sections (same element detected multiple times)
        const uniqueSections = sections.filter((section, index, array) => 
            array.findIndex(s => s.element === section.element) === index
        );

        // Sort by height (larger sections first) and limit
        return uniqueSections
            .sort((a, b) => b.height - a.height)
            .slice(0, 10); // Limit to top 10 sections
    }

    findButtonsFallback() {
        const buttons = [];
        
        const buttonSelectors = [
            'button',
            '.btn',
            '[role="button"]', 
            'input[type="submit"]',
            'input[type="button"]',
            'a[class*="button"]',
            'a[class*="btn"]',
            '.cta',
            '[class*="cta"]'
        ];

        buttonSelectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(btn => {
                    if (this.isElementVisible(btn)) {
                        const text = btn.textContent?.trim() || 
                                   btn.getAttribute('aria-label') || 
                                   btn.getAttribute('title') || 
                                   btn.value || '';
                        
                        buttons.push({
                            element: btn,
                            text: text,
                            selector: selector,
                            context: this.getElementContext(btn)
                        });
                    }
                });
            } catch (e) {
                console.warn(`Error with button selector ${selector}:`, e);
            }
        });

        // Remove duplicates and limit
        return buttons
            .filter((btn, index, array) => 
                array.findIndex(b => b.element === btn.element) === index
            )
            .slice(0, 20); // Limit to 20 buttons
    }

    // Calculate element visual prominence
    calculateElementProminence(element) {
        try {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const fontSize = parseFloat(style.fontSize) || 16;
            const fontWeight = style.fontWeight === 'bold' || parseInt(style.fontWeight) > 400 ? 2 : 1;
            
            // Consider size, position, and styling
            const sizeScore = (rect.width * rect.height) / 1000;
            const positionScore = Math.max(0, window.innerHeight - rect.top); // Higher for elements near top
            const styleScore = fontSize * fontWeight;
            
            return sizeScore + positionScore + styleScore;
        } catch (error) {
            return 0;
        }
    }

    // Get element context (parent section)
    getElementContext(element) {
        const parent = element.closest('section, header, footer, nav, main, .hero, .cta, .features');
        return parent ? parent.tagName.toLowerCase() + (parent.className ? '.' + parent.className.split(' ')[0] : '') : 'page';
    }

    // Regenerate content
    async regenerateContent(sendResponse) {
        try {
            if (!this.state.isActive) {
                sendResponse({ 
                    success: false, 
                    error: 'No active transformation to regenerate' 
                });
                return;
            }

            const result = await this.transformer.regenerate();
            sendResponse({ 
                success: true, 
                message: 'Content regenerated successfully',
                state: this.getSystemState()
            });

        } catch (error) {
            console.error('❌ Regeneration failed:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Reset to original content
    async resetToOriginal(sendResponse) {
        try {
            await this.transformer.resetPage();
            this.state.isActive = false;
            this.state.detectedElements = null;
            this.state.visualAnalysis = null;

            sendResponse({ 
                success: true, 
                message: 'Page reset to original content',
                state: this.getSystemState()
            });

        } catch (error) {
            console.error('❌ Reset failed:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    // Check if system is ready
    async checkReadiness() {
        try {
            // Test basic DOM access
            const hasElements = document.querySelectorAll('h1, h2, h3, p').length > 0;
            
            // Test content detection
            const elements = this.detector.detectTextElements();
            const hasDetectedElements = elements.size > 0;
            
            return hasElements && hasDetectedElements;
            
        } catch (error) {
            console.error('❌ Readiness check failed:', error);
            return false;
        }
    }

    // Get current system state
    getSystemState() {
        return {
            isActive: this.state.isActive,
            isAnalyzing: this.state.isAnalyzing,
            detectedElementsCount: this.state.detectedElements?.size || 0,
            hasVisualAnalysis: !!this.state.visualAnalysis,
            transformerState: this.transformer.getState()
        };
    }

    // Log diagnostic information
    logDiagnostics() {
        console.log('🔍 Site Switcher Diagnostics:');
        console.log('- URL:', window.location.href);
        console.log('- Title:', document.title);
        console.log('- Basic elements:', document.querySelectorAll('h1,h2,h3,h4,h5,h6,p').length);
        console.log('- Page height:', document.body.scrollHeight);
        console.log('- Viewport:', `${window.innerWidth}x${window.innerHeight}`);
    }

    // Testing methods for development
    simpleTest() {
        return {
            h1: document.querySelectorAll('h1').length,
            h2: document.querySelectorAll('h2').length,
            h3: document.querySelectorAll('h3').length,
            p: document.querySelectorAll('p').length,
            buttons: document.querySelectorAll('button, .btn').length
        };
    }

    testDetection() {
        try {
            const elements = this.detector.detectTextElements();
            console.log('🧪 Detection Test Results:');
            console.log(`- Detected elements: ${elements.size}`);
            console.log('- Stats:', this.detector.getStats());
            return elements;
        } catch (error) {
            console.error('❌ Detection test failed:', error);
            return null;
        }
    }

    async testVisualAnalysis(transformData) {
        try {
            console.log('🧪 Testing Visual Analysis...');
            const analysis = await this.visualAnalyzer.analyzePageVisually(transformData);
            console.log('📊 Visual Analysis Results:', analysis);
            return analysis;
        } catch (error) {
            console.error('❌ Visual analysis test failed:', error);
            return null;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize Site Switcher
const siteSwitcher = new SiteSwitcher();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => siteSwitcher.initialize());
} else {
    siteSwitcher.initialize();
}

// Global exposure for testing
window.SiteSwitcher = {
    instance: siteSwitcher,
    detector: () => siteSwitcher.detector,
    transformer: () => siteSwitcher.transformer,
    visualAnalyzer: () => siteSwitcher.visualAnalyzer,
    getState: () => siteSwitcher.getSystemState(),
    simpleTest: () => siteSwitcher.simpleTest(),
    testDetection: () => siteSwitcher.testDetection(),
    testVisualAnalysis: (data) => siteSwitcher.testVisualAnalysis(data),
    initialize: () => siteSwitcher.initialize()
};

console.log('✅ Site Switcher content script loaded successfully'); 