# ColorCut 3D - Quick Start Guide

## 🎯 What You Should See

When you open ColorCut 3D, you should see:

1. **Top Toolbar** - With "ColorCut 3D" logo, Load Model button, and other controls
2. **Left Toolbar** - Vertical buttons for different modes (Select, Paint, etc.)
3. **Center 3D Viewport** - Light gray background with a welcome message
4. **Right Panel** - Color palette, layers, and other controls

### Welcome Screen (Before Loading a Model)

The center viewport should show:
- A purple gradient icon
- "Welcome to ColorCut 3D" text
- Instructions: "Upload a multi-colored 3D model..."
- Format badges: STL, OBJ, GLB, 3MF
- Workflow steps: 1. Load → 2. Select → 3. Separate → 4. Export

**If you see a black screen instead**, try:
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Check browser console for errors (F12 → Console tab)
3. Make sure JavaScript is enabled

---

## 🚀 How to Use

### Step 1: Load a Model

**Option A: Click "Load Model" button**
1. Click the purple "Load Model" button in the top toolbar
2. Select a 3D file (STL, OBJ, GLB, or 3MF)
3. Wait for it to load (2-5 seconds)

**Option B: Drag and Drop**
1. Drag a 3D file from your computer
2. Drop it anywhere in the ColorCut 3D window
3. Wait for it to load

### Step 2: Select a Part

**Method 1: Click on Colors (Easiest)**
1. Look at the right panel - you'll see detected colors
2. Click on a color swatch
3. That color highlights in the 3D view
4. Click "Separate" in the top toolbar
5. Done! That color is now a separate layer

**Method 2: Click Directly on Model**
1. Click directly on the part you want to select
2. The color of that part gets selected in the right panel
3. Click "Separate" in the top toolbar
4. Done!

### Step 3: Separate More Parts

Repeat Step 2 for each part you want to separate:
- Click a color or click on the model
- Click "Separate"
- Each separated part becomes a new layer

### Step 4: Export

1. Click "Export All Layers" in the top toolbar
2. Each layer downloads as a separate STL file
3. Print each file with a different color filament

---

## ✅ What's Working Right Now

### Core Features
- ✅ **Load 3D models** (STL, OBJ, GLB, 3MF)
- ✅ **Detect colors** automatically
- ✅ **Click to select** colors or parts
- ✅ **Separate parts** into layers
- ✅ **Export layers** as separate STL files
- ✅ **3D viewport** with orbit/zoom/pan controls
- ✅ **Color palette** showing detected colors
- ✅ **Layer management** (rename, delete, hide/show)

### UI Features
- ✅ **Collapsible right panel** - Click the arrow to hide/show
- ✅ **Drag and drop** file loading
- ✅ **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- ✅ **Auto-save** every 30 seconds
- ✅ **Resume prompt** on page reload

---

## 🎨 Simple Workflow Example

**Goal:** Separate a character's hat from the head

1. **Load** character.stl
2. **Look** at the color palette on the right
3. **Click** on the hat's color (or click directly on the hat)
4. **Click** "Separate" in the top toolbar
5. **Hat is now Layer 1!**
6. **Click** on the head's color
7. **Click** "Separate" again
8. **Head is now Layer 2!**
9. **Click** "Export All Layers"
10. **Print** each layer with different filament colors

**Total time:** 30 seconds!

---

## 🐛 Troubleshooting

### Problem: Black Screen

**Try these:**
1. Refresh the page (Ctrl+F5)
2. Check browser console (F12 → Console)
3. Try a different browser (Chrome recommended)
4. Clear browser cache
5. Make sure WebGL is enabled

### Problem: Model Won't Load

**Check:**
- File format is supported (STL, OBJ, GLB, 3MF)
- File isn't corrupted
- File size is reasonable (< 100MB)
- Try a different file

### Problem: Can't Click on Model

**Try:**
- Make sure you're not in a special mode (check left toolbar)
- Reset the camera (click "Reset View" button)
- Zoom in/out to see the model better
- Rotate the view to see all sides

### Problem: Colors Not Detected

**This happens when:**
- Model has no vertex colors
- Model has no material colors
- All triangles are the same color

**Solution:**
- Use a multi-colored model
- Adjust "Color Sensitivity" slider in right panel
- Try Paint mode to manually select areas

---

## 📊 Current Status

### Working Features
- ✅ Basic 3D model loading and display
- ✅ Color detection and grouping
- ✅ Click-to-select (colors and parts)
- ✅ Layer creation and management
- ✅ STL export
- ✅ 3D viewport controls (orbit, zoom, pan)
- ✅ UI panels (color palette, layers, transforms)
- ✅ Undo/redo system
- ✅ Auto-save

### In Development
- 🔄 Magic Wand tool (instant part selection)
- 🔄 Smooth paint brush
- 🔄 Advanced selection tools
- 🔄 Performance optimizations for huge models

---

## 💡 Tips for Best Results

### For Multi-Color Models
- Use models with distinct colors
- Adjust "Color Sensitivity" if needed
- Click directly on parts for best results

### For Single-Color Models
- Use Paint mode to manually select areas
- Or use Magic Wand (when available) to select connected regions

### For Large Models
- Be patient during initial load
- Use smaller brush sizes for precision
- Save your work frequently (auto-save helps!)

---

## 🎯 What You Can Do Right Now

1. **Load** any 3D model (STL, OBJ, GLB, 3MF)
2. **See** all detected colors in the right panel
3. **Click** on colors to select them
4. **Separate** selected colors into layers
5. **Export** all layers as separate STL files
6. **Print** each layer with different filament

**That's it!** Simple, fast, effective.

---

## 🚀 Next Steps

Once you confirm the app is working:
1. Test with different model files
2. Try separating different parts
3. Export and verify the STL files
4. Let me know what works and what doesn't

**The goal:** Make this as simple as Bambu Studio's paint tool, but for separating parts instead of just coloring them.

---

## 📞 Need Help?

If you're still seeing a black screen or the app isn't working:

1. **Open browser console** (F12)
2. **Look for red error messages**
3. **Take a screenshot** of the console
4. **Tell me what you see**

Common errors and fixes:
- "WebGL not supported" → Try a different browser
- "Failed to load model" → Check file format
- "Cannot read property..." → Refresh the page

---

**ColorCut 3D - Point, Click, Separate!** 🎨✨
