type LiliExpression =
  | 'uwu'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'confused'
  | 'shock'
  | 'sleep'
  | 'cool'
  | 'heart'
  | 'think'
  | 'crysmile'
  | 'mlem'
  | 'blanket'
  | 'aww'
  | 'cute'
  | 'loaf'
  | 'pleading'
  | 'sweats'
  | 'smirk'
  | 'headphones'

interface Props {
  expression?: LiliExpression
  size?: number
  className?: string
}

const files: Record<LiliExpression, string> = {
  uwu: '/dragns/dragnuwu.svg',
  happy: '/dragns/dragnhappy.svg',
  sad: '/dragns/dragnsad.svg',
  angry: '/dragns/dragnangry.svg',
  confused: '/dragns/dragnconfused.svg',
  shock: '/dragns/dragnshock.svg',
  sleep: '/dragns/dragnsleep.svg',
  cool: '/dragns/dragncool.svg',
  heart: '/dragns/dragnheart.svg',
  think: '/dragns/dragnthink.svg',
  crysmile: '/dragns/dragncrysmile.svg',
  mlem: '/dragns/dragnmlem.svg',
  blanket: '/dragns/dragnblanket.svg',
  aww: '/dragns/dragnaww.svg',
  cute: '/dragns/dragncute.svg',
  loaf: '/dragns/dragnloaf.svg',
  pleading: '/dragns/dragnpleading.svg',
  sweats: '/dragns/dragnsweats.svg',
  smirk: '/dragns/dragnsmirk.svg',
  headphones: '/dragns/dragnheadphones.svg',
}

export default function LiliAvatar({ expression = 'uwu', size = 48, className = '' }: Props) {
  return (
    <img
      src={files[expression]}
      alt={`Lili ${expression}`}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  )
}

export type { LiliExpression }
export { files as liliFiles }
