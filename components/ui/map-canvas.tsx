'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import LiliAvatar from './lili-avatar'

export interface MapNode {
  id: string
  bossId: string
  name: string
  hp: number
  timerSecs: number
  lives: number
  status: 'locked' | 'unlocked' | 'completed'
  highScore?: number
  x: number
  y: number
}

interface Props {
  nodes: MapNode[]
  playerLevel: number
  onSelect: (bossId: string) => void
}

const NODE_RADIUS = 32
const PADDING = 40

function getNodeColor(status: string, pulse: boolean): string {
  if (status === 'completed') return '#34d399'
  if (status === 'unlocked') return pulse ? '#f59e0b' : '#fbbf24'
  return '#4b5563'
}

function getNodeLabel(status: string): string {
  if (status === 'completed') return '✓'
  if (status === 'unlocked') return '⚔️'
  return '🔒'
}

export default function MapCanvas({ nodes, playerLevel, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: MapNode } | null>(null)
  const [showGuide, setShowGuide] = useState<string | null>(null)
  const animRef = useRef<number>(0)
  const pulseRef = useRef(0)

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth
      const rows = Math.ceil(nodes.length / 2)
      const h = Math.max(rows * 140 + PADDING * 2, 400)
      setDimensions({ width: w, height: h })
    }
  }, [nodes.length])

  useEffect(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [updateSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dimensions.width === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cols = 2
    const colWidth = dimensions.width / cols
    const startY = PADDING
    const rowHeight = (dimensions.height - PADDING * 2) / Math.max(Math.ceil(nodes.length / cols) - 1, 1)

    const positioned = nodes.map((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return {
        ...node,
        x: col === 0 ? colWidth * 0.35 : colWidth * 0.65,
        y: startY + row * rowHeight,
      }
    })

    const animate = () => {
      pulseRef.current = (pulseRef.current + 0.03) % (Math.PI * 2)
      draw(ctx, positioned, pulseRef.current)
      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [dimensions, nodes])

  const draw = (
    ctx: CanvasRenderingContext2D,
    positioned: MapNode[],
    pulse: number
  ) => {
    const { width, height } = dimensions
    ctx.clearRect(0, 0, width, height)

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(0.5, '#16213e')
    grad.addColorStop(1, '#0f3460')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Draw grid dots
    ctx.fillStyle = '#2d2d4455'
    for (let x = 0; x < width; x += 40) {
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw level indicators
    const cols = 2
    const colWidth = width / cols
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    for (let c = 0; c < cols; c++) {
      const cx = c === 0 ? colWidth * 0.35 : colWidth * 0.65
      ctx.fillStyle = '#4b556344'
      ctx.fillText(`Ruta ${c + 1}`, cx, height - 12)
    }

    // Draw connections
    ctx.lineWidth = 3
    for (let i = 0; i < positioned.length - 1; i++) {
      const from = positioned[i]
      const to = positioned[i + 1]
      const bothCompleted = from.status === 'completed' && to.status !== 'locked'
      ctx.strokeStyle = bothCompleted ? '#34d39966' : '#4b556344'
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      const midY = (from.y + to.y) / 2
      ctx.quadraticCurveTo(from.x + (to.x - from.x) / 2, midY, to.x, to.y)
      ctx.stroke()
    }

    // Draw nodes
    for (const node of positioned) {
      const isHovered = hoveredId === node.id
      const pulseScale = node.status === 'unlocked' ? 1 + Math.sin(pulse) * 0.08 : 0
      const radius = NODE_RADIUS + (node.status === 'unlocked' ? pulseScale * 8 : 0)

      // Glow for unlocked
      if (node.status === 'unlocked') {
        const glowRadius = NODE_RADIUS + 12 + Math.sin(pulse) * 4
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${0.15 + Math.sin(pulse) * 0.08})`
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = getNodeColor(node.status, true)
      ctx.fill()

      if (isHovered) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Node label
      ctx.font = `${node.status === 'completed' ? 18 : 14}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = node.status === 'locked' ? '#9ca3af' : '#0f0f1a'
      ctx.fillText(getNodeLabel(node.status), node.x, node.y)

      // Node name below
      ctx.font = '11px sans-serif'
      ctx.fillStyle = node.status === 'locked' ? '#4b5563' : '#f0e6d0'
      ctx.textBaseline = 'top'
      const labelY = node.y + radius + 6
      const maxWidth = 100
      const text = node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name
      ctx.fillText(text, node.x, labelY, maxWidth)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const cols = 2
    const colWidth = dimensions.width / cols
    const startY = PADDING
    const rowHeight = (dimensions.height - PADDING * 2) / Math.max(Math.ceil(nodes.length / cols) - 1, 1)

    let found: MapNode | null = null
    for (let i = 0; i < nodes.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const nx = col === 0 ? colWidth * 0.35 : colWidth * 0.65
      const ny = startY + row * rowHeight
      const dx = mx - nx
      const dy = my - ny
      if (dx * dx + dy * dy < (NODE_RADIUS + 10) ** 2) {
        found = { ...nodes[i], x: nx, y: ny }
        break
      }
    }

    setHoveredId(found?.id || null)
    if (found) {
      setTooltip({ x: found.x, y: found.y - NODE_RADIUS - 10, node: found })
    } else {
      setTooltip(null)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const cols = 2
    const colWidth = dimensions.width / cols
    const startY = PADDING
    const rowHeight = (dimensions.height - PADDING * 2) / Math.max(Math.ceil(nodes.length / cols) - 1, 1)

    for (let i = 0; i < nodes.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const nx = col === 0 ? colWidth * 0.35 : colWidth * 0.65
      const ny = startY + row * rowHeight
      const dx = mx - nx
      const dy = my - ny
      if (dx * dx + dy * dy < NODE_RADIUS ** 2) {
        const node = nodes[i]
        if (node.status === 'unlocked') {
          setShowGuide(node.bossId)
        }
        return
      }
    }
  }

  return (
    <div ref={containerRef} className="relative" style={{ minHeight: 400 }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full rounded-xl cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => { setHoveredId(null); setTooltip(null) }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#0f0f1a]/95 border border-[#2d2d44] rounded-lg px-3 py-2 text-xs z-10 whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-bold text-[#f59e0b] mb-1">{tooltip.node.name}</div>
          <div className="text-[#6b7280]">
            ❤️ {tooltip.node.lives} · 🕐 {Math.floor(tooltip.node.timerSecs / 60)}m · 💥 {tooltip.node.hp.toLocaleString()} HP
          </div>
          {tooltip.node.highScore ? (
            <div className="text-[#34d399]">Best: {tooltip.node.highScore} pts</div>
          ) : null}
        </div>
      )}

      {/* Guidebook modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowGuide(null)}>
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-3">
              <LiliAvatar expression="cool" size={64} />
            </div>
            <h2 className="text-lg font-bold text-[#f59e0b] mb-2">¡Prepárate!</h2>
            <p className="text-sm text-[#6b7280] mb-4">
              Vas a enfrentar a este jefe. Responde correctamente para hacer daño.
              Tienes vidas limitadas y un tiempo límite. ¡Suerte!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowGuide(null); onSelect(showGuide) }}
                className="bg-[#f59e0b] text-black font-bold px-6 py-2 rounded-xl hover:bg-[#d97706] transition-colors"
              >
                ¡Comenzar!
              </button>
              <button
                onClick={() => setShowGuide(null)}
                className="bg-[#2d2d44] text-[#f0e6d0] px-4 py-2 rounded-xl hover:bg-[#3d3d54] transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
