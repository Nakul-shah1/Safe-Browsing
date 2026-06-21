// NSFW Filter Model - Using TensorFlow.js with WebGPU backend
// This is a simplified model loader that will use nsfwjs compatible model

export class NSFWFilter {
  constructor() {
    this.model = null;
    this.tf = null;
    this.initialized = false;
    this.useWebGPU = true;
  }

  async initialize() {
    try {
      // Load TensorFlow.js
      this.tf = await this.loadTensorFlow();
      
      // Try to use WebGPU backend first for GPU acceleration
      if (this.useWebGPU) {
        try {
          await this.tf.setBackend('webgpu');
          console.log('NSFW Filter: Using WebGPU backend');
        } catch (e) {
          console.log('NSFW Filter: WebGPU not available, falling back to WebGL');
          await this.tf.setBackend('webgl');
        }
      } else {
        await this.tf.setBackend('webgl');
      }

      // Load the NSFW model
      // Using a mobile-optimized model from Hugging Face or similar
      const modelUrl = chrome.runtime.getURL('model/model.json');
      this.model = await this.tf.loadGraphModel(modelUrl);
      
      this.initialized = true;
      console.log('NSFW Filter: Model loaded successfully');
      return true;
    } catch (error) {
      console.error('NSFW Filter: Failed to initialize', error);
      // Fallback to a simpler approach
      this.initialized = true;
      return false;
    }
  }

  async loadTensorFlow() {
    // Dynamically load TensorFlow.js
    return new Promise((resolve, reject) => {
      if (window.tf) {
        resolve(window.tf);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
      script.onload = () => resolve(window.tf);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async classifyImage(imageElement) {
    if (!this.initialized || !this.model) {
      return this.fallbackClassification();
    }

    try {
      const tensor = this.tf.browser.fromPixels(imageElement);
      const resized = this.tf.image.resizeBilinear(tensor, [224, 224]);
      const normalized = resized.toFloat().div(tf.scalar(255.0));
      const batched = normalized.expandDims(0);
      
      const predictions = await this.model.predict(batched).data();
      
      // NSFWJS categories: drawing, hentai, neutral, porn, sexy
      const classes = ['drawing', 'hentai', 'neutral', 'porn', 'sexy'];
      const results = {};
      
      classes.forEach((cls, i) => {
        results[cls] = predictions[i];
      });
      
      return results;
    } catch (error) {
      console.error('NSFW Filter: Classification error', error);
      return this.fallbackClassification();
    }
  }

  async classifyVideoFrame(videoElement) {
    return await this.classifyImage(videoElement);
  }

  fallbackClassification() {
    // Fallback when model is not available
    return {
      drawing: 0,
      hentai: 0,
      neutral: 1,
      porn: 0,
      sexy: 0
    };
  }

  getNSFWScore(predictions) {
    const pornScore = predictions.porn || 0;
    const hentaiScore = predictions.hentai || 0;
    const sexyScore = predictions.sexy || 0;
    
    // Weighted score: porn and hentai are more severe than sexy
    return (pornScore * 1.0) + (hentaiScore * 1.0) + (sexyScore * 0.5);
  }
}

// Export singleton instance
export const nsfwFilter = new NSFWFilter();
