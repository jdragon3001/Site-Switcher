// Content Transformer
// Handles applying AI-generated content to detected elements with semantic analysis

class ContentTransformer {
    constructor() {
        this.originalContent = new Map();
        this.transformedContent = new Map();
        this.semanticAnalysis = null;
        this.isTransformed = false;
        this.observer = null;
        this.observerPaused = false;
        this.currentTransformData = null;
    }

    // Transform page content with semantic analysis first
    async transformPage(transformData, detectedElements) {
        console.log('🧠 Starting semantic analysis and transformation...');
        
        this.currentTransformData = transformData;
        this.saveOriginalContent(detectedElements);
        
        try {
            // PHASE 1: Semantic Analysis
            console.log('📊 Phase 1: Analyzing page semantics...');
            this.semanticAnalysis = await this.analyzePageSemantics(detectedElements, transformData);
            console.log('✅ Semantic analysis complete:', this.semanticAnalysis);
            
            // PHASE 2: Apply Intelligent Replacements
            console.log('🎯 Phase 2: Applying targeted replacements...');
            await this.applyIntelligentReplacements(detectedElements, transformData);
            
            this.isTransformed = true;
            this.setupDynamicContentHandling();
            
            console.log('✅ Page transformation completed');
            return { success: true, transformedCount: this.transformedContent.size };
            
        } catch (error) {
            console.error('❌ Transformation error:', error);
            await this.resetPage();
            throw error;
        }
    }

    // PHASE 1: Analyze page semantics with AI
    async analyzePageSemantics(detectedElements, transformData) {
        const pageContent = this.extractPageStructure(detectedElements);
        
        const analysisPrompt = `Analyze this website's content structure and provide a JSON response with replacement strategy for each element.

WEBSITE CONTENT:
${pageContent}

USER'S PRODUCT:
Title: ${transformData.productTitle}
Description: ${transformData.productDescription}

ANALYSIS TASK:
For each element, determine:
1. semantic_role: What this content represents (brand, headline, feature, description, navigation, etc.)
2. replacement_strategy: How to handle it (replace, adapt, keep, remove)
3. target_length: Max words for replacement (1-3 for micro, 4-8 for short, 9-25 for medium, 26+ for long)
4. replacement_priority: 1-10 (higher = more important to replace)

RESPONSE FORMAT (JSON only):
{
  "page_analysis": {
    "detected_brand": "brand name found",
    "content_theme": "what this site is about",
    "design_style": "professional/creative/technical"
  },
  "elements": [
    {
      "id": "element_0",
      "original_text": "original text here",
      "semantic_role": "brand|headline|feature|description|navigation|footer|cta|testimonial",
      "replacement_strategy": "replace|adapt|keep|remove", 
      "target_length": 5,
      "replacement_priority": 8,
      "suggested_replacement": "specific replacement text"
    }
  ]
}`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${transformData.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                                            {
                        role: 'system',
                        content: 'You are a web content analyst. Analyze website content and provide structured JSON responses for intelligent content replacement. Be concise and precise. Never include quotes or quotation marks in your output.'
                    },
                        {
                            role: 'user',
                            content: analysisPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`Analysis API Error: ${response.status}`);
            }

            const data = await response.json();
            const analysisText = data.choices[0]?.message?.content?.trim();
            
            // Parse JSON response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid analysis response format');
            }
            
            return JSON.parse(jsonMatch[0]);
            
        } catch (error) {
            console.error('❌ Semantic analysis failed:', error);
            // Fallback to simple analysis
            return this.fallbackAnalysis(detectedElements, transformData);
        }
    }

    // Extract page structure for analysis
    extractPageStructure(detectedElements) {
        return detectedElements
            .slice(0, 20) // Limit to first 20 elements for analysis
            .map((elementInfo, index) => {
                return `[${index}] ${elementInfo.tagName.toUpperCase()}: "${elementInfo.originalText.substring(0, 100)}${elementInfo.originalText.length > 100 ? '...' : ''}"`;
            })
            .join('\n');
    }

    // PHASE 2: Apply intelligent replacements based on semantic analysis
    async applyIntelligentReplacements(detectedElements, transformData) {
        if (!this.semanticAnalysis || !this.semanticAnalysis.elements) {
            throw new Error('No semantic analysis available');
        }

        const analysisElements = this.semanticAnalysis.elements;
        
        // Group elements by replacement strategy
        const replaceElements = analysisElements.filter(el => el.replacement_strategy === 'replace');
        const adaptElements = analysisElements.filter(el => el.replacement_strategy === 'adapt');
        
        console.log(`🎯 Replacing ${replaceElements.length} elements directly`);
        console.log(`🔄 Adapting ${adaptElements.length} elements contextually`);

        // Process direct replacements (brand names, simple swaps)
        for (const analysisElement of replaceElements) {
            const elementInfo = this.findMatchingElement(detectedElements, analysisElement);
            if (elementInfo) {
                await this.applyDirectReplacement(elementInfo, analysisElement, transformData);
            }
        }

        // Process adaptive replacements (contextual content)
        for (const analysisElement of adaptElements) {
            const elementInfo = this.findMatchingElement(detectedElements, analysisElement);
            if (elementInfo) {
                await this.applyAdaptiveReplacement(elementInfo, analysisElement, transformData);
            }
        }
    }

    // Find matching detected element for analysis element
    findMatchingElement(detectedElements, analysisElement) {
        return detectedElements.find(el => 
            el.originalText.trim() === analysisElement.original_text.trim() ||
            el.originalText.includes(analysisElement.original_text.substring(0, 50))
        );
    }

    // Apply direct replacement (brand names, simple swaps)
    async applyDirectReplacement(elementInfo, analysisElement, transformData) {
        let replacement = analysisElement.suggested_replacement;
        
        // For brand replacements, use the product title directly
        if (analysisElement.semantic_role === 'brand') {
            replacement = transformData.productTitle;
        }
        
        // Apply the replacement
        if (replacement && replacement.trim()) {
            this.applyTransformation(elementInfo.element, replacement);
            this.transformedContent.set(elementInfo.element, {
                originalText: elementInfo.originalText,
                newText: replacement,
                elementInfo: elementInfo,
                strategy: 'direct'
            });
            
            console.log(`✅ Direct replacement: "${elementInfo.originalText.substring(0, 30)}..." → "${replacement}"`);
        }
    }

    // Apply adaptive replacement (contextual content)
    async applyAdaptiveReplacement(elementInfo, analysisElement, transformData) {
        const adaptivePrompt = this.buildAdaptivePrompt(elementInfo, analysisElement, transformData);
        
        try {
            const newContent = await this.generateAdaptiveContent(adaptivePrompt, transformData.apiKey, analysisElement.target_length);
            
            if (newContent && newContent.trim()) {
                this.applyTransformation(elementInfo.element, newContent);
                this.transformedContent.set(elementInfo.element, {
                    originalText: elementInfo.originalText,
                    newText: newContent,
                    elementInfo: elementInfo,
                    strategy: 'adaptive'
                });
                
                console.log(`✅ Adaptive replacement: "${elementInfo.originalText.substring(0, 30)}..." → "${newContent.substring(0, 30)}..."`);
            }
        } catch (error) {
            console.warn(`⚠️ Failed to adapt element: ${error.message}`);
        }
    }

    // Build adaptive prompt for contextual replacement
    buildAdaptivePrompt(elementInfo, analysisElement, transformData) {
        return `Replace this ${analysisElement.semantic_role} content for a new product.

ORIGINAL: "${analysisElement.original_text}"
SEMANTIC ROLE: ${analysisElement.semantic_role}
TARGET LENGTH: Maximum ${analysisElement.target_length} words

NEW PRODUCT:
- Title: ${transformData.productTitle}
- Description: ${transformData.productDescription}
- Tone: ${transformData.tone}

REQUIREMENTS:
- Keep the same semantic purpose and structure
- Maximum ${analysisElement.target_length} words
- Match the tone: ${transformData.tone}
- Stay relevant to ${transformData.productTitle}

Generate ONLY the replacement text, no explanation:`;
    }

    // Generate adaptive content with strict length limits
    async generateAdaptiveContent(prompt, apiKey, targetLength) {
        const maxTokens = Math.min(targetLength * 2, 100); // Very conservative token limit
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a precise copywriter. Generate exact length replacements. Be concise and respect word limits strictly. Output only the replacement text without quotes, formatting, or explanations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            throw new Error(`Adaptive content API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content?.trim();
        
        // Enforce length limit by truncating if necessary
        if (content) {
            const words = content.split(/\s+/);
            if (words.length > targetLength) {
                return words.slice(0, targetLength).join(' ');
            }
        }
        
        return content;
    }

    // Fallback analysis if AI analysis fails
    fallbackAnalysis(detectedElements, transformData) {
        console.log('🔄 Using fallback semantic analysis...');
        
        return {
            page_analysis: {
                detected_brand: "Unknown",
                content_theme: "General website",
                design_style: "professional"
            },
            elements: detectedElements.slice(0, 10).map((elementInfo, index) => {
                // Simple heuristic-based classification
                let semantic_role = 'description';
                let replacement_strategy = 'adapt';
                let target_length = Math.min(elementInfo.wordCount, 10);
                let priority = 5;
                
                if (elementInfo.tagName === 'h1' || elementInfo.isBrandElement) {
                    semantic_role = 'brand';
                    replacement_strategy = 'replace';
                    target_length = 3;
                    priority = 10;
                } else if (elementInfo.tagName.match(/^h[2-6]$/)) {
                    semantic_role = 'headline';
                    replacement_strategy = 'adapt';
                    target_length = Math.min(elementInfo.wordCount, 8);
                    priority = 8;
                } else if (elementInfo.wordCount <= 3) {
                    semantic_role = 'navigation';
                    replacement_strategy = 'keep';
                    priority = 1;
                }
                
                return {
                    id: `element_${index}`,
                    original_text: elementInfo.originalText,
                    semantic_role,
                    replacement_strategy,
                    target_length,
                    replacement_priority: priority,
                    suggested_replacement: semantic_role === 'brand' ? transformData.productTitle : null
                };
            })
        };
    }

    // Save original content before transformation
    saveOriginalContent(detectedElements) {
        this.originalContent.clear();
        
        detectedElements.forEach(elementInfo => {
            this.originalContent.set(elementInfo.element, {
                text: elementInfo.originalText,
                html: elementInfo.element.innerHTML,
                info: elementInfo
            });
        });
    }

    // Process a batch of elements (backward compatibility)
    async processBatch(batch, transformData) {
        const promises = batch.map(elementInfo => 
            this.transformElement(elementInfo, transformData)
        );
        
        const results = await Promise.allSettled(promises);
        
        // Log any failures
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`Failed to transform element ${index}:`, result.reason);
            }
        });
    }

    // Transform individual element (backward compatibility method)
    async transformElement(elementInfo, transformData) {
        // 🛡️ CRITICAL: Prevent re-transformation of already processed elements
        if (this.transformedContent.has(elementInfo.element)) {
            console.log(`⏭️ Skipping already transformed element: "${elementInfo.originalText.substring(0, 30)}..."`);
            return; // Exit early - don't re-transform!
        }

        try {
            // Use adaptive replacement for better results
            const adaptivePrompt = this.buildAdaptivePrompt(elementInfo, {
                semantic_role: elementInfo.category || 'description',
                target_length: elementInfo.wordCount || 10,
                original_text: elementInfo.originalText
            }, transformData);
            
            const newContent = await this.generateAdaptiveContent(
                adaptivePrompt, 
                transformData.apiKey, 
                elementInfo.wordCount || 10
            );
            
            if (newContent && newContent.trim()) {
                this.applyTransformation(elementInfo.element, newContent);
                this.transformedContent.set(elementInfo.element, {
                    originalText: elementInfo.originalText,
                    newText: newContent,
                    elementInfo: elementInfo,
                    strategy: 'adaptive'
                });
                
                console.log(`✅ Transformed element: "${elementInfo.originalText.substring(0, 30)}..." → "${newContent.substring(0, 30)}..."`);
            }
            
        } catch (error) {
            console.error('Error transforming element:', error);
            throw error;
        }
    }

    // Apply transformation to element
    applyTransformation(element, newContent) {
        // CRITICAL: Temporarily disable observer to prevent detecting our own changes
        this.pauseObserver();
        
        // Clean the content to remove quotes and extra formatting
        const cleanContent = this.cleanGeneratedContent(newContent);
        
        // Preserve structure if element contains HTML
        const hasHTML = element.innerHTML !== element.textContent;
        
        if (hasHTML) {
            // Replace text content while preserving HTML structure
            this.replaceTextContent(element, cleanContent);
        } else {
            // Simple text replacement
            element.textContent = cleanContent;
        }

        // Mark element as transformed to prevent re-processing
        element.setAttribute('data-site-switcher-transformed', 'true');

        // Add visual indicator
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = '#fff3cd';
        
        setTimeout(() => {
            element.style.backgroundColor = '';
            // Resume observer after our changes are complete
            this.resumeObserver();
        }, 1000);
    }

    // Clean generated content to remove quotes and unwanted formatting
    cleanGeneratedContent(content) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        let cleaned = content.trim();
        
        // Remove surrounding quotes (single or double)
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
            cleaned = cleaned.slice(1, -1).trim();
        }
        
        // Remove multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ');
        
        // Remove markdown-style formatting
        cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');     // Italic
        cleaned = cleaned.replace(/`(.*?)`/g, '$1');       // Code
        
        // Remove HTML-like tags if they appear
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        
        return cleaned.trim();
    }

    // Replace text content while preserving HTML structure
    replaceTextContent(element, newContent) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textNode;
        let totalOriginalText = '';
        const textNodes = [];

        // Collect all text nodes
        while (textNode = walker.nextNode()) {
            if (textNode.textContent.trim()) {
                textNodes.push(textNode);
                totalOriginalText += textNode.textContent;
            }
        }

        // Replace the first significant text node with new content
        if (textNodes.length > 0) {
            textNodes[0].textContent = newContent;
            
            // Clear other text nodes if there are multiple
            for (let i = 1; i < textNodes.length; i++) {
                textNodes[i].textContent = '';
            }
        }
    }

    // Regenerate content for current transformation
    async regenerate() {
        if (!this.isTransformed || !this.currentTransformData) {
            throw new Error('No active transformation to regenerate');
        }

        console.log('🔄 Regenerating content...');
        
        // Pause observer during regeneration
        this.pauseObserver();
        
        // Clear current transformations
        this.transformedContent.clear();
        
        // Clear transformation markers and restore original content
        this.originalContent.forEach((originalInfo, element) => {
            if (element && element.parentNode) {
                element.innerHTML = originalInfo.html;
                element.removeAttribute('data-site-switcher-transformed');
            }
        });
        
        // Re-run the entire transformation process
        const detectedElements = Array.from(this.originalContent.values()).map(info => info.info);
        await this.transformPage(this.currentTransformData, detectedElements);
        
        // Resume observer
        this.resumeObserver();
        
        console.log('✅ Content regeneration completed');
        return { success: true };
    }

    // Reset page to original content
    async resetPage() {
        console.log('🔄 Resetting page to original content...');
        
        // Pause observer during reset
        this.pauseObserver();
        
        // Clear transformation markers and restore original content
        this.originalContent.forEach((originalInfo, element) => {
            if (element && element.parentNode) {
                element.innerHTML = originalInfo.html;
                element.removeAttribute('data-site-switcher-transformed');
            }
        });
        
        this.transformedContent.clear();
        this.semanticAnalysis = null;
        this.isTransformed = false;
        this.observerPaused = false;
        this.currentTransformData = null;
        
        this.disconnectObserver();
        
        console.log('✅ Page reset completed');
        return { success: true };
    }

    // Setup dynamic content handling for SPAs
    setupDynamicContentHandling() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new MutationObserver((mutations) => {
            this.handleDynamicChanges(mutations);
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false
        });
    }

    // Handle dynamic content changes
    async handleDynamicChanges(mutations) {
        if (!this.isTransformed || !this.currentTransformData) return;
        
        // Skip processing if observer is paused (we're making our own changes)
        if (this.observerPaused) {
            console.log('⏭️ Skipping mutation handling - observer paused');
            return;
        }

        let hasNewContent = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this is actually new content vs our own changes
                        const hasTransformedElements = node.querySelectorAll('[data-site-switcher-transformed]').length > 0;
                        if (!hasTransformedElements) {
                            await this.handleNewElement(node);
                            hasNewContent = true;
                        }
                    }
                }
            }
        }
        
        if (hasNewContent) {
            console.log('✅ Processed new dynamic content');
        }
    }

    // Handle newly added elements
    async handleNewElement(element) {
        const detector = new ContentDetector();
        const newElements = detector.detectTextElements();
        
        // Filter to only new elements that aren't already transformed
        const elementsToTransform = Array.from(newElements.values())
            .filter(info => 
                element.contains(info.element) && 
                !this.transformedContent.has(info.element) &&
                !info.element.hasAttribute('data-site-switcher-transformed')
            );

        if (elementsToTransform.length > 0) {
            console.log(`🔄 Found ${elementsToTransform.length} new dynamic elements to transform`);
            try {
                // Use existing semantic analysis or create new one
                await this.applyIntelligentReplacements(elementsToTransform, this.currentTransformData);
            } catch (error) {
                console.warn('⚠️ Error transforming dynamic content:', error);
            }
        }
    }
    
    // Pause observer to prevent detecting our own changes
    pauseObserver() {
        this.observerPaused = true;
        console.log('⏸️ Observer paused');
    }
    
    // Resume observer after our changes are complete
    resumeObserver() {
        setTimeout(() => {
            this.observerPaused = false;
            console.log('▶️ Observer resumed');
        }, 100); // Small delay to ensure DOM changes are complete
    }

    // Disconnect observer
    disconnectObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    // Get transformation state
    getState() {
        return {
            isTransformed: this.isTransformed,
            transformedCount: this.transformedContent.size,
            originalCount: this.originalContent.size,
            hasSemanticAnalysis: !!this.semanticAnalysis
        };
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Cleanup
    destroy() {
        this.disconnectObserver();
        
        // Clear transformation markers from all elements
        document.querySelectorAll('[data-site-switcher-transformed]').forEach(element => {
            element.removeAttribute('data-site-switcher-transformed');
        });
        
        this.originalContent.clear();
        this.transformedContent.clear();
        this.semanticAnalysis = null;
        this.isTransformed = false;
        this.observerPaused = false;
        this.currentTransformData = null;
    }
}

// Export for use in other content scripts
window.ContentTransformer = ContentTransformer; 