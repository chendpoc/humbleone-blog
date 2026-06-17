'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { PrototypeVariant } from './TodayPrototype'

const variants: PrototypeVariant[] = ['A', 'B', 'C']

function nextVariant(current: PrototypeVariant, direction: -1 | 1) {
  const index = variants.indexOf(current)
  const nextIndex = (index + direction + variants.length) % variants.length

  return variants[nextIndex]
}

export function PrototypeSwitcher({ variant }: { variant: PrototypeVariant }) {
  const router = useRouter()
  const isProduction = process.env.NODE_ENV === 'production'

  function setVariant(next: PrototypeVariant) {
    const url = new URL(window.location.href)
    const params = url.searchParams
    params.set('variant', next)
    router.replace(`${url.pathname}?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (isProduction) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName

      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setVariant(nextVariant(variant, -1))
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setVariant(nextVariant(variant, 1))
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isProduction, router, variant])

  if (isProduction) {
    return null
  }

  return (
    <div className="prototype-switcher" aria-label="Prototype variant switcher">
      <button
        type="button"
        className="switcher-arrow"
        aria-label="Previous prototype variant"
        onClick={() => setVariant(nextVariant(variant, -1))}
      >
        ‹
      </button>
      <div className="switcher-tabs" role="tablist" aria-label="Prototype variants">
        {variants.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={variant === item}
            className="switcher-tab"
            onClick={() => setVariant(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="switcher-arrow"
        aria-label="Next prototype variant"
        onClick={() => setVariant(nextVariant(variant, 1))}
      >
        ›
      </button>
    </div>
  )
}
