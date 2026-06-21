# NSFW Blocker AI - Chrome Extension

A powerful AI-powered NSFW content blocker with WebGPU acceleration for both images and videos. Designed to work on desktop and mobile browsers (including Edge Canary on Android).

## Features

1. **AI-Powered Detection**: Uses TensorFlow.js with WebGPU/WebGL acceleration to detect NSFW content in real-time
2. **Image & Video Support**: Blocks both images and video content
3. **Sensitivity Control**: Adjustable sensitivity slider (0-1) to control blocking strictness
4. **Action Options**: Choose to blur or completely remove detected content
5. **Domain Whitelist**: Add trusted domains that won't be filtered
6. **Keyword Blocking**: Block entire pages based on URL/title keywords
7. **Password Protection**: Optional password to prevent settings changes
8. **Simple UI**: Clean, minimal dashboard interface

## Installation

### For Desktop Chrome/Edge:

1. Download this extension folder
2. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `nsfw-blocker-extension` folder

### For Android (Edge Canary):

1. Copy the `nsfw-blocker-extension` folder to your Android device
2. Open Edge Canary
3. Navigate to `edge://extensions`
4. Enable "Developer mode"
5. Tap "Load unpacked" and select the extension folder

**Note**: Mobile extension support is experimental and may require Edge Canary or Kiwi Browser.

## Setup Model (Required for AI Detection)

The extension needs an NSFW detection model. Follow these steps:

1. Go to the `model/` directory
2. Download a compatible TensorFlow.js model:
   - Option A: From nsfwjs repository
   - Option B: From Hugging Face (see model/README.md)
3. Place `model.json` and `.bin` files in the `model/` folder

Without the model, the extension will still work with keyword-based blocking but AI detection will use fallback mode.

## Usage

### Dashboard Controls:

1. **Enable Protection**: Toggle the extension on/off
2. **Sensitivity**: Slide to adjust detection threshold
   - Lower values (0.3-0.5): Less strict, fewer false positives
   - Higher values (0.7-0.9): More strict, catches more content
3. **Block Action**: Choose between:
   - Blur: Blurs content (click to reveal)
   - Remove: Completely hides content

### Whitelist Domains:
- Enter domain names (e.g., `example.com`)
- Whitelisted sites bypass all filtering

### Blocked Keywords:
- Add keywords to block entire pages
- Checks URL and page title
- Case-insensitive matching

### Password Protection:
- Enable to require password for settings changes
- Minimum 4 characters
- Prevents unauthorized disabling

## File Structure

```
nsfw-blocker-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Dashboard UI
├── popup.js               # Dashboard logic
├── src/
│   ├── background.js      # Service worker
│   ├── content.js         # Content script (runs on pages)
│   └── nsfw-filter.js     # AI model integration
├── model/
│   ├── README.md          # Model setup instructions
│   └── [model files]      # TensorFlow.js model
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Technical Details

### WebGPU Acceleration
- Attempts to use WebGPU backend first (best performance)
- Falls back to WebGL if WebGPU unavailable
- Optimized for mobile devices

### Detection Process
1. Monitors DOM for new images/videos
2. Captures frames to canvas
3. Runs through TensorFlow.js model
4. Calculates NSFW score based on predictions
5. Applies action if score exceeds sensitivity threshold

### Categories Detected
- Drawing
- Hentai
- Neutral
- Porn
- Sexy

NSFW Score = (Porn × 1.0) + (Hentai × 1.0) + (Sexy × 0.5)

## Troubleshooting

**Extension not working:**
- Ensure model files are in place
- Check browser console for errors
- Verify extension is enabled in `chrome://extensions`

**Slow performance:**
- Lower the sensitivity setting
- Reduce number of monitored tabs
- Ensure WebGPU/WebGL is enabled in browser

**False positives:**
- Decrease sensitivity
- Add domain to whitelist

## Privacy

- All processing happens locally on your device
- No data is sent to external servers
- Settings sync via Chrome storage (optional)

## License

MIT License - Feel free to modify and distribute.

## Credits

Inspired by [ClearNetSky/NSFW-Filter](https://github.com/ClearNetSky/NSFW-Filter) with additional features for video support, keyword blocking, and enhanced UI.
