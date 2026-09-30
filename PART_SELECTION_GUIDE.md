# Part Selection Feature - User Guide

## Overview

The **Part Selection** feature allows you to select and separate connected parts of a 3D model based on topology (geometry) rather than color. This is perfect for separating parts that are the same color but should be different pieces - like a hat attached to a character's head.

## How It Works

### Topology-Based Selection

Unlike color-based selection, part selection uses **flood fill with angle detection**:

1. **Click on any triangle** of the part you want to select
2. The algorithm **floods outward** from that triangle
3. It **stops at sharp edges** (where the angle between faces exceeds your threshold)
4. All connected triangles below the threshold are selected as one "part"

### Angle Threshold

The **Edge Angle** slider controls how aggressive the separation is:

- **Low values (5-20°)**: Separates at very subtle edges
  - Good for: Parts with gentle curves that should be separate
  - Example: Separating a slightly raised emblem from a flat surface
  
- **Medium values (20-45°)**: Separates at moderate edges (DEFAULT)
  - Good for: Most common use cases
  - Example: Separating a hat from a head, arms from a torso
  
- **High values (45-90°)**: Only separates at very sharp edges
  - Good for: Only separating at dramatic geometric changes
  - Example: Separating completely distinct geometric regions

## Step-by-Step Workflow

### 1. Load Your Model
- Click **Load Model** and select your 3D file (STL, OBJ, GLB, 3MF)
- The model appears in the viewer

### 2. Switch to Part Mode
- Click the **🧩 Part** button in the left toolbar
- The right panel shows the **Edge Angle** slider

### 3. Adjust Edge Angle (if needed)
- Start with the default (45°)
- If the selection is too large: **decrease** the angle
- If the selection is too small: **increase** the angle

### 4. Click on the Part
- Click directly on the part you want to separate (e.g., the hat)
- The selected part highlights in **blue**
- The right panel shows "Part Selected" with triangle count

### 5. Separate the Part
- Click **Separate** in the top toolbar
- A new layer is created containing only the selected part
- The part appears in the **Layers Panel** on the right

### 6. Repeat for Other Parts
- Click on another part (e.g., the head)
- Adjust angle if needed
- Click **Separate** again
- Continue until all parts are separated

### 7. Export All Layers
- Click **Export All Layers** in the top toolbar
- Each layer is exported as a separate STL file
- Files are named: `model_layer1_part.stl`, `model_layer2_part.stl`, etc.

## Tips for Best Results

### Finding the Right Angle

**Start with 45°** and adjust based on results:

| Symptom | Solution |
|---------|----------|
| Selection includes too much | Decrease angle (try 30° or 20°) |
| Selection is too small | Increase angle (try 60° or 75°) |
| Selection stops at smooth curves | Increase angle |
| Selection crosses sharp edges | Decrease angle |

### Common Use Cases

#### Hat on Character Head
- **Angle**: 30-45°
- **Why**: The hat typically meets the head at a moderate angle
- **Tip**: Click on the top of the hat, not the brim

#### Arms on Torso
- **Angle**: 25-40°
- **Why**: Shoulder joints create sharp edges
- **Tip**: Click on the middle of the arm

#### Base on Model
- **Angle**: 60-80°
- **Why**: Bases often have very sharp 90° edges
- **Tip**: Click on the side of the base

#### Embedded Details
- **Angle**: 10-25°
- **Why**: Subtle raised details need low threshold
- **Tip**: Click directly on the detail

### Troubleshooting

**Problem**: Can't separate the parts I want
- **Solution**: Try different angle values
- **Solution**: Click on different starting points
- **Solution**: Check if parts are actually connected in the mesh

**Problem**: Selection includes unwanted areas
- **Solution**: Decrease the angle threshold
- **Solution**: The parts may be smoothly connected - consider manual editing

**Problem**: Selection is too small
- **Solution**: Increase the angle threshold
- **Solution**: Try clicking on a different part of the same region

## Technical Details

### Algorithm

1. **Build adjacency graph**: For each triangle, find all triangles sharing vertices
2. **Calculate face normals**: Compute the normal vector for each triangle
3. **Flood fill**: Starting from clicked triangle, expand to neighbors
4. **Angle check**: Only expand if angle between normals < threshold
5. **Return selected set**: All triangles reachable within angle threshold

### Performance

- **Adjacency graph**: Built once when model loads (~100ms for 100k triangles)
- **Selection**: Very fast (~10ms) using breadth-first search
- **Memory**: ~2x model size for adjacency data

### Limitations

- Works on **manifold meshes** (watertight, no holes)
- May struggle with **non-manifold geometry**
- Very smooth transitions may require manual separation
- Cannot separate parts that are **smoothly blended** without any edge

## Comparison: Color vs Part Selection

| Feature | Color Selection | Part Selection |
|---------|----------------|----------------|
| **Basis** | Vertex/material colors | Geometry topology |
| **Best for** | Multi-color models | Same-color parts |
| **Accuracy** | Exact color boundaries | Geometric edges |
| **Speed** | Instant | Very fast |
| **Use case** | Colored figurines | Mechanical parts, characters |

## Example Workflow: Character with Hat

1. **Load** character model (hat and head are same color)
2. **Switch** to Part mode (🧩 button)
3. **Set angle** to 35°
4. **Click** on the hat
5. **Verify** only the hat is highlighted in blue
6. **Click Separate** → Hat becomes Layer 1
7. **Click** on the head
8. **Verify** only the head is highlighted
9. **Click Separate** → Head becomes Layer 2
10. **Export All Layers** → Two separate STL files

## Keyboard Shortcuts

- **P**: Switch to Part mode
- **Escape**: Clear current selection
- **Enter**: Separate selected part (when in Part mode)

## Future Enhancements

- [ ] Manual triangle painting (add/remove from selection)
- [ ] Selection history (undo/redo)
- [ ] Selection preview before separating
- [ ] Export selected part only (without creating layer)
- [ ] Symmetry detection (select both sides)
- [ ] Smart angle suggestion based on model analysis

---

**Need help?** The angle threshold is the key to success. Experiment with different values to find what works best for your specific model!
