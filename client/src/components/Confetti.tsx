import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: 'rect' | 'circle' | 'star'
  life: number
}

const COLORS = ['#8b5cf6', '#22c55e', '#facc15', '#f97316', '#22d3ee', '#ec4899', '#a78bfa', '#4ade80']

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a) }

function createParticles(x: number, y: number, count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x,
    y,
    vx: randomBetween(-6, 6),
    vy: randomBetween(-12, -4),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: randomBetween(6, 14),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.2, 0.2),
    opacity: 1,
    shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
    life: 1,
  }))
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const spikes = 5
  const outerR = size
  const innerR = size * 0.4
  let rot = (Math.PI / 2) * 3

  ctx.beginPath()
  ctx.moveTo(x, y - outerR)
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(x + Math.cos(rot) * outerR, y + Math.sin(rot) * outerR)
    rot += Math.PI / spikes
    ctx.lineTo(x + Math.cos(rot) * innerR, y + Math.sin(rot) * innerR)
    rot += Math.PI / spikes
  }
  ctx.lineTo(x, y - outerR)
  ctx.closePath()
  ctx.fill()
}

interface Props {
  trigger: boolean
  originX?: number
  originY?: number
  count?: number
  onDone?: () => void
}

export default function Confetti({ trigger, originX, originY, count = 80, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | undefined>(undefined)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!trigger) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    doneRef.current = false
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const ox = originX ?? window.innerWidth / 2
    const oy = originY ?? window.innerHeight * 0.3

    // Burst from center + two side bursts
    particlesRef.current = [
      ...createParticles(ox, oy, Math.floor(count * 0.5)),
      ...createParticles(ox - 100, oy + 50, Math.floor(count * 0.25)),
      ...createParticles(ox + 100, oy + 50, Math.floor(count * 0.25)),
    ]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = false
      particlesRef.current.forEach(p => {
        if (p.opacity <= 0) return
        alive = true
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.35 // gravity
        p.vx *= 0.99 // air resistance
        p.rotation += p.rotationSpeed
        p.life -= 0.012
        p.opacity = Math.max(0, p.life)

        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, p.size / 2)
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      })

      if (alive) {
        rafRef.current = requestAnimationFrame(animate)
      } else if (!doneRef.current) {
        doneRef.current = true
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onDone?.()
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
