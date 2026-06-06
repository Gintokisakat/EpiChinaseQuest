'use client'

import type { EdgeProps } from '@xyflow/react'
import { getSmoothStepPath } from '@xyflow/react'

interface AnimatedEdgeData extends Record<string, unknown> {
  completed?: boolean
}

function AnimatedEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 32,
  })

  const d = data as unknown as AnimatedEdgeData | undefined
  const isCompleted = d?.completed ?? false

  return (
    <g>
      {isCompleted && (
        <path
          d={path}
          fill="none"
          stroke="#34d39922"
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}
      <path
        d={path}
        fill="none"
        stroke={isCompleted ? '#34d399' : '#ffffff22'}
        strokeWidth={isCompleted ? 3 : 2}
        strokeDasharray={isCompleted ? 'none' : '6 8'}
        strokeLinecap="round"
      />
      {isCompleted && (
        <>
          <circle r="3.5" fill="#f59e0b">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
          </circle>
          <circle r="2" fill="#fbbf24" opacity="0.7">
            <animateMotion dur="2.5s" repeatCount="indefinite" path={path} begin="0.8s" />
          </circle>
        </>
      )}
    </g>
  )
}

export default AnimatedEdge
