'use client'

import { useRef, useEffect, useState, useCallback, useMemo, type FC } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from '@dagrejs/dagre'
import MissionNode from '@/components/map/mission-node'
import AnimatedEdge from '@/components/map/animated-edge'
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

const NODE_WIDTH = 80
const NODE_HEIGHT = 80
const ZIGZAG_OFFSET = 100

const ACCENT_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981',
  '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#eab308',
]

const nodeTypes: NodeTypes = {
  mission: MissionNode,
}

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
}

function buildLayout(nodes: MapNode[]): { layoutNodes: Node[]; layoutEdges: Edge[] } {
  if (nodes.length === 0) return { layoutNodes: [], layoutEdges: [] }

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 100, marginx: 40, marginy: 40 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  for (let i = 0; i < nodes.length - 1; i++) {
    g.setEdge(nodes[i].id, nodes[i + 1].id)
  }

  dagre.layout(g)

  const centers = nodes.map((node, i) => {
    const pos = g.node(node.id)
    return {
      cx: pos.x + (i % 2 === 1 ? ZIGZAG_OFFSET : 0),
      cy: pos.y,
    }
  })

  const xs = centers.map(c => c.cx)
  const ys = centers.map(c => c.cy)
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2

  const layoutNodes: Node[] = nodes.map((node, i) => {
    return {
      id: node.id,
      type: 'mission' as const,
      position: {
        x: centers[i].cx - midX - NODE_WIDTH / 2,
        y: centers[i].cy - midY - NODE_HEIGHT / 2,
      },
      data: {
        label: node.name,
        missionId: node.id,
        bossId: node.bossId,
        status: node.status,
        hp: node.hp,
        timerSecs: node.timerSecs,
        lives: node.lives,
        highScore: node.highScore || 0,
        accentColor: ACCENT_COLORS[i % ACCENT_COLORS.length],
      },
    }
  })

  const layoutEdges: Edge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const fromStatus = nodes[i].status
    const toStatus = nodes[i + 1].status
    const completed = fromStatus === 'completed' && toStatus !== 'locked'

    layoutEdges.push({
      id: `e-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      type: 'animated' as const,
      data: { completed },
      style: { opacity: completed ? 1 : 0.5 },
    })
  }

  return { layoutNodes, layoutEdges }
}

const FlowCanvas: FC<Props & { onTooltip: (t: any) => void; onGuide: (id: string | null) => void }> = ({
  nodes,
  onTooltip,
  onGuide,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { fitView } = useReactFlow()
  const fitted = useRef(false)
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<Node>([])
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState<Edge>([])

  const memoLayout = useMemo(() => buildLayout(nodes), [nodes])

  useEffect(() => {
    setFlowNodes(memoLayout.layoutNodes)
    setFlowEdges(memoLayout.layoutEdges)
  }, [memoLayout, setFlowNodes, setFlowEdges])

  useEffect(() => {
    if (flowNodes.length > 0 && !fitted.current) {
      fitted.current = true
      requestAnimationFrame(() => fitView({ padding: 0.25 }))
    }
  }, [flowNodes.length, fitView])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const d = node.data as Record<string, unknown>
      if (d?.status === 'unlocked') {
        onGuide(d.bossId as string)
      }
    },
    [onGuide],
  )

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const d = node.data as Record<string, unknown>
      if (!d) return
      const n: MapNode = {
        id: d.missionId as string,
        bossId: d.bossId as string,
        name: d.label as string,
        hp: d.hp as number,
        timerSecs: d.timerSecs as number,
        lives: d.lives as number,
        status: d.status as MapNode['status'],
        highScore: d.highScore as number | undefined,
        x: node.position.x,
        y: node.position.y,
      }
      onTooltip({ node: n, x: event.clientX, y: event.clientY })
    },
    [onTooltip],
  )

  const handleMouseLeave = useCallback(() => {
    onTooltip(null)
  }, [onTooltip])

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleMouseEnter}
        onNodeMouseLeave={handleMouseLeave}
        fitView={false}
        minZoom={0.2}
        maxZoom={2.5}
        className="bg-[#0a0a18] rounded-2xl"
        proOptions={{ hideAttribution: true }}
          nodesFocusable={false}
          edgesFocusable={false}
          nodesDraggable={false}
          zoomOnScroll={true}
      >
        <Background gap={32} color="#ffffff08" />
        <Controls
          className="!bg-[#1a1a2e] !border-[#2d2d44] !rounded-xl !shadow-xl"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node: Node) => {
            const d = node.data as Record<string, unknown>
            if (d?.status === 'completed') return '#34d399'
            if (d?.status === 'unlocked') return '#f59e0b'
            return '#4b5563'
          }}
          maskColor="rgba(10,10,24,0.8)"
          className="!bg-[#1a1a2e] !border-[#2d2d44] !rounded-xl !shadow-xl"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export default function MapCanvas({ nodes, playerLevel, onSelect }: Props) {
  const [tooltip, setTooltip] = useState<{ node: MapNode; x: number; y: number } | null>(null)
  const [guideId, setGuideId] = useState<string | null>(null)

  const handleGuide = useCallback((id: string | null) => setGuideId(id), [])

  if (nodes.length === 0) return null

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 120px)' }}>
      <ReactFlowProvider>
        <FlowCanvas nodes={nodes} playerLevel={playerLevel} onSelect={onSelect} onTooltip={setTooltip} onGuide={handleGuide} />
      </ReactFlowProvider>

      {tooltip && (
        <div
          className="absolute pointer-events-none bg-[#0f0f1a]/95 border border-[#2d2d44] rounded-xl px-4 py-3 text-sm z-10 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y - 16, transform: 'translate(-50%, -100%)' }}
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

      {guideId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setGuideId(null)}>
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
                onClick={() => { setGuideId(null); onSelect(guideId) }}
                className="bg-[#f59e0b] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#d97706] transition-colors text-lg"
              >
                ¡Comenzar!
              </button>
              <button
                onClick={() => setGuideId(null)}
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
