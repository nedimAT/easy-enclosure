import React, { useRef, useEffect } from 'react'
import { DimensionPoint } from '../lib/enclosure/dimensions'

interface CameraState {
  view: Float32Array
  projection: Float32Array
  viewport?: number[]
}

interface Props {
  camera: CameraState
  dimensions: DimensionPoint[]
  visible: boolean
}

/**
 * Project a 3D world space point to 2D screen coordinates
 * Returns null if the point is behind the camera
 */
const project3DTo2D = (
  point3D: [number, number, number],
  camera: CameraState
): [number, number] | null => {
  const [x, y, z] = point3D
  const view = camera.view
  const proj = camera.projection
  const viewport = camera.viewport || [0, 0, window.innerWidth, window.innerHeight]

  // Apply view transform (world space -> view space)
  const viewX = x * view[0] + y * view[4] + z * view[8] + view[12]
  const viewY = x * view[1] + y * view[5] + z * view[9] + view[13]
  const viewZ = x * view[2] + y * view[6] + z * view[10] + view[14]
  const viewW = x * view[3] + y * view[7] + z * view[11] + view[15]

  // Apply projection transform (view space -> clip space)
  const clipX = viewX * proj[0] + viewY * proj[4] + viewZ * proj[8] + viewW * proj[12]
  const clipY = viewX * proj[1] + viewY * proj[5] + viewZ * proj[9] + viewW * proj[13]
  const clipW = viewX * proj[3] + viewY * proj[7] + viewZ * proj[11] + viewW * proj[15]

  // Check if behind camera
  if (clipW <= 0) return null

  // Perspective divide to get NDC (normalized device coordinates)
  const ndcX = clipX / clipW
  const ndcY = clipY / clipW

  // NDC to screen space
  const screenX = (ndcX + 1) * viewport[2] / 2 + viewport[0]
  const screenY = (1 - ndcY) * viewport[3] / 2 + viewport[1]  // Flip Y axis

  return [screenX, screenY]
}

/**
 * Draw an arrow head at a point, pointing in the direction from->to
 */
const drawArrow = (
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  size = 8
) => {
  const [x1, y1] = from
  const [x2, y2] = to

  // Calculate angle
  const angle = Math.atan2(y2 - y1, x2 - x1)

  // Arrow head points
  const arrowAngle = Math.PI / 6  // 30 degrees
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(
    x2 - size * Math.cos(angle - arrowAngle),
    y2 - size * Math.sin(angle - arrowAngle)
  )
  ctx.lineTo(
    x2 - size * Math.cos(angle + arrowAngle),
    y2 - size * Math.sin(angle + arrowAngle)
  )
  ctx.closePath()
  ctx.fill()
}

/**
 * Draw a dimension line with arrows and label
 */
const drawDimensionLine = (
  ctx: CanvasRenderingContext2D,
  start2D: [number, number],
  end2D: [number, number],
  label: string,
  color: string
) => {
  const [x1, y1] = start2D
  const [x2, y2] = end2D

  // Draw main line
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  // Draw arrows at both ends
  drawArrow(ctx, [x2, y2], [x1, y1], color)
  drawArrow(ctx, [x1, y1], [x2, y2], color)

  // Draw label at midpoint
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  // Measure text for background box
  ctx.font = 'bold 14px Arial'
  const metrics = ctx.measureText(label)
  const textWidth = metrics.width
  const textHeight = 14  // Approximate height

  const padding = 4

  // Draw background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.fillRect(
    midX - textWidth / 2 - padding,
    midY - textHeight / 2 - padding,
    textWidth + padding * 2,
    textHeight + padding * 2
  )

  // Draw text with outline
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.strokeText(label, midX - textWidth / 2, midY + textHeight / 4)

  ctx.fillStyle = color
  ctx.fillText(label, midX - textWidth / 2, midY + textHeight / 4)
}

export const DimensionOverlay: React.FC<Props> = ({ camera, dimensions, visible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match viewport
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Animation loop - redraw on every frame
    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!visible) {
        animationFrameRef.current = requestAnimationFrame(render)
        return
      }

      // Draw each dimension
      for (const dim of dimensions) {
        const start2D = project3DTo2D(dim.start3D, camera)
        const end2D = project3DTo2D(dim.end3D, camera)

        // Only draw if both points are visible
        if (start2D && end2D) {
          drawDimensionLine(ctx, start2D, end2D, dim.label, dim.color)
        }
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [camera, dimensions, visible])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',  // Allow clicks to pass through to 3D view
        zIndex: 10
      }}
    />
  )
}