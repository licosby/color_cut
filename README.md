# ColorCut 3D

A web-based 3D model color separator with a Silhouette Studio-inspired UI. Upload multi-colored 3D models and automatically detect, isolate, and export each color as separate STL files for multi-color 3D printing.

![ColorCut 3D](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### Core Functionality
- **Multi-format Support**: Load STL, OBJ, GLB, and 3MF files
- **Automatic Color Detection**: Analyzes vertex colors and material colors
- **Color Grouping**: Groups triangles by color with adjustable sensitivity
- **Click-to-Select**: Click directly on the 3D model to select colors
- **Individual Export**: Export each color as a separate STL file
- **Batch Export**: Export all colors at once

### User Interface
- **Silhouette Studio Style**: Light theme with rounded corners and soft shadows
- **Left Tool Panel**: Mode selection (Select, Highlight, Export)
- **Right Color Panel**: Color palette with swatches and export buttons
- **Top Toolbar**: Load, Reset View, and Export All buttons
- **3D Viewer**: Orbit, pan, zoom controls with click-to-select

### Advanced Features
- **Raycasting**: Precise triangle picking for click-to-select
- **Camera Controls**: Full orbit controls with reset functionality
- **Color Sensitivity**: Adjustable quantization to merge similar colors
- **Real-time Updates**: Instant feedback when adjusting settings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/colorcut-3d.git
cd colorcut-3d

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the web app
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
colorcut-3d/
├── electron/                    # Electron desktop wrapper
│   ├── main.js                 # Main process
│   ├── preload.js              # Preload script for IPC
│   └── electron-builder.yml    # Packaging config
│
├── src/
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   │
│   ├── geometry/               # 3D geometry processing
│   │   ├── ModelLoader.ts      # Load STL/OBJ/GLB/3MF
│   │   ├── ColorGrouper.ts     # Group triangles by color
│   │   └── ExportEngine.ts     # Export color groups as STL
│   │
│   ├── viewer/                 # 3D viewer
│   │   ├── Viewer.tsx          # Three.js viewport
│   │   └── Highlighting.ts     # Color highlighting
│   │
│   ├── ui/                     # UI components
│   │   ├── TopBar.tsx          # Top toolbar
│   │   ├── LeftPanel.tsx       # Left tool panel
│   │   └── ColorPanel.tsx      # Right color palette
│   │
│   └── state/                  # State management
│       └── UIState.tsx         # React context + reducer
│
├── public/                     # Static assets
├── index.html                  # HTML template
├── package.json
└── README.md
```

## 🎨 Usage

### Loading a Model
1. Click **Load Model** in the top toolbar
2. Select a 3D file (STL, OBJ, GLB, or 3MF)
3. The model loads and colors are automatically detected

### Selecting Colors
**Method 1: Click on Model**
- Click directly on the 3D model to select the color under your cursor
- The color swatch highlights and scrolls into view in the right panel

**Method 2: Click on Swatch**
- Click a color swatch in the right panel to highlight it in the viewer

### Adjusting Color Sensitivity
- Use the **Color Sensitivity** slider in the right panel
- Lower values = fewer color groups (merges similar colors)
- Higher values = more color groups (detects subtle differences)

### Exporting Colors
**Export Single Color:**
- Click **Export This Color** button on any color swatch

**Export All Colors:**
- Click **Export All Colors** in the top toolbar
- All colors are downloaded as separate STL files

### Camera Controls
- **Orbit**: Left-click + drag
- **Pan**: Right-click + drag (or Shift + left-click)
- **Zoom**: Scroll wheel
- **Reset View**: Click Reset View button in toolbar

## 🛠️ Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D rendering
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Electron** - Desktop wrapper (optional)

## 📦 Electron Desktop App

To build the desktop application:

```bash
# Install Electron dependencies
npm install --save-dev electron electron-builder

# Build the app
npm run build

# Package for your platform
npx electron-builder
```

### Supported Platforms
- **Windows**: NSIS installer (.exe)
- **macOS**: DMG installer (.dmg)
- **Linux**: AppImage and DEB packages

## 🎯 Use Cases

### Multi-Color 3D Printing
Separate a multi-colored model into individual STL files, one per color. Load each file into your slicer with the corresponding filament color.

### Color Analysis
Analyze the color distribution of 3D models to understand material requirements.

### Educational Tool
Teach kids and hobbyists about 3D printing and color separation in a friendly, approachable interface.

## 🔧 Configuration

### Color Quantization
The color grouper uses quantization to merge similar colors:
- Default level: 8
- Range: 2-32
- Higher = more precise color detection
- Lower = more aggressive color merging

### File Format Support
| Format | Vertex Colors | Material Colors | Notes |
|--------|--------------|-----------------|-------|
| STL    | ✅ Binary STL color extension | ❌ | Most common 3D printing format |
| OBJ    | ✅ | ✅ | Wavefront OBJ with MTL |
| GLB    | ✅ | ✅ | glTF binary format |
| 3MF    | ✅ | ✅ | 3D Manufacturing Format |

## 🐛 Troubleshooting

### No Colors Detected
- Ensure your model has vertex colors or material colors
- Try adjusting the color sensitivity slider
- Some STL files don't contain color information

### Click-to-Select Not Working
- Make sure you're clicking on the model, not the background
- Try zooming in for better precision
- Ensure the model is fully loaded before clicking

### Export Fails
- Check browser console for errors
- Ensure you have write permissions in the download folder
- Try a different browser if issues persist

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Three.js team for the amazing 3D library
- Silhouette Studio for the UI inspiration
- The 3D printing community

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for the 3D printing community**
