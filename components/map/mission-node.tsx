'use client'

import { memo, useRef } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface MissionNodeData extends Record<string, unknown> {
  label: string
  missionId: string
  bossId: string
  status: 'locked' | 'unlocked' | 'completed'
  hp: number
  timerSecs: number
  lives: number
  highScore?: number
  progress: number
  accentColor: string
}

const RADIUS = 38
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function MissionNode({ data, selected }: NodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const d = data as unknown as MissionNodeData
  const status = d.status
  const isLocked = status === 'locked'
  const progress = Math.min(100, Math.max(0, d.progress || 0))
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 })
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['15deg', '-15deg'])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-15deg', '15deg'])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || isLocked) return
    const rect = ref.current.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width - 0.5
    const yPct = (e.clientY - rect.top) / rect.height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  const icon = status === 'completed' ? '✓' : status === 'unlocked' ? '⚔️' : '🔒'

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center"
      style={{ perspective: '800px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />

      {!isLocked && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: status === 'unlocked'
              ? ['0 0 12px 2px rgba(245,158,11,0.3)', '0 0 20px 6px rgba(245,158,11,0.15)', '0 0 12px 2px rgba(245,158,11,0.3)']
              : ['0 0 8px 2px rgba(52,211,153,0.2)', '0 0 14px 4px rgba(52,211,153,0.1)', '0 0 8px 2px rgba(52,211,153,0.2)'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Progress ring */}
      <svg
        className="absolute -inset-[4px] w-[80px] h-[80px] -rotate-90"
        viewBox="0 0 84 84"
        style={{ zIndex: 2 }}
      >
        {/* Track */}
        <circle
          cx="42"
          cy="42"
          r={RADIUS}
          fill="none"
          stroke={isLocked ? '#374151' : '#4b5563'}
          strokeWidth="4"
        />
        {/* Progress arc */}
        {!isLocked && (
          <motion.circle
            cx="42"
            cy="42"
            r={RADIUS}
            fill="none"
            stroke={status === 'completed' ? '#34d399' : '#f59e0b'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </svg>

      <motion.div
        style={{
          rotateX: isLocked ? 0 : rotateX,
          rotateY: isLocked ? 0 : rotateY,
        }}
        className={`
          relative flex items-center justify-center w-[72px] h-[72px] rounded-full
          transition-colors duration-200 select-none
          ${isLocked ? 'bg-gray-700/60 cursor-default' : 'cursor-pointer'}
          ${!isLocked && status === 'unlocked' ? 'bg-amber-500' : ''}
          ${!isLocked && status === 'completed' ? 'bg-emerald-500' : ''}
          ${selected ? 'ring-3 ring-white ring-offset-2 ring-offset-[#0f0f1a]' : ''}
        `}
        whileTap={!isLocked && status === 'unlocked' ? { scale: 0.88 } : undefined}
        whileHover={!isLocked ? { scale: 1.05 } : undefined}
      >
        <span className={`font-bold ${status === 'completed' ? 'text-white text-2xl' : status === 'unlocked' ? 'text-black text-xl' : 'text-gray-400 text-lg'}`}>
          {icon}
        </span>
      </motion.div>
    </div>
  )
}

export default memo(MissionNode)
