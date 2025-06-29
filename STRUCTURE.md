# Site Switcher - Project Structure

This document outlines the architectural decisions and file organization for the Site Switcher Chrome extension.

## Directory Structure

```
Site Switcher/
├── manifest.json                 # Chrome extension manifest (Manifest V3)
├── README.md                     # Main documentation
├── STRUCTURE.md                  # This file - architectural decisions
├── DEPRECATED.txt               # Deprecated code patterns (to be created)
├── PROBLEM_LOG.txt              # Persistent issues log (to be created)
├── cmds.md                      # Commands documentation (to be created)
├── nextsteps/                   # Planning and task management
├── popup/                       # Extension popup interface
│   ├── popup.html              # Popup UI structure
│   ├── popup.css               # Popup styling
│   └── popup.js                # Popup logic and communication
├── content/                     # Content scripts (injected into web pages)
│   ├── content.js              # Main content script coordinator
│   ├── detector.js             # DOM element detection and categorization
│   └── transformer.js          # Content transformation and AI integration
├── background/                  # Background service worker
│   └── background.js           # Extension lifecycle, API management, statistics
├── lib/                        # Utility libraries
│   ├── openai-client.js        # OpenAI API communication
│   └── storage.js              # Secure data storage management
└── assets/                     # Static assets
    └── icons/                  # Extension icons (16, 32, 48, 128px)
        ├── README.md
        ├── icon16.png
        ├── icon32.png
        ├── icon48.png
        └── icon128.png
```

## Architectural Decisions

### 1. Extension Architecture Pattern

**Decision**: Manifest V3 with Service Worker
- **Rationale**: Future-proof extension that complies with Chrome's latest standards
- **Components**: 
  - Popup for user interface
  - Content scripts for DOM manipulation
  - Background service worker for API management and cross-tab communication
  - Utility libraries for reusable functionality

### 2. Content Detection Strategy

**Decision**: TreeWalker-based DOM traversal with intelligent filtering
- **Rationale**: Efficient traversal of complex DOM structures while avoiding unwanted elements
- **Implementation**: `detector.js` uses TreeWalker API with custom filtering logic
- **Categories**: Headlines, CTAs, Features, About, Testimonials, Product descriptions, Body content

### 3. AI Integration Pattern

**Decision**: Direct OpenAI API integration with client-side processing
- **Rationale**: Maintains user privacy, provides full control over API usage
- **Implementation**: `openai-client.js` handles rate limiting, retry logic, and error handling
- **Security**: API keys encrypted and stored locally

### 4. State Management

**Decision**: Chrome Storage API with encrypted sensitive data
- **Rationale**: Secure, persistent storage across browser sessions
- **Implementation**: `storage.js` provides encryption for API keys, plain storage for settings
- **Scope**: Local storage for user privacy

### 5. Error Handling Strategy

**Decision**: Graceful degradation with comprehensive error reporting
- **Rationale**: Maintains extension functionality even with partial failures
- **Implementation**: Try-catch blocks with fallback behaviors, user-friendly error messages
- **Logging**: Console logs for debugging, user notifications for actionable errors

### 6. Performance Optimization

**Decision**: Batched processing with rate limiting
- **Rationale**: Prevents API rate limit violations and reduces costs
- **Implementation**: 
  - Maximum 50 elements per page
  - Batch size of 5 elements
  - 200ms delay between batches
  - Priority-based element processing

### 7. Dynamic Content Handling

**Decision**: MutationObserver for SPA support
- **Rationale**: Supports modern web applications with dynamic content loading
- **Implementation**: `transformer.js` observes DOM changes and re-applies transformations
- **Scope**: Monitors childList and subtree changes

## Component Responsibilities

### Popup (`popup/`)
- **Purpose**: User interface for extension configuration and control
- **Responsibilities**:
  - Form validation and user input handling
  - Settings persistence and retrieval
  - Communication with content scripts
  - Status updates and error display

### Content Scripts (`content/`)
- **Purpose**: Web page interaction and content transformation
- **Responsibilities**:
  - DOM element detection and analysis
  - Content transformation application
  - Dynamic content monitoring
  - Original content preservation

### Background Script (`background/`)
- **Purpose**: Extension lifecycle and cross-tab coordination
- **Responsibilities**:
  - Installation and update handling
  - Usage statistics tracking
  - Cross-tab message coordination
  - Periodic cleanup tasks

### Utility Libraries (`lib/`)
- **Purpose**: Reusable functionality and service abstractions
- **Responsibilities**:
  - API communication with error handling
  - Secure data storage and encryption
  - Configuration management

## Data Flow

```
User Input (Popup) → Content Script → AI Processing → DOM Transformation
                ↓
        Background Script (Statistics/Coordination)
                ↓
        Storage (Settings/History/API Keys)
```

## Security Considerations

### API Key Protection
- XOR encryption for local storage
- No transmission outside OpenAI API
- Automatic key rotation capability
- User-controlled storage preference

### Content Security Policy
- Strict CSP for extension pages
- No eval() or inline scripts
- External requests only to OpenAI API
- DOM manipulation restricted to content scripts

### Privacy Protection
- No data collection or analytics
- Local processing only
- No permanent content modification
- User consent for API key storage

## Extension Permissions

### Required Permissions
- `activeTab`: Access to current tab for content transformation
- `storage`: Local data storage for settings and API keys

### Host Permissions
- `<all_urls>`: Required for content script injection on any website

## Future Scalability

### Modular Design
- Each component is self-contained with clear interfaces
- Easy to add new content detectors or transformers
- Pluggable AI provider system possible

### Performance Monitoring
- Built-in usage statistics
- Error tracking and reporting
- Performance metrics collection

### Feature Extensibility
- Settings system designed for new options
- Content categorization system is extensible
- Storage system supports new data types

## Development Guidelines

### Code Organization
- One responsibility per file
- Clear separation of concerns
- Consistent error handling patterns
- Comprehensive logging for debugging

### Testing Strategy
- Manual testing on diverse websites
- Error condition testing
- API integration testing
- Performance testing under load

### Documentation Standards
- Comprehensive README for users
- Inline code documentation
- Architectural decision records
- Troubleshooting guides

## Deployment Considerations

### Chrome Web Store
- Manifest V3 compliance
- Privacy policy documentation
- Permission justification
- Icon and screenshot requirements

### Version Management
- Semantic versioning
- Migration strategies for breaking changes
- Backward compatibility considerations
- User communication for updates

---

This structure provides a solid foundation for the Site Switcher extension while maintaining flexibility for future enhancements and ensuring security, performance, and user experience standards. 