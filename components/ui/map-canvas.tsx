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

const PADDING = 60
const ROW_HEIGHT = 150

function getNodeColor(status: string): string {
  if (status === 'completed') return '#34d399'
  if (status === 'unlocked') return '#f59e0b'
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

  const isDesktop = dimensions.width >= 768

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth
      const desktop = w >= 768
      const cols = desktop ? 3 : 2
      const rows = Math.ceil(nodes.length / cols)
      const h = Math.max(rows * ROW_HEIGHT + PADDING * 2, 500)
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

    const cols = isDesktop ? 3 : 2
    const usableW = dimensions.width - PADDING * 2
    const colSpacing = usableW / (cols - 1 || 1)
    const startY = PADDING

    const positioned = nodes.map((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = PADDING + col * colSpacing
      const y = startY + row * ROW_HEIGHT
      return { ...node, x, y }
    })

    const animate = () => {
      pulseRef.current = (pulseRef.current + 0.025) % (Math.PI * 2)
      draw(ctx, positioned)
      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [dimensions, nodes, isDesktop])

  const draw = (ctx: CanvasRenderingContext2D, positioned: MapNode[]) => {
    const { width, height } = dimensions
    ctx.clearRect(0, 0, width, height)

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#0f0f1a')
    grad.addColorStop(0.3, '#1a1a2e')
    grad.addColorStop(0.6, '#16213e')
    grad.addColorStop(1, '#0f0f1a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Stars
    ctx.fillStyle = '#ffffff22'
    const seed = 42
    for (let i = 0; i < 80; i++) {
      const sx = ((seed * (i + 1) * 137) % width)
      const sy = ((seed * (i + 1) * 251) % height)
      const sr = ((seed * (i + 1) * 7) % 3) + 0.5
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }

    // Level label
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#4b556344'
    ctx.fillText(`Jugador Nv.${playerLevel}`, width / 2, height - 14)

    // Connections between consecutive nodes
    ctx.lineWidth = 2.5
    for (let i = 0; i < positioned.length - 1; i++) {
      const from = positioned[i]
      const to = positioned[i + 1]
      const completed = from.status === 'completed' && to.status !== 'locked'
      ctx.strokeStyle = completed ? '#34d39944' : '#ffffff11'
      ctx.setLineDash(completed ? [] : [6, 6])
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      const cpX = (from.x + to.x) / 2
      const cpY = (from.y + to.y) / 2
      ctx.quadraticCurveTo(cpX, from.y + (to.y - from.y) * 0.3, to.x, to.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Glow line for completed path
    ctx.lineWidth = 4
    for (let i = 0; i < positioned.length - 1; i++) {
      const from = positioned[i]
      const to = positioned[i + 1]
      if (from.status !== 'completed') break
      ctx.strokeStyle = '#34d39922'
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      const cpX = (from.x + to.x) / 2
      const cpY = (from.y + to.y) / 2
      ctx.quadraticCurveTo(cpX, from.y + (to.y - from.y) * 0.3, to.x, to.y)
      ctx.stroke()
    }

    // Draw nodes
    const pulse = pulseRef.current
    const radius = isDesktop ? 38 : 30

    for (const node of positioned) {
      const isHovered = hoveredId === node.id

      // Glow for unlocked
      if (node.status === 'unlocked') {
        const glowR = radius + 14 + Math.sin(pulse) * 5
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245, 158, 11, ${0.12 + Math.sin(pulse) * 0.06})`
        ctx.fill()
      }

      // Completed ring
      if (node.status === 'completed') {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2)
        ctx.strokeStyle = '#34d39944'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Node circle
      const r = radius + (node.status === 'unlocked' ? Math.sin(pulse) * 3 : 0)
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
      ctx.fillStyle = getNodeColor(node.status)
      ctx.fill()

      // Border
      if (isHovered) {
        ctx.strokeStyle = '#ffffff88'
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else if (node.status === 'unlocked') {
        ctx.strokeStyle = '#fbbf2444'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Label
      ctx.font = `${node.status === 'completed' ? 20 : node.status === 'unlocked' ? 16 : 14}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = node.status === 'locked' ? '#9ca3af' : '#0f0f1a'
      ctx.fillText(getNodeLabel(node.status), node.x, node.y)

      // Name below
      ctx.font = isDesktop ? '13px sans-serif' : '11px sans-serif'
      ctx.fillStyle = node.status === 'locked' ? '#4b5563' : '#f0e6d0'
      ctx.textBaseline = 'top'
      const lY = node.y + r + 6
      const maxW = 120
      const text = node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name
      ctx.fillText(text, node.x, lY, maxW)
    }
  }

  const getNodeAt = (mx: number, my: number) => {
    const cols = isDesktop ? 3 : 2
    const usableW = dimensions.width - PADDING * 2
    const colSpacing = usableW / (cols - 1 || 1)
    const startY = PADDING
    const radius = isDesktop ? 38 : 30

    for (let i = 0; i < nodes.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const nx = PADDING + col * colSpacing
      const ny = startY + row * ROW_HEIGHT
      const dx = mx - nx
      const dy = my - ny
      if (dx * dx + dy * dy < (radius + 8) ** 2) {
        return { node: { ...nodes[i], x: nx, y: ny }, nx, ny }
      }
    }
    return null
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const hit = getNodeAt(mx, my)
    setHoveredId(hit?.node.id || null)
    setTooltip(hit ? { x: hit.nx, y: hit.ny - 10, node: hit.node } : null)
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const hit = getNodeAt(mx, my)
    if (hit && hit.node.status === 'unlocked') {
      setShowGuide(hit.node.bossId)
    }
  }

  return (
    <div ref={containerRef} className="relative" style={{ minHeight: 500 }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full rounded-2xl cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={() => { setHoveredId(null); setTooltip(null) }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#0f0f1a]/95 border border-[#2d2d44] rounded-xl px-4 py-3 text-sm z-10 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-bold text-[#f59e0b] text-base mb-1">{tooltip.node.name}</div>
          {tooltip.node.status === 'locked' ? (
            <div className="text-[#6b7280]">🔒 Bloqueado</div>
          ) : (
            <>
              <div className="flex gap-4 text-[#6b7280] mb-1">
                <span>💥 {tooltip.node.hp.toLocaleString()} HP</span>
                <span>❤️ {tooltip.node.lives}</span>
                <span>🕐 {Math.floor(tooltip.node.timerSecs / 60)}m</span>
              </div>
              {tooltip.node.highScore ? (
                <div className="text-[#34d399]">🏆 Best: {tooltip.node.highScore.toLocaleString()} pts</div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Guidebook modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowGuide(null)}>
          <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <LiliAvatar expression="cool" size={80} />
            </div>
            <h2 className="text-xl font-bold text-[#f59e0b] mb-2">¡Prepárate!</h2>
            <p className="text-sm text-[#6b7280] mb-6">
              Vas a enfrentar a este jefe. Responde correctamente para hacer daño.
              Tienes vidas limitadas y un tiempo límite. ¡Suerte!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowGuide(null); onSelect(showGuide) }}
                className="bg-[#f59e0b] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#d97706] transition-colors text-lg"
              >
                ¡Comenzar!
              </button>
              <button
                onClick={() => setShowGuide(null)}
                className="bg-[#2d2d44] text-[#f0e6d0] px-6 py-3 rounded-xl hover:bg-[#3d3d54] transition-colors"
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
