# 3D Models Directory

## How to Add the BMW M4 Model

1. **Download the model from Sketchfab:**
   - Go to: https://sketchfab.com/3d-models/bmw-m4-f82-razor-2014-wwwvecarzcom-25d00f20b8cf4828bd934acb31e0aae4
   - Click "Download 3D Model" button
   - Select **GLB** format (recommended) or **GLTF** format
   - Save the file

2. **Place the model file here:**
   - Rename the downloaded file to `bmw-m4.glb` (or `bmw-m4.gltf`)
   - Place it in this directory: `frontend/public/models/bmw-m4.glb`

3. **The model will automatically load** in the sign-in page 3D scene!

## Alternative: Use a Different Model

If you want to use a different model file:
- Place your `.glb` or `.gltf` file in this directory
- Update the `modelPath` prop in `ThreeScene.js` to point to your file
- Example: `modelPath="/models/your-model.glb"`

## Supported Formats

- **GLB** (recommended) - Binary GLTF format, includes textures
- **GLTF** - JSON format, may need separate texture files

