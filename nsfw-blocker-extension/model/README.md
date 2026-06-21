# NSFW Detection Model

This directory should contain the TensorFlow.js model files for NSFW detection.

## Required Files:
- `model.json` - Model architecture and weights manifest
- `group1-shard1of1.bin` (or similar) - Model weights

## How to Get the Model:

### Option 1: Download from nsfwjs
1. Visit: https://github.com/infinitered/nsfwjs
2. Download the mobile model from their releases or CDN
3. Place the files in this directory

### Option 2: Use Pre-trained Model from Hugging Face
```bash
# Download a compatible model
wget https://huggingface.co/xander10/nsfw-keras/resolve/main/model.json
wget https://huggingface.co/xander10/nsfw-keras/resolve/main/group1-shard1of1.bin
```

### Option 3: Convert Your Own Model
Use TensorFlow.js converter to convert a Keras/TensorFlow model:
```bash
tensorflowjs_converter --input_format=keras your_model.h5 ./model
```

## Model Requirements:
- Input size: 224x224 pixels
- Output classes: ['drawing', 'hentai', 'neutral', 'porn', 'sexy']
- Format: TensorFlow.js Graph Model

## Note:
The extension will work without the model file but will use fallback classification.
For full functionality, please add a compatible NSFW detection model.
