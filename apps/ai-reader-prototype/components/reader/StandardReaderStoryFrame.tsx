import type { ReactNode } from 'react'

type StandardReaderStoryFrameProps = {
  children: ReactNode
  align?: 'full' | 'right'
  height?: number | string
  width?: number | string
}

export function StandardReaderStoryFrame({
  children,
  align = 'full',
  height = '100vh',
  width = '100%',
}: StandardReaderStoryFrameProps) {
  return (
    <main className="standard-reader" data-theme="standard">
      <div
        style={{
          width,
          height,
          marginLeft: align === 'right' ? 'auto' : undefined,
        }}
      >
        {children}
      </div>
    </main>
  )
}
