// Visual Analyzer - Screenshot-based Web Page Analysis
// Uses GPT-4o Vision API for comprehensive visual + semantic understanding

class VisualAnalyzer {
    constructor() {
        this.screenshots = new Map();
        this.pageStructure = null;
        this.visualAnalysis = null;
    }

    // Main analysis method - comprehensive visual understanding
    async analyzePageVisually(transformData) {
        console.log('📸 Starting visual page analysis with GPT-4o...');
        
        try {
            // Step 1: Capture page screenshots  
            await this.capturePageScreenshots();
            
            // Step 2: Map DOM structure to visuals
            this.pageStructure = await this.mapDOMStructure();
            
            // Step 3: Analyze with GPT-4o Vision
            this.visualAnalysis = await this.analyzeWithGPT4Vision(transformData);
            
            return this.createComprehensivePlan();
            
        } catch (error) {
            console.error('❌ Visual analysis failed:', error);
            throw error;
        }
    }

    // Capture comprehensive screenshots
    async capturePageScreenshots() {
        if (!window.html2canvas) {
            throw new Error('html2canvas library not available');
        }

        // Full page screenshot
        const fullPage = await html2canvas(document.body, {
            height: document.body.scrollHeight,
            useCORS: true,
            scale: 0.5
        });
        this.screenshots.set('fullPage', fullPage.toDataURL('image/jpeg', 0.7));

        // Viewport sections (scroll through page)
        const viewportHeight = window.innerHeight;
        const sections = Math.ceil(document.body.scrollHeight / viewportHeight);
        const originalScroll = window.scrollY;
        
        for (let i = 0; i < Math.min(sections, 6); i++) {
            window.scrollTo(0, i * viewportHeight);
            await this.delay(300);
            
            const section = await html2canvas(document.body, {
                height: viewportHeight,
                width: window.innerWidth,
                y: i * viewportHeight,
                useCORS: true,
                scale: 0.8
            });
            
            this.screenshots.set(`section_${i}`, section.toDataURL('image/jpeg', 0.8));
        }
        
        window.scrollTo(0, originalScroll);
        console.log(`✅ Captured ${this.screenshots.size} screenshots`);
    }

    // Enhanced DOM structure mapping
    async mapDOMStructure() {
        return {
            brandElements: this.findBrandElements(),
            headerElements: this.findHeaders(),
            buttonElements: this.findButtons(), 
            contentSections: this.findContentSections(),
            navigationElements: this.findNavigation()
        };
    }

    // GPT-4o Vision analysis
    async analyzeWithGPT4Vision(transformData) {
        const images = Array.from(this.screenshots.values()).slice(0, 8);
        
        const prompt = `Analyze these website screenshots for content transformation.

USER'S PRODUCT: ${transformData.productTitle}
DESCRIPTION: ${transformData.productDescription}  
TONE: ${transformData.tone}

ANALYZE:
1. Visual hierarchy and layout structure
2. Brand elements that need replacement (headers with brand names)
3. Button contexts (NEVER make buttons empty - preserve or adapt)
4. Complete page sections (not just hero - entire page coverage)
5. Visual relationships between elements

PROVIDE JSON RESPONSE:
{
  "page_analysis": {
    "layout_sections": ["hero", "features", "testimonials", "footer"],
    "brand_locations": ["header logo", "main headline"],  
    "visual_hierarchy": "clear|moderate|complex",
    "button_count": 5,
    "total_sections": 4
  },
  "transformation_plan": {
    "brand_replacements": [
      {"element": "main_headline", "current": "Explore Lawgic", "new": "${transformData.productTitle}"}
    ],
    "button_strategy": [
      {"text": "Apply Now", "action": "preserve", "reason": "generic CTA"},
      {"text": "Learn About Lawgic", "action": "replace", "new": "Learn About ${transformData.productTitle}"}
    ],
    "section_coverage": [
      {"section": "hero", "transform": true, "elements": 3},
      {"section": "features", "transform": true, "elements": 6},
      {"section": "about", "transform": true, "elements": 4}
    ],
    "preservation_rules": ["navigation_links", "footer_legal", "form_labels"]
  }
}`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${transformData.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{
                        role: 'user', 
                        content: [
                            { type: 'text', text: prompt },
                            ...images.map(img => ({
                                type: 'image_url',
                                image_url: { url: img, detail: 'high' }
                            }))
                        ]
                    }],
                    max_tokens: 2000,
                    temperature: 0.3
                })
            });

            const data = await response.json();
            const analysisText = data.choices[0]?.message?.content;
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            
            return jsonMatch ? JSON.parse(jsonMatch[0]) : this.createFallbackAnalysis(transformData);
            
        } catch (error) {
            console.error('GPT-4o Vision failed:', error);
            return this.createFallbackAnalysis(transformData);
        }
    }

    // Helper methods for DOM analysis
    findBrandElements() {
        const brands = [];
        document.querySelectorAll('h1, h2, .logo, .brand, [class*="logo"]').forEach(el => {
            if (this.isVisible(el)) {
                brands.push({
                    element: el,
                    text: el.textContent.trim(),
                    coordinates: el.getBoundingClientRect(),
                    prominence: this.calculateProminence(el)
                });
            }
        });
        return brands.sort((a, b) => b.prominence - a.prominence);
    }

    findHeaders() {
        const headers = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            if (this.isVisible(h)) {
                headers.push({
                    element: h,
                    text: h.textContent.trim(),
                    level: parseInt(h.tagName[1]),
                    coordinates: h.getBoundingClientRect(),
                    containsBrand: this.containsBrandText(h.textContent)
                });
            }
        });
        return headers;
    }

    findButtons() {
        const buttons = [];
        document.querySelectorAll('button, .btn, [role="button"], input[type="submit"], a[class*="button"]').forEach(btn => {
            if (this.isVisible(btn)) {
                const text = this.extractButtonText(btn);
                buttons.push({
                    element: btn,
                    text: text,
                    type: this.categorizeButton(text),
                    coordinates: btn.getBoundingClientRect(),
                    context: this.getButtonContext(btn),
                    isEmpty: !text || text.length === 0
                });
            }
        });
        return buttons;
    }

    findContentSections() {
        const sections = [];
        document.querySelectorAll('section, .section, main > div, [class*="section"]').forEach(section => {
            if (this.isVisible(section) && section.offsetHeight > 100) {
                sections.push({
                    element: section,
                    type: this.inferSectionType(section),
                    coordinates: section.getBoundingClientRect(),
                    textLength: section.textContent.length,
                    hasHeaders: section.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
                    hasButtons: section.querySelectorAll('button, .btn').length
                });
            }
        });
        return sections;
    }

    findNavigation() {
        const navs = [];
        document.querySelectorAll('nav, .nav, .navigation, [role="navigation"]').forEach(nav => {
            if (this.isVisible(nav)) {
                navs.push({
                    element: nav,
                    links: Array.from(nav.querySelectorAll('a')).map(a => a.textContent.trim()),
                    coordinates: nav.getBoundingClientRect()
                });
            }
        });
        return navs;
    }

    // Create comprehensive transformation plan
    createComprehensivePlan() {
        return {
            visualAnalysis: this.visualAnalysis,
            pageStructure: this.pageStructure,
            implementationSteps: this.createImplementationSteps(),
            qualityChecks: this.defineQualityChecks()
        };
    }

    createImplementationSteps() {
        const steps = [];
        
        // Step 1: Brand replacements (highest priority)
        if (this.visualAnalysis.transformation_plan.brand_replacements) {
            steps.push({
                priority: 10,
                type: 'brand_replacement',
                elements: this.visualAnalysis.transformation_plan.brand_replacements,
                description: 'Replace brand names in headers and prominent text'
            });
        }

        // Step 2: Button preservation/adaptation
        if (this.visualAnalysis.transformation_plan.button_strategy) {
            steps.push({
                priority: 9,
                type: 'button_handling',
                elements: this.visualAnalysis.transformation_plan.button_strategy,
                description: 'Preserve button functionality, adapt text only if contains brand'
            });
        }

        // Step 3: Section-by-section transformation
        if (this.visualAnalysis.transformation_plan.section_coverage) {
            steps.push({
                priority: 8,
                type: 'section_transformation',
                elements: this.visualAnalysis.transformation_plan.section_coverage,
                description: 'Transform content sections while preserving layout'
            });
        }

        return steps.sort((a, b) => b.priority - a.priority);
    }

    defineQualityChecks() {
        return {
            brandReplacement: 'All brand references replaced with user product title',
            buttonIntegrity: 'No buttons left empty or non-functional',
            fullPageCoverage: 'All major sections transformed, not just hero',
            layoutPreservation: 'Original visual hierarchy and design maintained',
            contentRelevance: 'Transformed content contextually appropriate'
        };
    }

    // Utility methods
    extractButtonText(button) {
        return button.textContent.trim() || 
               button.getAttribute('aria-label') || 
               button.getAttribute('title') || 
               button.value || '';
    }

    categorizeButton(text) {
        const lower = text.toLowerCase();
        if (lower.includes('apply') || lower.includes('start')) return 'primary_cta';
        if (lower.includes('learn') || lower.includes('more')) return 'secondary_cta';
        if (lower.includes('contact') || lower.includes('get')) return 'contact_cta';
        return 'general';
    }

    getButtonContext(button) {
        const parent = button.closest('header, nav, main, footer, .hero, .cta');
        return parent ? parent.tagName.toLowerCase() : 'content';
    }

    containsBrandText(text) {
        const domain = window.location.hostname.replace('www.', '');
        const titleWords = document.title.split(' ').filter(w => w.length > 2);
        
        return titleWords.some(word => 
            text.toLowerCase().includes(word.toLowerCase())
        );
    }

    inferSectionType(section) {
        const classes = section.className.toLowerCase();
        const text = section.textContent.toLowerCase();
        
        if (classes.includes('hero') || classes.includes('banner')) return 'hero';
        if (classes.includes('feature')) return 'features';
        if (classes.includes('about')) return 'about';
        if (classes.includes('testimonial')) return 'testimonials';
        if (text.includes('features') || text.includes('benefits')) return 'features';
        
        return 'content';
    }

    calculateProminence(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const fontSize = parseFloat(style.fontSize);
        
        return (rect.width * rect.height / 1000) + fontSize + (window.innerHeight - rect.top);
    }

    isVisible(element) {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && rect.height > 0 && 
               style.display !== 'none' && style.visibility !== 'hidden';
    }

    createFallbackAnalysis(transformData) {
        return {
            page_analysis: {
                layout_sections: ['header', 'main', 'footer'],
                brand_locations: ['header'],
                visual_hierarchy: 'standard',
                button_count: this.pageStructure.buttonElements.length,
                total_sections: this.pageStructure.contentSections.length
            },
            transformation_plan: {
                brand_replacements: this.pageStructure.brandElements.map(brand => ({
                    element: 'brand_element',
                    current: brand.text,
                    new: transformData.productTitle
                })),
                button_strategy: this.pageStructure.buttonElements.map(btn => ({
                    text: btn.text,
                    action: btn.text.length > 0 ? 'preserve' : 'fix',
                    reason: 'maintain_functionality'
                })),
                section_coverage: this.pageStructure.contentSections.map(section => ({
                    section: section.type,
                    transform: true,
                    elements: 1
                }))
            }
        };
    }



    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

window.VisualAnalyzer = VisualAnalyzer; 