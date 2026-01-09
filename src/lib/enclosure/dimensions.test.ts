import { calculateDimensions } from './dimensions'
import { Params } from '../params'

// Helper to create minimal valid params for testing
const createTestParams = (overrides: Partial<Params> = {}): Params => ({
  length: 80,
  width: 100,
  height: 30,
  floor: 2,
  roof: 2,
  wall: 1,
  waterProof: true,
  sealThickness: 2,
  insertThickness: 2,
  insertHeight: 4,
  insertClearance: 0.04,
  showLid: true,
  showBase: true,
  showDimensions: true,
  cornerRadius: 3,
  holes: [],
  pcbMounts: [],
  wallMounts: false,
  wallMountScrewDiameter: 3.98,
  lidScrews: false,
  lidScrewDiameter: 2.98,
  baseLidScrewDiameter: 2.88,
  ...overrides
})

describe('calculateDimensions', () => {
  describe('base part', () => {
    it('should return 3 dimensions (length, width, height)', () => {
      const params = createTestParams()
      const dims = calculateDimensions(params, 'base')

      expect(dims).toHaveLength(3)
    })

    it('should calculate correct dimension labels', () => {
      const params = createTestParams({
        length: 80,
        width: 100,
        height: 30
      })
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].label).toBe('80.0mm')  // Length (Y-axis)
      expect(dims[1].label).toBe('100.0mm') // Width (X-axis)
      expect(dims[2].label).toBe('30.0mm')  // Height (Z-axis)
    })

    it('should use correct axis labels', () => {
      const params = createTestParams()
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].axis).toBe('y')  // Length
      expect(dims[1].axis).toBe('x')  // Width
      expect(dims[2].axis).toBe('z')  // Height
    })

    it('should use correct color coding (CAD standard)', () => {
      const params = createTestParams()
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].color).toBe('#4fef4f')  // Green for Y
      expect(dims[1].color).toBe('#f84545')  // Red for X
      expect(dims[2].color).toBe('#4aa3f1')  // Blue for Z
    })

    it('should position dimensions in waterproof mode', () => {
      const params = createTestParams({ waterProof: true, width: 100 })
      const dims = calculateDimensions(params, 'base')

      // Base is positioned at [-width/2, -length/2, 0] in waterproof mode
      // Length dimension should start at baseX - OFFSET
      expect(dims[0].start3D[0]).toBe(-100/2 - 15)  // -50 - 15 = -65
    })

    it('should position dimensions in non-waterproof mode', () => {
      const params = createTestParams({ waterProof: false, width: 100 })
      const dims = calculateDimensions(params, 'base')

      // SPACING = 20
      // Base is positioned at [-(width+SPACING/2), -length/2, 0]
      expect(dims[0].start3D[0]).toBe(-(100 + 20/2) - 15)  // -110 - 15 = -125
    })
  })

  describe('lid part', () => {
    it('should use roof thickness for height dimension', () => {
      const params = createTestParams({ roof: 5 })
      const dims = calculateDimensions(params, 'lid')

      expect(dims[2].label).toBe('5.0mm')  // Height uses roof thickness
    })

    it('should return same length and width as base', () => {
      const params = createTestParams({
        length: 75,
        width: 95,
        roof: 3
      })
      const dims = calculateDimensions(params, 'lid')

      expect(dims[0].label).toBe('75.0mm')  // Length
      expect(dims[1].label).toBe('95.0mm')  // Width
    })
  })

  describe('seal part', () => {
    it('should return empty array when not waterproof', () => {
      const params = createTestParams({ waterProof: false })
      const dims = calculateDimensions(params, 'seal')

      expect(dims).toHaveLength(0)
    })

    it('should use sealThickness for height when waterproof', () => {
      const params = createTestParams({ waterProof: true, sealThickness: 3 })
      const dims = calculateDimensions(params, 'seal')

      expect(dims[2].label).toBe('3.0mm')
    })

    it('should position seal offset from base and lid', () => {
      const params = createTestParams({ waterProof: true, width: 100 })
      const dims = calculateDimensions(params, 'seal')

      // SPACING = 20
      // Seal is positioned at [-width - width/2 - SPACING, -length/2, 0]
      expect(dims[0].start3D[0]).toBe(-100 - 100/2 - 20 - 15)  // -185
    })
  })

  describe('edge cases', () => {
    it('should handle fractional dimensions correctly', () => {
      const params = createTestParams({
        length: 80.5,
        width: 100.7,
        height: 30.3
      })
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].label).toBe('80.5mm')
      expect(dims[1].label).toBe('100.7mm')
      expect(dims[2].label).toBe('30.3mm')
    })

    it('should handle very small dimensions', () => {
      const params = createTestParams({
        length: 1,
        width: 1,
        height: 1
      })
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].label).toBe('1.0mm')
      expect(dims[1].label).toBe('1.0mm')
      expect(dims[2].label).toBe('1.0mm')
    })

    it('should handle very large dimensions', () => {
      const params = createTestParams({
        length: 1000,
        width: 2000,
        height: 500
      })
      const dims = calculateDimensions(params, 'base')

      expect(dims[0].label).toBe('1000.0mm')
      expect(dims[1].label).toBe('2000.0mm')
      expect(dims[2].label).toBe('500.0mm')
    })
  })

  describe('dimension line positioning', () => {
    const OFFSET = 15

    it('should offset length dimension to the left', () => {
      const params = createTestParams({ waterProof: true, width: 100, length: 80 })
      const dims = calculateDimensions(params, 'base')
      const lengthDim = dims[0]

      // Should be offset in -X direction
      expect(lengthDim.start3D[0]).toBe(-100/2 - OFFSET)
      expect(lengthDim.end3D[0]).toBe(-100/2 - OFFSET)

      // Should span full length in Y
      expect(lengthDim.start3D[1]).toBe(-80/2)
      expect(lengthDim.end3D[1]).toBe(-80/2 + 80)
    })

    it('should offset width dimension below', () => {
      const params = createTestParams({ waterProof: true, width: 100, length: 80 })
      const dims = calculateDimensions(params, 'base')
      const widthDim = dims[1]

      // Should span full width in X
      expect(widthDim.start3D[0]).toBe(-100/2)
      expect(widthDim.end3D[0]).toBe(-100/2 + 100)

      // Should be offset in -Y direction
      expect(widthDim.start3D[1]).toBe(-80/2 - OFFSET)
      expect(widthDim.end3D[1]).toBe(-80/2 - OFFSET)
    })

    it('should offset height dimension to the right and centered', () => {
      const params = createTestParams({ waterProof: true, width: 100, length: 80, height: 30 })
      const dims = calculateDimensions(params, 'base')
      const heightDim = dims[2]

      // Should be offset in +X direction
      expect(heightDim.start3D[0]).toBe(-100/2 + 100 + OFFSET)
      expect(heightDim.end3D[0]).toBe(-100/2 + 100 + OFFSET)

      // Should be centered in Y
      expect(heightDim.start3D[1]).toBe(-80/2 + 80/2)
      expect(heightDim.end3D[1]).toBe(-80/2 + 80/2)

      // Should span full height in Z
      expect(heightDim.start3D[2]).toBe(0)
      expect(heightDim.end3D[2]).toBe(30)
    })
  })
})