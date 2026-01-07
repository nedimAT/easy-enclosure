import { Params } from '../params'

export interface DimensionPoint {
  start3D: [number, number, number]  // 3D world position (start)
  end3D: [number, number, number]    // 3D world position (end)
  label: string                       // e.g., "100mm"
  axis: 'x' | 'y' | 'z'              // Which dimension
  color: string                       // Line/text color
}

const SPACING = 20  // Same as Renderer.tsx
const OFFSET = 15   // Offset dimension lines from model edges

/**
 * Calculate dimension annotation positions for a specific part
 * Takes into account the part's position in the scene layout
 */
export const calculateDimensions = (
  params: Params,
  partType: 'base' | 'lid' | 'seal'
): DimensionPoint[] => {
  const { length, width, height, roof, waterProof, sealThickness } = params

  let partPos: [number, number, number]
  let partWidth: number
  let partLength: number
  let partHeight: number

  // Calculate part position based on layout logic from Renderer.tsx
  switch (partType) {
    case 'base':
      partPos = waterProof
        ? [-width/2, -length/2, 0]
        : [-(width+(SPACING/2)), -length/2, 0]
      partWidth = width
      partLength = length
      partHeight = height
      break

    case 'lid':
      partPos = waterProof
        ? [(width/2)+SPACING, -length/2, 0]
        : [SPACING/2, -length/2, 0]
      partWidth = width
      partLength = length
      partHeight = roof
      break

    case 'seal':
      if (!waterProof) return []  // No seal if not waterproof
      partPos = [-width-(width/2)-SPACING, -length/2, 0]
      partWidth = width
      partLength = length
      partHeight = sealThickness
      break

    default:
      return []
  }

  const [baseX, baseY, baseZ] = partPos

  return [
    // Length dimension (along Y axis, offset to the left in X)
    {
      start3D: [baseX - OFFSET, baseY, baseZ],
      end3D: [baseX - OFFSET, baseY + partLength, baseZ],
      label: `${partLength.toFixed(1)}mm`,
      axis: 'y',
      color: '#4fef4f'  // Green for Y
    },

    // Width dimension (along X axis, offset below in Y)
    {
      start3D: [baseX, baseY - OFFSET, baseZ],
      end3D: [baseX + partWidth, baseY - OFFSET, baseZ],
      label: `${partWidth.toFixed(1)}mm`,
      axis: 'x',
      color: '#f84545'  // Red for X
    },

    // Height dimension (along Z axis, offset to the right in X)
    {
      start3D: [baseX + partWidth + OFFSET, baseY + partLength/2, baseZ],
      end3D: [baseX + partWidth + OFFSET, baseY + partLength/2, baseZ + partHeight],
      label: `${partHeight.toFixed(1)}mm`,
      axis: 'z',
      color: '#4aa3f1'  // Blue for Z
    }
  ]
}