import { type HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function GlassCard({ children, className = '', ...props }: Props) {
  return (
    <div
      className={`glass-card rounded-[16px] ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
