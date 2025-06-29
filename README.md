# Site Switcher Chrome Extension

Transform any website's content with your own using AI while preserving the original design and layout.

## Overview

Site Switcher is a powerful Chrome extension that helps designers, marketers, and entrepreneurs visualize how any website's design would look with their own content. Using OpenAI's advanced AI, it intelligently replaces headlines, copy, and other text elements while maintaining the original site's design structure.

## Features

- **AI-Powered Content Transformation**: Uses OpenAI GPT-4 to generate contextually appropriate replacement text
- **Intelligent Element Detection**: Automatically identifies and categorizes different types of content (headlines, CTAs, features, etc.)
- **Design Preservation**: Maintains original layout, styling, and visual hierarchy
- **Multiple Tone Options**: Professional, Friendly, Technical, Emotion-driven, or Custom tones
- **Dynamic Content Support**: Works with single-page applications and dynamically loaded content
- **Secure API Key Storage**: Encrypted storage of your OpenAI API key
- **Usage Statistics**: Track your transformations and optimize your workflow

## Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Site Switcher"
3. Click "Add to Chrome"

### Manual Installation (For Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Site Switcher icon should appear in your Chrome toolbar

## Setup

### Getting an OpenAI API Key
1. Visit [OpenAI's API platform](https://platform.openai.com/api-keys)
2. Create an account or log in
3. Generate a new API key
4. Copy the key (it starts with "sk-")

### Configuring the Extension
1. Click the Site Switcher icon in your Chrome toolbar
2. Enter your OpenAI API key
3. Check "Save API key securely" to store it for future use
4. Fill in your product/service details
5. Select your preferred tone
6. Click "Transform Page"

## Usage

### Basic Transformation
1. Navigate to any website you want to transform
2. Click the Site Switcher extension icon
3. Fill in the required fields:
   - **Product/Site Title**: Your product or company name
   - **Product/Service Description**: Brief description of what you offer
   - **Tone**: Choose how you want the content to sound
   - **OpenAI API Key**: Your API key from OpenAI
4. Click "Transform Page"
5. Watch as the content transforms while preserving the design

### Advanced Features
- **Regenerate**: Click to generate new variations of the transformed content
- **Reset**: Restore the page to its original content
- **Custom Tone**: Define your own specific tone requirements

### Best Practices
- Use clear, descriptive product descriptions for better AI results
- Test different tones to see what works best for your brand
- Keep your API key secure and don't share it
- Be mindful of API usage costs

## Supported Websites

Site Switcher works on most websites, including:
- Static websites
- WordPress sites
- Single-page applications (React, Vue, Angular)
- E-commerce platforms
- Landing pages
- Marketing websites

## Limitations

- Requires an active internet connection
- Needs a valid OpenAI API key
- Limited to 50 elements per page transformation
- Some heavily dynamic sites may require page refresh
- API usage costs apply based on OpenAI's pricing

## Privacy & Security

- API keys are encrypted and stored locally in your browser
- No data is transmitted except to OpenAI's API
- Original page content is never permanently modified
- No tracking or analytics beyond basic usage statistics
- All data remains on your device

## Pricing

Site Switcher is free to use. However, you'll need to pay for OpenAI API usage:
- GPT-4 pricing: ~$0.03 per 1K tokens
- Average cost per page transformation: $0.05-$0.15
- Monthly usage typically ranges from $5-$20 depending on usage

## Troubleshooting

### Common Issues

**Extension won't load**
- Make sure you're using Chrome 90 or later
- Check that Developer mode is enabled
- Try reloading the extension

**Transformation fails**
- Verify your API key is correct
- Check your internet connection
- Ensure the website allows content modification
- Try refreshing the page and trying again

**Some content doesn't transform**
- The extension skips navigation menus, footers, and forms by design
- Very short text (less than 10 characters) is typically ignored
- Some dynamically loaded content may need page refresh

**Visual indicators don't show**
- Some websites may override the extension's CSS
- Try disabling other extensions temporarily
- Check browser console for any errors

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Try the extension on a different website
3. Verify your API key is working at OpenAI's platform
4. Create an issue on our GitHub repository

## Development

### Project Structure
```
Site-Switcher/
├── manifest.json          # Extension configuration
├── popup/                 # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/               # Content scripts
│   ├── content.js
│   ├── detector.js
│   └── transformer.js
├── background/            # Background service worker
│   └── background.js
├── lib/                   # Utility libraries
│   ├── openai-client.js
│   └── storage.js
└── assets/               # Icons and assets
    └── icons/
```

### Local Development
1. Clone the repository
2. Make your changes
3. Load the extension in Chrome using "Load unpacked"
4. Test on various websites
5. Check console logs for debugging

### Building for Production
1. Ensure all files are included
2. Update version in `manifest.json`
3. Test thoroughly on different websites
4. Create extension package for Chrome Web Store

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### Version 1.0.0 (Current)
- Initial release
- AI-powered content transformation
- Support for multiple tones
- Secure API key storage
- Dynamic content handling
- Usage statistics tracking

## Support

For support, bug reports, or feature requests:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review OpenAI's API documentation for API-related issues

## Acknowledgments

- OpenAI for providing the powerful GPT-4 API
- Chrome Extension API for the robust platform
- The web development community for inspiration and feedback

---

**Note**: This extension requires an OpenAI API key and incurs costs based on usage. Please review OpenAI's pricing before extensive use. 