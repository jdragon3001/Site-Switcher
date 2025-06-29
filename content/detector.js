// Content Element Detector
// Identifies and categorizes text elements on the page for transformation

class ContentDetector {
    constructor() {
        this.textElements = new Map();
        this.siteBrand = null; // Store detected site brand
        this.brandVariations = []; // Store different forms of the brand name
        this.ignoredSelectors = [
            'script', 'style', 'noscript', 'iframe', 'object', 'embed',
            'nav', 'footer', 'header', '.nav', '.navbar', '.menu',
            '.footer', '.copyright', '.breadcrumb', '.pagination',
            'form', 'input', 'textarea', 'select', 'button',
            '.btn', '.button', '.form-control', '.form-group',
            '[contenteditable="false"]', '.no-transform'
        ];
        this.minTextLength = 3; // More lenient minimum length
        this.maxApiCalls = 50;
    }

    // Main detection method
    detectTextElements() {
        console.log('🔍 Starting content detection...');
        this.textElements.clear();
        
        try {
            // Step 0: Detect site brand first
            console.log('📍 Step 0: Detecting site brand');
            this.detectSiteBrand();
            console.log(`Detected site brand: "${this.siteBrand}" with variations:`, this.brandVariations);
            
            // Always try all detection methods to maximize success
            console.log('📍 Step 1: TreeWalker detection');
            this.detectWithTreeWalker();
            console.log(`TreeWalker found: ${this.textElements.size} elements`);
            
            console.log('📍 Step 2: QuerySelector fallback');
            this.detectWithQuerySelector();
            console.log(`After fallback: ${this.textElements.size} elements`);
            
            // If still no elements, try emergency detection
            if (this.textElements.size === 0) {
                console.log('📍 Step 3: Emergency detection (last resort)');
                this.emergencyDetection();
            }
            
            console.log(`🎯 Final result: ${this.textElements.size} transformable elements detected`);
            if (this.textElements.size > 0) {
                console.log('📊 Element breakdown:', this.getStats());
                
                // Log first few elements for debugging
                let count = 0;
                for (const [element, info] of this.textElements) {
                    if (count < 3) {
                        console.log(`Element ${count + 1}: ${info.tagName} (${info.lengthCategory}) - "${info.originalText.substring(0, 50)}..."`);
                        count++;
                    }
                }
            }
            
            return this.textElements;
        } catch (error) {
            console.error('Error in detectTextElements:', error);
            return this.textElements;
        }
    }

    // Detect the site's brand name
    detectSiteBrand() {
        try {
            const brandCandidates = [];
            
            // Method 1: Check title tag
            const title = document.title;
            if (title) {
                // Extract brand from title (usually before " - " or " | ")
                const titleParts = title.split(/\s*[-|•·]\s*/);
                if (titleParts.length > 0) {
                    brandCandidates.push(titleParts[0].trim());
                }
            }
            
            // Method 2: Look for logo text or main brand heading
            const brandSelectors = [
                'h1', // Main heading often contains brand
                '.logo', '.brand', '.site-title', '.site-name',
                '[class*="logo"]', '[class*="brand"]',
                'header h1', 'header h2',
                '.navbar-brand', '.header-brand'
            ];
            
            for (const selector of brandSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const element of elements) {
                    const text = (element.textContent || '').trim();
                    if (text && text.length > 1 && text.length < 50) {
                        brandCandidates.push(text);
                    }
                }
            }
            
            // Method 3: Check meta tags
            const metaTags = ['og:site_name', 'application-name', 'apple-mobile-web-app-title'];
            for (const metaName of metaTags) {
                const meta = document.querySelector(`meta[property="${metaName}"], meta[name="${metaName}"]`);
                if (meta && meta.content) {
                    brandCandidates.push(meta.content.trim());
                }
            }
            
            // Method 4: Extract from domain name
            const domain = window.location.hostname.replace(/^www\./, '');
            const domainParts = domain.split('.');
            if (domainParts.length > 0) {
                const domainName = domainParts[0];
                // Capitalize first letter
                brandCandidates.push(domainName.charAt(0).toUpperCase() + domainName.slice(1));
            }
            
            // Select best brand candidate (shortest reasonable one, usually more accurate)
            const validCandidates = brandCandidates
                .filter(brand => brand && brand.length >= 2 && brand.length <= 30)
                .map(brand => brand.trim())
                .filter(brand => !brand.match(/^(home|welcome|page|main|index|site|website)$/i));
            
            if (validCandidates.length > 0) {
                // Pick the most common one, or the shortest if tied
                const brandFrequency = {};
                validCandidates.forEach(brand => {
                    const normalized = brand.toLowerCase();
                    brandFrequency[normalized] = (brandFrequency[normalized] || 0) + 1;
                });
                
                const topBrand = Object.entries(brandFrequency)
                    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0];
                
                this.siteBrand = validCandidates.find(brand => brand.toLowerCase() === topBrand);
                
                // Generate brand variations for replacement
                this.brandVariations = this.generateBrandVariations(this.siteBrand);
            }
            
            console.log(`🏷️ Brand detection candidates:`, validCandidates);
            console.log(`🎯 Selected brand: "${this.siteBrand}"`);
            
        } catch (error) {
            console.error('Error detecting site brand:', error);
        }
    }

    // Generate variations of the brand name for comprehensive replacement
    generateBrandVariations(brandName) {
        if (!brandName) return [];
        
        const variations = [
            brandName, // Original
            brandName.toLowerCase(), // lowercase
            brandName.toUpperCase(), // UPPERCASE
            brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase() // Title Case
        ];
        
        // Add variations with common suffixes removed
        const suffixes = ['.com', '.net', '.org', 'Inc', 'LLC', 'Corp', 'Company', 'Co'];
        suffixes.forEach(suffix => {
            if (brandName.includes(suffix)) {
                const cleanBrand = brandName.replace(new RegExp(suffix, 'gi'), '').trim();
                if (cleanBrand) {
                    variations.push(cleanBrand);
                }
            }
        });
        
        // Remove duplicates
        return [...new Set(variations)].filter(v => v && v.length > 1);
    }

    // Emergency detection - guaranteed to find something
    emergencyDetection() {
        try {
            console.log('🚨 Emergency detection: Looking for ANY text on page...');
            
            // Just grab any text elements, very basic
            const emergencySelectors = ['h1', 'h2', 'h3', 'p', 'div', 'span'];
            
            for (const selector of emergencySelectors) {
                const elements = document.querySelectorAll(selector);
                console.log(`Emergency: Found ${elements.length} ${selector} elements`);
                
                for (let i = 0; i < Math.min(elements.length, 5); i++) {
                    const element = elements[i];
                    const text = (element.textContent || '').trim();
                    
                    if (text.length >= 3 && text.length <= 500) {
                        const info = {
                            element: element,
                            originalText: text,
                            type: selector.startsWith('h') ? 'heading' : 'text',
                            category: selector === 'h1' ? 'headline' : 'body',
                            priority: selector === 'h1' ? 10 : 5,
                            tagName: selector,
                            classes: '',
                            id: '',
                            xpath: `${selector}[${i}]`
                        };
                        
                        this.textElements.set(element, info);
                        console.log(`🚨 Emergency added: ${selector} - "${text.substring(0, 30)}..."`);
                        
                        if (this.textElements.size >= 5) break;
                    }
                }
                
                if (this.textElements.size >= 5) break;
            }
            
            console.log(`🚨 Emergency detection result: ${this.textElements.size} elements`);
        } catch (error) {
            console.error('Error in emergency detection:', error);
        }
    }

    // TreeWalker detection method
    detectWithTreeWalker() {
        try {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_ELEMENT,
                {
                    acceptNode: (node) => {
                        return this.shouldProcessElement(node) ? 
                            NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                    }
                }
            );

            let element;
            let count = 0;
            
            while (element = walker.nextNode()) {
                if (count >= this.maxApiCalls) break;
                
                try {
                    const textContent = this.getCleanTextContent(element);
                    if (textContent && textContent.length >= this.minTextLength) {
                        const elementInfo = this.analyzeElement(element, textContent);
                        if (elementInfo && elementInfo.element) {
                            this.textElements.set(element, elementInfo);
                            count++;
                        }
                    }
                } catch (error) {
                    console.warn('Error processing element in TreeWalker detection:', error);
                }
            }
        } catch (error) {
            console.error('Error in TreeWalker detection:', error);
        }
    }

    // Fallback detection using querySelector
    detectWithQuerySelector() {
        try {
            console.log('Starting querySelector fallback detection...');
            
            // Very aggressive detection - find ANY text content
            const selectors = [
                'h1, h2, h3, h4, h5, h6', // Headings first
                'p', // Paragraphs
                'div', // Divs
                'span', // Spans
                'li', // List items
                'a', // Links
                'td', // Table cells
                '[class*="title"]',
                '[class*="heading"]',
                '[class*="text"]',
                '[class*="content"]',
                '[class*="description"]'
            ];

            let count = 0;
            for (const selector of selectors) {
                if (count >= this.maxApiCalls) break;
                
                console.log(`Checking selector: ${selector}`);
                const elements = document.querySelectorAll(selector);
                console.log(`Found ${elements.length} elements for ${selector}`);
                
                for (const element of elements) {
                    if (count >= this.maxApiCalls) break;
                    
                    if (!this.textElements.has(element)) {
                        try {
                            // Very lenient text extraction
                            const textContent = this.extractAnyText(element);
                            console.log(`Element text (${element.tagName}): "${textContent.substring(0, 50)}..."`);
                            
                            if (textContent && textContent.length >= this.minTextLength) {
                                const elementInfo = this.createBasicElementInfo(element, textContent);
                                if (elementInfo) {
                                    this.textElements.set(element, elementInfo);
                                    count++;
                                    console.log(`✅ Added element ${count}: ${element.tagName} - "${textContent.substring(0, 30)}..."`);
                                }
                            }
                        } catch (error) {
                            console.warn('Error processing element in fallback detection:', error);
                        }
                    }
                }
                
                // Break early if we found enough elements
                if (count >= 10) break;
            }
            
            console.log(`Fallback detection completed. Found ${count} elements.`);
            
        } catch (error) {
            console.error('Error in querySelector detection:', error);
        }
    }

    // Extract any text from element (very lenient)
    extractAnyText(element) {
        try {
            // Get all text content, even nested
            let text = element.textContent || element.innerText || '';
            
            // If no text content, try getting text from first child text node
            if (!text && element.childNodes) {
                for (const node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                        text = node.textContent;
                        break;
                    }
                }
            }
            
            // Clean up the text
            text = text.trim().replace(/\s+/g, ' ');
            
            // Filter out very long text (likely not what we want)
            if (text.length > 1000) {
                text = text.substring(0, 1000) + '...';
            }
            
            return text;
        } catch (error) {
            console.error('Error extracting text from element:', error);
            return '';
        }
    }

    // Create basic element info (simplified version)
    createBasicElementInfo(element, textContent) {
        try {
            const tagName = element.tagName ? element.tagName.toLowerCase() : 'div';
            
            // Simple type determination
            let type = 'text';
            let category = 'body';
            let priority = 5;
            
            if (tagName.match(/^h[1-6]$/)) {
                type = 'heading';
                category = 'headline';
                priority = 10;
            } else if (tagName === 'p') {
                type = 'paragraph';
                category = 'body';
                priority = 7;
            } else if (tagName === 'a') {
                type = 'link';
                category = 'cta';
                priority = 8;
            }

            return {
                element: element,
                originalText: textContent,
                type: type,
                category: category,
                priority: priority,
                tagName: tagName,
                classes: '',
                id: '',
                xpath: `${tagName}[${Math.floor(Math.random() * 1000)}]`
            };
        } catch (error) {
            console.error('Error creating basic element info:', error);
            return null;
        }
    }

    // Check if element should be processed
    shouldProcessElement(element) {
        try {
            // Skip ignored elements
            for (const selector of this.ignoredSelectors) {
                try {
                    if (element.matches && element.matches(selector)) return false;
                } catch (e) {
                    // Skip if selector matching fails
                    continue;
                }
            }

            // Skip elements inside ignored containers (less restrictive)
            const tagName = element.tagName.toLowerCase();
            if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
                return false;
            }

            // Skip elements with no visible text
            if (!this.hasVisibleText(element)) return false;

            // Skip elements that are not visible (less restrictive)
            if (!this.isElementVisible(element)) return false;

            // More lenient check for text content
            if (!this.hasAnyTextContent(element)) return false;

            return true;
        } catch (error) {
            console.error('Error in shouldProcessElement:', error);
            return false;
        }
    }

    // Get clean text content from element
    getCleanTextContent(element) {
        try {
            // First try direct text content
            let directText = '';
            for (const node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    directText += node.textContent;
                }
            }
            
            // If no direct text, get all text content (more lenient)
            let text = directText.trim();
            if (text.length < this.minTextLength) {
                text = (element.textContent || element.innerText || '').trim();
            }
            
            return text.replace(/\s+/g, ' ');
        } catch (error) {
            console.error('Error in getCleanTextContent:', error);
            return '';
        }
    }

    // Check if element has visible text
    hasVisibleText(element) {
        const text = this.getCleanTextContent(element);
        return text && text.length > 0 && !/^\s*$/.test(text);
    }

    // Check if element is visible (more lenient)
    isElementVisible(element) {
        try {
            const style = window.getComputedStyle(element);
            
            // Skip clearly hidden elements
            if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
            }
            
            // Allow elements with 0 opacity or size (they might become visible)
            // More lenient visibility check
            return true;
        } catch (error) {
            console.error('Error checking element visibility:', error);
            return true; // Default to visible if check fails
        }
    }

    // Check if element has direct text content
    hasDirectTextContent(element) {
        try {
            for (const node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error in hasDirectTextContent:', error);
            return false;
        }
    }

    // More lenient check for any text content (including nested)
    hasAnyTextContent(element) {
        try {
            const text = element.textContent || element.innerText || '';
            return text.trim().length >= this.minTextLength;
        } catch (error) {
            console.error('Error in hasAnyTextContent:', error);
            return false;
        }
    }

    // Analyze element and categorize it
    analyzeElement(element, textContent) {
        try {
            const tagName = element.tagName ? element.tagName.toLowerCase() : 'unknown';
            const classes = element.classList ? Array.from(element.classList).join(' ').toLowerCase() : '';
            const id = element.id ? element.id.toLowerCase() : '';
            
            // Determine element type
            const type = this.getElementType(element, tagName, classes, id);
            
            // Determine content category
            const category = this.getContentCategory(textContent, type, classes, id);
            
            // Calculate priority (for API call ordering)
            const priority = this.calculatePriority(type, element);

            // NEW: Classify by length for appropriate replacement strategy
            const lengthCategory = this.classifyByLength(textContent, tagName, type);
            const isBrandElement = this.isBrandElement(element, textContent);
            const wordCount = textContent.trim().split(/\s+/).length;

            return {
                element: element,
                originalText: textContent,
                type: type,
                category: category,
                priority: priority,
                tagName: tagName,
                classes: classes,
                id: id,
                lengthCategory: lengthCategory,
                isBrandElement: isBrandElement,
                wordCount: wordCount,
                xpath: this.getXPath(element)
            };
        } catch (error) {
            console.error('Error analyzing element:', error, element);
            return null;
        }
    }

    // Classify text by length for appropriate replacement strategy
    classifyByLength(text, tagName, type) {
        const length = text.length;
        const wordCount = text.trim().split(/\s+/).length;
        
        // Brand/title elements - always direct replacement regardless of length
        if (type === 'heading' && (tagName === 'h1' || this.isBrandElement(null, text))) {
            return 'brand';
        }
        
        // Very short - direct word replacement (1-15 characters, 1-3 words)
        if (length <= 15 || wordCount <= 3) {
            return 'micro';
        }
        
        // Short headlines/labels (16-60 characters, 4-10 words)
        if (length <= 60 || wordCount <= 10) {
            return 'short';
        }
        
        // Medium content (61-250 characters, 11-40 words)
        if (length <= 250 || wordCount <= 40) {
            return 'medium';
        }
        
        // Long content (250+ characters, 40+ words)
        return 'long';
    }

    // Check if element likely contains the site brand/name
    isBrandElement(element, text) {
        if (!this.siteBrand || !this.brandVariations.length) {
            return false;
        }
        
        // Check if text contains any brand variation
        const textLower = text.toLowerCase();
        return this.brandVariations.some(brand => 
            textLower.includes(brand.toLowerCase())
        );
    }

    // Determine element type
    getElementType(element, tagName, classes, id) {
        // Headings
        if (/^h[1-6]$/.test(tagName)) {
            return 'heading';
        }
        
        // Main content paragraphs
        if (tagName === 'p') {
            return 'paragraph';
        }
        
        // List items
        if (tagName === 'li') {
            return 'list-item';
        }
        
        // Divs and spans with substantial content
        if (tagName === 'div' || tagName === 'span') {
            const textLength = element.textContent.trim().length;
            if (textLength > 100) {
                return 'content-block';
            } else if (textLength > 20) {
                return 'short-content';
            }
        }
        
        // Link text
        if (tagName === 'a') {
            return 'link';
        }
        
        // Other text elements
        return 'text';
    }

    // Determine content category
    getContentCategory(text, type, classes, id) {
        const lowerText = text.toLowerCase();
        const lowerClasses = classes.toLowerCase();
        const lowerId = id.toLowerCase();
        
        // Headlines and titles
        if (type === 'heading' || 
            /title|headline|hero|banner/.test(lowerClasses + lowerId)) {
            return 'headline';
        }
        
        // Call-to-action elements
        if (/cta|call.to.action|button|btn|action|get.started|learn.more|sign.up|try.now|contact|buy/.test(lowerText + lowerClasses + lowerId)) {
            return 'cta';
        }
        
        // Feature descriptions
        if (/feature|benefit|advantage|capability|what.we.do|service/.test(lowerText + lowerClasses + lowerId)) {
            return 'feature';
        }
        
        // About sections
        if (/about|who.we.are|our.story|company|team|mission|vision/.test(lowerText + lowerClasses + lowerId)) {
            return 'about';
        }
        
        // Testimonials and reviews
        if (/testimonial|review|customer|client|feedback|quote/.test(lowerText + lowerClasses + lowerId)) {
            return 'testimonial';
        }
        
        // Product descriptions
        if (/product|solution|offering|what.is/.test(lowerText + lowerClasses + lowerId)) {
            return 'product';
        }
        
        // Navigation items (usually ignored, but just in case)
        if (/nav|menu|link/.test(lowerClasses + lowerId)) {
            return 'navigation';
        }
        
        // Default to body content
        return 'body';
    }

    // Calculate priority for API call ordering
    calculatePriority(type, element) {
        let priority = 0;
        
        // Type-based priority
        const typePriorities = {
            'heading': 10,
            'cta': 9,
            'feature': 8,
            'product': 7,
            'about': 6,
            'paragraph': 5,
            'content-block': 4,
            'testimonial': 3,
            'list-item': 2,
            'short-content': 1,
            'text': 0
        };
        
        priority += typePriorities[type] || 0;
        
        // Position-based priority (elements higher on page get higher priority)
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollTop;
        const pageHeight = document.documentElement.scrollHeight;
        
        // Inverse relationship: higher on page = higher priority
        const positionScore = Math.max(0, 10 - (elementTop / pageHeight) * 10);
        priority += positionScore;
        
        // Size-based priority
        const textLength = element.textContent.trim().length;
        if (textLength > 200) priority += 3;
        else if (textLength > 100) priority += 2;
        else if (textLength > 50) priority += 1;
        
        return Math.round(priority);
    }

    // Get XPath for element (for reliable element identification)
    getXPath(element) {
        if (element.id !== '') {
            return `//*[@id="${element.id}"]`;
        }
        
        if (element === document.body) {
            return '/html/body';
        }
        
        let ix = 0;
        const siblings = element.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            const sibling = siblings[i];
            if (sibling === element) {
                return this.getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }

    // Get elements sorted by priority
    getSortedElements() {
        return Array.from(this.textElements.values())
            .sort((a, b) => b.priority - a.priority);
    }

    // Filter elements by category
    getElementsByCategory(category) {
        return Array.from(this.textElements.values())
            .filter(info => info.category === category);
    }

    // Get element info by element reference
    getElementInfo(element) {
        return this.textElements.get(element);
    }

    // Update element info
    updateElementInfo(element, updates) {
        const existing = this.textElements.get(element);
        if (existing) {
            this.textElements.set(element, { ...existing, ...updates });
        }
    }

    // Check if element is transformable
    isTransformable(element) {
        return this.textElements.has(element);
    }

    // Get statistics
    getStats() {
        const stats = {
            total: this.textElements.size,
            byType: {},
            byCategory: {}
        };

        for (const info of this.textElements.values()) {
            stats.byType[info.type] = (stats.byType[info.type] || 0) + 1;
            stats.byCategory[info.category] = (stats.byCategory[info.category] || 0) + 1;
        }

        return stats;
    }
}

// Export for use in other content scripts
window.ContentDetector = ContentDetector; 