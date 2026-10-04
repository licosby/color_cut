# How to Paint and Separate Parts

## 🎨 The Simple Workflow

**You can now paint directly on your model and separate the painted areas!**

---

## 📋 Step-by-Step Guide

### Step 1: Load Your Model
```
1. Click "Load Model" button
2. Select your 3D file (STL, OBJ, GLB, or 3MF)
3. Wait for it to load
```

### Step 2: Switch to Paint Mode
```
1. Look at the LEFT toolbar
2. Click the 🖌️ Paint button
3. The button will highlight (purple border)
4. You're now in paint mode!
```

### Step 3: Paint on the Model
```
1. Move your mouse over the 3D model
2. CLICK AND DRAG to paint
3. You'll see red highlights where you paint
4. Keep dragging to paint more areas
5. Release mouse button to stop painting
```

**What you'll see:**
- **Red areas** = Painted triangles (in Add mode)
- **Teal areas** = Erased triangles (in Remove mode)

### Step 4: Adjust Your Painting (Optional)

**Change brush size:**
- Look at the RIGHT panel
- Find "Brush Size" slider
- Drag to make brush bigger or smaller
- Or type a number in the input box

**Switch between Add/Remove:**
- Click "+ Add" to paint new areas
- Click "- Remove" to erase painted areas
- Use Remove to clean up edges

### Step 5: Separate the Painted Area
```
1. Look at the TOP toolbar
2. Click the pink "Separate" button
3. The painted area becomes a new layer!
4. You'll see it in the Layers panel on the right
```

### Step 6: Repeat for More Parts
```
1. Paint another area
2. Click "Separate" again
3. Each painted area becomes a separate layer
4. Continue until all parts are separated
```

### Step 7: Export
```
1. Click "Export All Layers" (blue button, top right)
2. Each layer downloads as a separate STL file
3. Print each file with different filament colors
```

---

## 🎯 Example: Separating a Hat from a Head

**Scenario:** You have a character model and want to separate the hat

### Method 1: Paint the Hat
```
1. Load character model
2. Click 🖌️ Paint mode
3. Set brush size to "Large" (150px)
4. Click and drag over the hat
5. Paint the entire hat (it turns red)
6. Click "Separate"
7. Done! Hat is now Layer 1
```

### Method 2: Paint the Head
```
1. Click 🖌️ Paint mode
2. Set brush size to "Large" (150px)
3. Click and drag over the head
4. Paint the entire head (it turns red)
5. Click "Separate"
6. Done! Head is now Layer 2
```

### Method 3: Export Both
```
1. Click "Export All Layers"
2. Download hat.stl and head.stl
3. Print hat with red filament
4. Print head with skin-tone filament
5. Assemble or display separately
```

**Total time:** 1-2 minutes!

---

## 🖌️ Paint Mode Controls

### Brush Size
- **Fine (10px)** - For detailed work
- **Small (30px)** - For small areas
- **Medium (75px)** - Default, good for most work
- **Large (150px)** - For large areas
- **Huge (300px)** - For covering big sections fast

**Or type any size** from 5px to 500px!

### Paint Modes
- **+ Add** - Paints triangles as you drag (red highlight)
- **- Remove** - Erases painted triangles as you drag (teal highlight)

### Mouse Actions
- **Click and drag** - Paint continuously
- **Release mouse** - Stop painting
- **Move mouse** - See where you'll paint

---

## 💡 Tips for Best Results

### Tip 1: Use the Right Brush Size
- **Large brush** for big areas (hat, shirt, pants)
- **Medium brush** for medium areas (arms, legs)
- **Small brush** for details (buttons, features)

### Tip 2: Clean Up Edges
1. Paint the main area with large brush
2. Switch to "Remove" mode
3. Use small brush to clean up edges
4. Switch back to "Add" mode
5. Fill in any missed spots

### Tip 3: Zoom In for Details
- Use scroll wheel to zoom in
- Paint with smaller brush
- Zoom out to see the whole model

### Tip 4: Rotate the Model
- Left-click + drag to orbit
- See all sides of the model
- Paint from different angles

### Tip 5: Use Undo if You Make a Mistake
- Press `Ctrl+Z` (Windows) or `Cmd+Z` (Mac)
- Undoes your last paint stroke
- Keep pressing to undo more

---

## 🎨 Visual Feedback

### What You'll See

**Before painting:**
- Model in original colors (or gray)
- No highlights

**While painting:**
- Red areas where you paint (Add mode)
- Teal areas where you erase (Remove mode)
- Real-time feedback as you drag

**After separating:**
- Painted area becomes a new layer
- Layer appears in Layers panel
- You can hide/show layers
- You can rename layers

---

## 🐛 Troubleshooting

### Problem: Can't paint on the model

**Check:**
1. Are you in Paint mode? (🖌️ button highlighted?)
2. Is the model loaded?
3. Are you clicking ON the model (not the background)?
4. Try clicking directly on the model surface

### Problem: Paint doesn't show up

**Try:**
1. Make sure you're clicking and dragging (not just clicking)
2. Check brush size (try "Large" or "Huge")
3. Zoom in to see the model better
4. Rotate the model to see all sides

### Problem: Can't separate after painting

**Check:**
1. Did you paint any triangles? (should see red/teal highlights)
2. Is the "Separate" button enabled? (should be pink, not gray)
3. Try clicking "Separate" again

### Problem: Painted too much

**Solution:**
1. Switch to "Remove" mode
2. Use brush to erase the extra areas
3. Or press `Ctrl+Z` to undo
4. Or click "Clear All" to start over

### Problem: Painted too little

**Solution:**
1. Increase brush size
2. Paint more areas
3. Use larger brush for faster coverage

---

## 🎯 Complete Workflow Example

### Scenario: Separate a character into 4 parts

**Goal:** Hat, Head, Shirt, Pants

**Step 1: Load Model**
```
Load character.stl
```

**Step 2: Separate Hat**
```
1. Click 🖌️ Paint mode
2. Set brush to "Large" (150px)
3. Click and drag over hat
4. Paint entire hat (turns red)
5. Click "Separate"
6. Hat → Layer 1
```

**Step 3: Separate Head**
```
1. Still in Paint mode
2. Click and drag over head
3. Paint entire head (turns red)
4. Click "Separate"
5. Head → Layer 2
```

**Step 4: Separate Shirt**
```
1. Click and drag over shirt
2. Paint entire shirt (turns red)
3. Click "Separate"
4. Shirt → Layer 3
```

**Step 5: Separate Pants**
```
1. Click and drag over pants
2. Paint entire pants (turns red)
3. Click "Separate"
4. Pants → Layer 4
```

**Step 6: Export**
```
1. Click "Export All Layers"
2. Downloads 4 STL files:
   - character_layer1_hat.stl
   - character_layer2_head.stl
   - character_layer3_shirt.stl
   - character_layer4_pants.stl
```

**Step 7: Print**
```
1. Print hat.stl with red filament
2. Print head.stl with skin-tone filament
3. Print shirt.stl with blue filament
4. Print pants.stl with black filament
```

**Total time:** 3-5 minutes!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last paint stroke |
| `Ctrl+Y` | Redo last undone stroke |
| `P` | Switch to Paint mode |
| `S` | Switch to Select mode |
| `Esc` | Clear selection |

---

## 📊 Comparison

### Before (Old Way)
```
❌ Select triangles one by one
❌ Slow and tedious
❌ Hard to select large areas
❌ Takes forever
```

### Now (New Way)
```
✅ Click and drag to paint
✅ Fast and intuitive
✅ Easy to select large areas
✅ Takes seconds
```

---

## 🎉 You're Ready!

**You can now:**
- ✅ Load any 3D model
- ✅ Paint directly on the model
- ✅ See what you're painting in real-time
- ✅ Separate painted areas into layers
- ✅ Export each layer as separate STL
- ✅ Print in multiple colors

**The workflow is simple:**
1. Load model
2. Click Paint mode
3. Paint what you want to separate
4. Click Separate
5. Repeat for other parts
6. Export all layers

**That's it!** No more selecting individual triangles. Just paint and separate!

---

## 🚀 Try It Now!

1. Load a model
2. Click 🖌️ Paint mode
3. Click and drag on the model
4. Watch it paint in real-time
5. Click "Separate"
6. Done!

**It's that simple!** 🎨✨
