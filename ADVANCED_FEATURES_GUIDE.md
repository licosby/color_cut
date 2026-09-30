# Advanced Features Guide - ColorCut 3D

## Overview

This guide covers the advanced features that give you complete control over separating and assembling 3D models:

1. **Manual Painting/Masking** - Paint specific areas to separate
2. **Explode View** - Separate all parts spatially to see individual components
3. **Connectors** - Add cylindrical connectors between separated parts
4. **Layer Visibility** - Hide/show individual layers

---

## 1. Manual Painting/Masking Mode

### When to Use
- When topology-based selection doesn't work well
- When you need precise control over what gets separated
- When parts are smoothly connected without clear edges
- When you want to "color" the area you want to move

### How to Use

1. **Activate Paint Mode**
   - Click the 🖌️ **Paint** button in the left toolbar
   - The right panel switches to Paint Tools

2. **Configure Brush**
   - **Brush Mode**: Choose "Add" (paint to select) or "Remove" (paint to deselect)
   - **Brush Size**: Adjust from 1 (fine) to 20 (broad)
   - Start with size 5 and adjust as needed

3. **Paint on Model**
   - **Click and drag** on the model to paint triangles
   - Red overlay = "Add" mode (selecting)
   - Teal overlay = "Remove" mode (deselecting)
   - The painted count updates in real-time

4. **Separate Painted Area**
   - Click **"Separate Painted Area"** button
   - The painted triangles become a new layer
   - Switches back to Select mode automatically

### Tips
- Use smaller brush (1-3) for detailed work
- Use larger brush (10-20) for broad areas
- Switch between Add/Remove to refine selection
- Clear all with "Clear All" button if needed

### Example: Removing a Hat
1. Switch to Paint mode
2. Set brush size to 3-5
3. Set mode to "Add"
4. Click and drag over the hat
5. Adjust selection with "Remove" mode if needed
6. Click "Separate Painted Area"
7. Hat is now a separate layer!

---

## 2. Explode View

### When to Use
- After separating parts to see all components clearly
- To inspect internal structure
- To verify all parts are properly separated
- For presentation/visualization

### How to Use

1. **Activate Explode View**
   - In the right panel, find "Explode View" section
   - Click the **ON/OFF** toggle button
   - When ON, all layers separate spatially

2. **Adjust Distance**
   - Use the **Distance** slider (0.5 to 5.0)
   - Low values (0.5-1.0) = parts close together
   - High values (3.0-5.0) = parts far apart
   - Default is 2.0

3. **Auto-Direction**
   - Each layer automatically moves away from center
   - Direction calculated from layer's center of mass
   - Creates natural "explosion" effect

### Tips
- Start with distance 2.0 and adjust
- Use lower distance for models with many parts
- Use higher distance to see small details
- Explode view works with connectors too!

---

## 3. Connectors

### When to Use
- After separating parts that need to be reconnected
- To add pegs/joints between components
- To show how parts fit together
- For assembly instructions

### How to Use

1. **Add a Connector**
   - In the right panel, find "Connectors" section
   - **From Layer**: Select the first layer
   - **To Layer**: Select the second layer
   - **Radius**: Adjust connector thickness (0.05-0.5)
   - **Color**: Choose connector color
   - Click **"Add Connector"**

2. **Automatic Placement**
   - Connector automatically connects layer centers
   - Updates position when explode view changes
   - Renders as a cylinder between layers

3. **Manage Connectors**
   - View all connectors in the list below
   - Click **X** to delete a connector
   - Connectors update in real-time

### Tips
- Use radius 0.1-0.2 for small pegs
- Use radius 0.3-0.5 for large joints
- Match connector color to model or use contrasting color
- Connectors work in both normal and explode view

### Example: Reconnecting Hat to Head
1. Separate hat into its own layer
2. Go to Connectors section
3. From Layer: "Hat"
4. To Layer: "Head"
5. Set radius to 0.15
6. Choose color (e.g., gray)
7. Click "Add Connector"
8. A peg now connects hat to head!

---

## 4. Layer Visibility

### When to Use
- To hide parts you're not working on
- To see internal structure
- To simplify the view
- To focus on specific components

### How to Use

1. **Toggle Visibility**
   - In the Layers panel, find the layer
   - Click the **eye icon** (👁️)
   - Layer disappears from view
   - Click again to show it

2. **Visual Feedback**
   - Visible layer: Eye icon is open
   - Hidden layer: Eye icon is crossed out
   - Hidden layers still exist in the layer list

### Tips
- Hide layers to reduce clutter
- Show/hide to compare different configurations
- Hidden layers don't affect connectors
- Use with explode view for complex assemblies

---

## Complete Workflow Example

### Scenario: Character with Hat, Arms, and Base

1. **Load Model**
   - Upload character model
   - All parts are one mesh

2. **Separate Hat (Paint Mode)**
   - Switch to 🖌️ Paint mode
   - Brush size: 4, Mode: Add
   - Paint over the hat
   - Click "Separate Painted Area"
   - Hat is now Layer 1

3. **Separate Arms (Part Mode)**
   - Switch to 🧩 Part mode
   - Angle threshold: 35°
   - Click on left arm
   - Click "Separate"
   - Left arm is now Layer 2
   - Repeat for right arm → Layer 3

4. **Separate Base (Color Mode)**
   - Switch to 🎯 Select mode
   - Click on base (different color)
   - Click "Separate"
   - Base is now Layer 4

5. **View All Parts (Explode View)**
   - Toggle Explode View ON
   - Set distance to 2.5
   - All parts separate clearly

6. **Add Connectors**
   - Add connector: Head → Hat (radius 0.12)
   - Add connector: Torso → Left Arm (radius 0.10)
   - Add connector: Torso → Right Arm (radius 0.10)
   - Add connector: Torso → Base (radius 0.20)

7. **Export All**
   - Click "Export All Layers"
   - Each part exports as separate STL
   - Connectors can be exported separately if needed

---

## Advanced Techniques

### Combining Selection Methods

1. **Start with Color Selection**
   - Use color mode for obvious color differences
   - Separate what you can easily

2. **Switch to Part Selection**
   - Use part mode for geometric separations
   - Adjust angle threshold as needed

3. **Finish with Paint Mode**
   - Use paint mode for tricky areas
   - Manually paint remaining parts

### Precision Painting

1. **Zoom In**
   - Get close to the area you're painting
   - Use smaller brush (1-3)
   - Paint carefully around edges

2. **Use Remove Mode**
   - Paint with "Add" to select most of area
   - Switch to "Remove" to clean up edges
   - Refine selection iteratively

3. **Check Painted Count**
   - Watch the triangle count
   - Should match expected area size
   - Too many = painted too much
   - Too few = missed some areas

### Explode View Tips

1. **Progressive Explosion**
   - Start with distance 1.0
   - Increase gradually to 3.0
   - Find the sweet spot for your model

2. **Selective Visibility**
   - Hide some layers
   - Explode remaining layers
   - See internal structure clearly

3. **Connector Alignment**
   - Add connectors before exploding
   - Connectors stretch with explode
   - Visualize how parts connect

---

## Troubleshooting

### Problem: Paint mode not working
**Solution**: 
- Make sure model is loaded
- Check you're clicking on the model, not background
- Try adjusting brush size

### Problem: Can't separate the hat
**Solution**:
- Switch to Paint mode
- Use smaller brush (2-3)
- Paint carefully over hat area
- Use Remove mode to clean up edges

### Problem: Explode view too crowded
**Solution**:
- Increase explode distance (3.0-5.0)
- Hide some layers
- Check layer count (many layers = more crowded)

### Problem: Connectors not showing
**Solution**:
- Make sure both layers have geometry
- Check layer visibility
- Verify connector was added (check list)

### Problem: Parts overlapping in explode view
**Solution**:
- Increase explode distance
- Check layer centers are different
- Manually adjust layer explode offsets (future feature)

---

## Keyboard Shortcuts

- **P**: Switch to Paint mode
- **E**: Toggle Explode view
- **Escape**: Clear painted triangles
- **Enter**: Separate painted area (in Paint mode)

---

## Performance Notes

### Painting Performance
- Large brush sizes (15-20) may be slower
- Complex models with 100k+ triangles: painting is still fast
- Painted triangle count: no limit

### Explode View Performance
- Works smoothly with up to 50 layers
- Distance changes are instant
- No performance impact on model loading

### Connector Performance
- Each connector adds minimal overhead
- Can have 100+ connectors without issues
- Connectors update in real-time

---

## Future Enhancements

Planned features:
- [ ] Manual layer explode offset adjustment
- [ ] Connector types (ball joints, pegs, slots)
- [ ] Connector snapping to surfaces
- [ ] Animated explode/assemble
- [ ] Export connectors as separate STL
- [ ] Connector strength/dimension settings
- [ ] Layer grouping
- [ ] Symmetry-aware painting

---

**Need help?** The manual painting mode is your best friend for tricky separations. When topology-based selection fails, just paint what you want!
