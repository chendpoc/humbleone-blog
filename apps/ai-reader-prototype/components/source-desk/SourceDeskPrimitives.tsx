import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import * as Tooltip from '@radix-ui/react-tooltip'

import { css, keyframes, styled } from '../../stitches.config'
import type { ClippingItem, PinnedNote, SourceDeskItem, SourceHealth } from '../../lib/prototype-data'

type Tone = 'red' | 'blue' | 'green' | 'copper'

const inkPulse = keyframes({
  '0%, 100%': {
    opacity: 1,
    boxShadow: '0 0 0 3px rgba(255, 123, 61, 0.14)',
  },
  '50%': {
    opacity: 0.68,
    boxShadow: '0 0 0 7px rgba(255, 123, 61, 0.08)',
  },
})

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

const deskTexture = 'url("/textures/desk-walnut.svg")'
const paperAgedTexture = 'url("/textures/paper-aged.svg")'
const paperWarmTexture = 'url("/textures/paper-warm.svg")'
const tapeTexture = 'url("/textures/tape-fiber.svg")'

const deskGrainLayers = [
  deskTexture,
  'radial-gradient(circle at 18% 12%, rgba(255, 178, 135, 0.08), transparent 10rem)',
  'linear-gradient(145deg, rgba(255, 242, 208, 0.05), transparent 28%)',
  'repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 7px)',
].join(', ')

function paperSurface(overlay: string, texture = paperAgedTexture) {
  return `${overlay}, ${texture}`
}

function tapeSurface(overlay = 'linear-gradient(90deg, rgba(255, 255, 255, 0.24), transparent)') {
  return `${overlay}, ${tapeTexture}`
}

export const SourceDeskShell = styled('aside', {
  position: 'relative',
  width: '$desk',
  minWidth: 0,
  overflow: 'hidden',
  paddingBottom: '$4',
  color: '$deskInk',
  background: `${deskGrainLayers}, $deskPanel`,
  backgroundSize: '384px 384px, auto, auto, 7px 7px, auto',
  backgroundBlendMode: 'normal, screen, soft-light, normal, normal',
  border: '1px solid $deskLine',
  borderRadius: '$paper',
  boxShadow: '$deskPanel',

  '&::after': {
    content: '',
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage:
      'radial-gradient(circle at 20% 25%, rgba(255, 235, 200, 0.06) 0 1px, transparent 1px), radial-gradient(circle at 62% 68%, rgba(0, 0, 0, 0.16) 0 1px, transparent 1px)',
    backgroundSize: '18px 18px, 23px 23px',
    mixBlendMode: 'screen',
    opacity: 0.58,
  },

  '@compact': {
    width: '100%',
  },

  variants: {
    density: {
      regular: {},
      compact: {
        width: '100%',
      },
    },
  },
  defaultVariants: {
    density: 'regular',
  },
})

const DeskHeaderRoot = styled('header', {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  gap: '$4',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '$5 $5 $3',
  borderBottom: '1px solid $deskLine',
})

const DeskLabel = styled('p', {
  margin: '0 0 $2',
  color: '$copper',
  fontFamily: '$mono',
  fontSize: '$sm',
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'uppercase',
})

const DeskTitle = styled('h2', {
  margin: 0,
  color: '#fff1d4',
  fontFamily: '$serif',
  fontSize: '$xl',
  lineHeight: 1.05,

  variants: {
    scale: {
      masthead: {},
      console: {
        color: '$deskInk',
        fontFamily: '$mono',
        fontSize: '$sm',
        fontWeight: 400,
        lineHeight: 1.25,
      },
    },
  },
  defaultVariants: {
    scale: 'masthead',
  },
})

export function SourceDeskHeader({
  label,
  title,
  action,
  scale = 'masthead',
}: {
  label: string
  title: string
  action?: ReactNode
  scale?: 'masthead' | 'console'
}) {
  return (
    <DeskHeaderRoot>
      <div>
        <DeskLabel>{label}</DeskLabel>
        <DeskTitle scale={scale}>{title}</DeskTitle>
      </div>
      {action}
    </DeskHeaderRoot>
  )
}

const HeaderToolsRoot = styled('div', {
  display: 'flex',
  gap: '$2',
  alignItems: 'center',
  paddingTop: 2,
})

const HeaderToolButton = styled('button', {
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
  width: 23,
  height: 23,
  color: '$deskInk',
  background: 'rgba(255, 238, 181, 0.04)',
  border: '1px solid rgba(207, 169, 126, 0.16)',
  borderRadius: '$sharp',
  boxShadow: 'inset 0 1px 0 rgba(255, 240, 213, 0.08)',
  fontFamily: '$mono',
  fontSize: '$xs',
  lineHeight: 1,
  transform: 'rotate(-2deg)',
  transition: 'background 160ms ease, border-color 160ms ease, transform 160ms ease',

  '&:nth-child(2)': {
    transform: 'rotate(2deg)',
  },

  '&:hover': {
    background: 'rgba(255, 178, 135, 0.1)',
    borderColor: 'rgba(255, 178, 135, 0.36)',
    transform: 'translateY(-1px) rotate(0deg)',
  },

  '&::before': {
    content: '',
    position: 'absolute',
    top: '50%',
    left: '50%',
    color: 'currentColor',
    transform: 'translate(-50%, -50%)',
  },

  '&::after': {
    content: '',
    position: 'absolute',
    inset: 4,
    border: '1px solid currentColor',
    opacity: 0.14,
  },

  '&[data-tool="pin"]::before': {
    width: 3,
    height: 13,
    background: 'currentColor',
    borderRadius: '$round',
    boxShadow: '0 -4px 0 2px rgba(240, 216, 196, 0.14)',
    transform: 'translate(-50%, -50%) rotate(34deg)',
  },

  '&[data-tool="signal"]::before': {
    content: '*',
    fontSize: '$sm',
    transform: 'translate(-50%, -54%) rotate(-9deg)',
  },
})

export function DeskHeaderTools() {
  return (
    <HeaderToolsRoot aria-label="Desk tools">
      <HeaderToolButton type="button" title="Pin source desk" aria-label="Pin source desk" data-tool="pin" />
      <HeaderToolButton type="button" title="Mark high signal" aria-label="Mark high signal" data-tool="signal" />
    </HeaderToolsRoot>
  )
}

const SectionRoot = styled('section', {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gap: '$2',
  padding: '$4 $5 $1',

  variants: {
    kind: {
      folders: {
        gap: '$1',
      },
      notes: {
        gap: 0,
        paddingTop: '$3',
      },
      clippings: {
        gap: 0,
        paddingTop: '$4',
      },
    },
  },
})

const SectionHeader = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 18,
})

const SectionLabel = styled('p', {
  margin: '0 0 $1',
  color: '$copper',
  fontFamily: '$mono',
  fontSize: '$sm',
  letterSpacing: 0,
  textTransform: 'uppercase',

  variants: {
    tab: {
      true: {
        justifySelf: 'start',
        padding: '7px $4 6px',
        color: '#2f2017',
        background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.24), transparent 54%), $paperWarm',
        border: '1px solid rgba(74, 45, 32, 0.22)',
        boxShadow: '0 5px 14px rgba(0, 0, 0, 0.22)',
        clipPath: 'polygon(2% 9%, 100% 0, 97% 91%, 0 100%)',
        transform: 'rotate(-1.2deg)',
      },
    },
  },
})

const SectionAction = styled('span', {
  color: '$deskMuted',
  fontFamily: '$mono',
  fontSize: '$xs',
})

export function SourceDeskSection({
  label,
  tab,
  kind,
  action,
  children,
}: {
  label?: string
  tab?: boolean
  kind?: 'folders' | 'notes' | 'clippings'
  action?: string
  children: ReactNode
}) {
  return (
    <SectionRoot kind={kind}>
      {label ? (
        <SectionHeader>
          <SectionLabel tab={tab}>{label}</SectionLabel>
          {action ? <SectionAction>{action}</SectionAction> : null}
        </SectionHeader>
      ) : null}
      {children}
    </SectionRoot>
  )
}

const freshnessBase = {
  position: 'absolute',
  width: 8,
  height: 8,
  background: '$signal',
  borderRadius: '$round',
  boxShadow: '0 0 0 3px rgba(255, 123, 61, 0.14)',
} as const

const FreshnessDot = styled('span', {
  ...freshnessBase,

  variants: {
    health: {
      fresh: {},
      quiet: {
        background: '$deskMuted',
        boxShadow: '0 0 0 3px rgba(158, 127, 112, 0.12)',
      },
      stale: {
        background: '$paperDark',
        boxShadow: 'none',
        opacity: 0.75,
      },
      failed: {
        width: 12,
        height: 2,
        background: '$stampRed',
        borderRadius: 0,
        boxShadow: 'none',
        transform: 'rotate(-18deg)',
      },
    },
    state: {
      default: {},
      hover: {},
      selected: {
        boxShadow: '0 0 0 3px rgba(255, 123, 61, 0.18), 0 0 0 7px rgba(255, 123, 61, 0.08)',
      },
      new: {
        animation: `${inkPulse} 1600ms ease-in-out infinite`,
      },
      stale: {},
      failed: {},
      dragging: {},
      'drop-target': {
        opacity: 0,
      },
    },
    placement: {
      slip: {
        top: 8,
        right: 10,
      },
      clipping: {
        top: 14,
        left: 9,
        width: 6,
        height: 6,
        background: '$blueprint',
      },
      demo: {
        top: '50%',
        left: '50%',
        right: 'auto',
        transform: 'translate(-50%, -50%)',
      },
    },
  },
  defaultVariants: {
    health: 'fresh',
    state: 'default',
  },
})

export function FreshnessGlyph({
  health,
  state = 'default',
  placement,
  label,
}: {
  health: SourceHealth
  state?: SourceDeskItem['state']
  placement?: 'slip' | 'clipping' | 'demo'
  label?: string
}) {
  return (
    <FreshnessDot
      health={health}
      state={state}
      placement={placement}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  )
}

const StampRoot = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 64,
  minHeight: 34,
  color: '$stampRed',
  border: '2px solid currentColor',
  borderRadius: '$sharp',
  fontFamily: '$mono',
  fontSize: '$sm',
  fontWeight: 700,
  lineHeight: 1,
  textTransform: 'uppercase',
  transform: 'rotate(-5deg)',
  filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.12))',

  '&::before': {
    content: '',
    position: 'absolute',
    inset: 2,
    border: '1px solid currentColor',
    opacity: 0.18,
  },

  variants: {
    tone: {
      red: {
        color: '$stampRed',
      },
      blue: {
        color: '$blueprint',
      },
      green: {
        color: '$archiveGreen',
      },
      copper: {
        color: '$copper',
      },
    },
  },
  defaultVariants: {
    tone: 'red',
  },
})

export function StampBadge({ children, tone = 'red' }: { children: ReactNode; tone?: Tone }) {
  return <StampRoot tone={tone}>{children}</StampRoot>
}

const SlipRoot = styled('article', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '24px minmax(0, 1fr)',
  gap: '$2',
  minHeight: '$slipHeight',
  padding: '12px 36px 11px 12px',
  color: '$ink',
  background: paperSurface(
    'linear-gradient(90deg, rgba(99, 62, 37, 0.1), transparent 9px), linear-gradient(100deg, rgba(255, 255, 255, 0.22), transparent 48%)',
  ),
  backgroundSize: 'auto, auto, 320px 320px',
  border: '1px solid rgba(78, 49, 31, 0.24)',
  borderRadius: '2px 7px 4px 2px',
  boxShadow: '$slip',
  transition: 'filter 180ms ease, transform 180ms ease, box-shadow 180ms ease',

  '&::before': {
    content: '',
    position: 'absolute',
    inset: '0 auto 0 0',
    width: 4,
    background: 'rgba(255, 178, 135, 0.2)',
    opacity: 0,
  },

  '&::after': {
    content: '',
    position: 'absolute',
    right: 8,
    bottom: 6,
    width: 34,
    height: 1,
    background: 'rgba(73, 45, 28, 0.22)',
    transform: 'rotate(-1deg)',
  },

  '&:hover': {
    transform: 'translateY(-3px) translateX(2px) rotate(-0.1deg)',
    boxShadow: '$slipHover',
  },

  variants: {
    tilt: {
      left: {
        transform: 'rotate(-0.8deg)',
      },
      flat: {
        transform: 'rotate(0.1deg)',
      },
      right: {
        transform: 'rotate(0.7deg)',
      },
    },
    state: {
      default: {},
      hover: {
        transform: 'translateY(-3px) translateX(2px) rotate(-0.1deg)',
        boxShadow: '$slipHover',
      },
      selected: {
        transform: 'rotate(0.12deg) translateX(9px)',

        '&::before': {
          opacity: 1,
          background: '$copper',
        },
      },
      new: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(255, 123, 61, 0.16), transparent 10px), linear-gradient(100deg, rgba(255, 255, 255, 0.24), transparent 48%)',
          paperWarmTexture,
        ),
        backgroundBlendMode: 'multiply, screen, normal',
      },
      stale: {},
      failed: {
        background: paperSurface(
          'repeating-linear-gradient(-8deg, transparent 0 10px, rgba(120, 47, 32, 0.09) 10px 11px), linear-gradient(0deg, rgba(112, 80, 61, 0.16), rgba(112, 80, 61, 0.16))',
        ),
        backgroundBlendMode: 'multiply, multiply, normal',
      },
      dragging: {
        zIndex: 3,
        transform: 'translateY(-8px) translateX(8px) rotate(0deg)',
        boxShadow: '$paperFloat',
        filter: 'saturate(1.05)',
      },
      'drop-target': {
        color: '$deskMuted',
        background:
          'radial-gradient(circle at 16% 48%, rgba(207, 169, 126, 0.14) 0 1px, transparent 1.4px), rgba(11, 7, 4, 0.2)',
        backgroundSize: '16px 16px, auto',
        border: '1px dashed rgba(207, 169, 126, 0.42)',
        boxShadow: '$dropSlot',
        transform: 'rotate(0.4deg)',

        '& h3, & strong, & p, & footer': {
          opacity: 0.32,
        },

        '&::before': {
          opacity: 0,
        },

        '&::after': {
          right: 12,
          left: 12,
          width: 'auto',
          background: 'repeating-linear-gradient(90deg, $pencil 0 6px, transparent 6px 11px)',
        },
      },
    },
    health: {
      fresh: {},
      quiet: {},
      stale: {
        filter: 'saturate(0.65) contrast(0.9)',
        opacity: 0.82,
      },
      failed: {
        filter: 'saturate(0.72)',
      },
    },
    density: {
      regular: {},
      compact: {
        minHeight: 40,
        padding: '10px 30px 10px 10px',
      },
    },
    mode: {
      source: {},
      folder: {
        gridTemplateColumns: '22px minmax(0, 1fr)',
        gap: '$2',
        minHeight: 36,
        padding: '8px 36px 7px 11px',
        background: paperSurface(
          'linear-gradient(90deg, rgba(99, 62, 37, 0.12), transparent 8px), linear-gradient(96deg, rgba(255, 255, 255, 0.18), transparent 44%)',
        ),
        borderColor: 'rgba(78, 49, 31, 0.34)',
        borderRadius: '2px 4px 3px 2px',
        boxShadow:
          'inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 1px 0 rgba(90, 57, 34, 0.24), 0 8px 14px rgba(0, 0, 0, 0.3)',

        '& h3': {
          fontSize: '$sm',
          lineHeight: 1.15,
        },

        '& strong': {
          fontSize: '$md',
        },

        '&::after': {
          width: 24,
          bottom: 5,
          opacity: 0.68,
        },
      },
    },
  },
  defaultVariants: {
    tilt: 'flat',
    state: 'default',
    health: 'fresh',
    density: 'regular',
    mode: 'source',
  },
  compoundVariants: [
    {
      mode: 'folder',
      state: 'new',
      css: {
        color: '#7f3a22',
        background:
          paperSurface(
            'linear-gradient(90deg, rgba(255, 123, 61, 0.22), transparent 10px), linear-gradient(96deg, rgba(255, 255, 255, 0.18), transparent 44%)',
            paperWarmTexture,
          ),
        backgroundBlendMode: 'multiply, screen, normal',
        borderColor: 'rgba(166, 71, 40, 0.48)',
        transform: 'translateX(6px) rotate(0.2deg)',
      },
    },
    {
      mode: 'folder',
      state: 'stale',
      css: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(48, 40, 32, 0.16), transparent 8px), linear-gradient(0deg, rgba(88, 80, 69, 0.28), rgba(88, 80, 69, 0.28))',
        ),
      },
    },
  ],
})

const SlipIcon = styled('span', {
  display: 'inline-grid',
  placeItems: 'center',
  position: 'relative',
  width: 16,
  height: 16,
  marginTop: 1,
  border: '1px solid rgba(73, 45, 28, 0.62)',
  borderRadius: '$sharp',

  '&::before': {
    content: '',
    position: 'absolute',
    inset: '3px 3px auto',
    height: 1,
    background: 'currentColor',
    boxShadow: '0 4px 0 currentColor',
    opacity: 0.58,
  },

  '&[data-symbol="true"]': {
    color: '$stampRed',
    border: 0,
    fontSize: 14,
    lineHeight: 1,
    transform: 'translateY(-1px) rotate(-7deg)',

    '&::before': {
      display: 'none',
    },
  },
})

const SlipCopy = styled('div', {
  minWidth: 0,
})

const SlipTitleRow = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '$3',
  alignItems: 'start',

  h3: {
    margin: 0,
    fontFamily: '$mono',
    fontSize: '$md',
    fontWeight: 700,
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },

  strong: {
    color: '#7f3a22',
    fontFamily: '$mono',
    fontSize: '$md',
    lineHeight: 1.1,
  },
})

const SlipDescription = styled('p', {
  margin: '$1 0 0',
  color: '$inkSoft',
  fontFamily: '$serif',
  fontSize: '$md',
  lineHeight: 1.35,
})

const SlipFooter = styled('footer', {
  gridColumn: 2,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '$1',
  marginTop: 1,

  span: {
    display: 'inline-flex',
    padding: '4px 7px',
    color: '#4d3326',
    background: 'rgba(109, 77, 44, 0.08)',
    border: '1px solid rgba(78, 48, 31, 0.13)',
    fontFamily: '$mono',
    fontSize: '$xs',
    lineHeight: 1,
    textTransform: 'uppercase',
  },
})

function tiltFromIndex(index: number): 'left' | 'flat' | 'right' {
  return (['left', 'flat', 'right'] as const)[index % 3]
}

function folderSymbol(source: SourceDeskItem) {
  if (source.state === 'new') {
    return '★'
  }

  if (source.health === 'stale') {
    return '▣'
  }

  return null
}

export function SourceSlip({
  source,
  index = 0,
  density = 'regular',
  mode = source.kind === 'source_group' ? 'folder' : 'source',
}: {
  source: SourceDeskItem
  index?: number
  density?: 'regular' | 'compact'
  mode?: 'folder' | 'source'
}) {
  const symbol = mode === 'folder' ? folderSymbol(source) : null

  return (
    <SlipRoot state={source.state} health={source.health} tilt={tiltFromIndex(index)} density={density} mode={mode}>
      <FreshnessGlyph
        health={source.health}
        state={source.state}
        placement="slip"
        label={`${source.label} is ${source.health}`}
      />
      <SlipIcon aria-hidden="true" data-symbol={symbol ? 'true' : undefined}>
        {symbol}
      </SlipIcon>
      <SlipCopy>
        <SlipTitleRow>
          <h3>{source.label}</h3>
          {source.count ? <strong>{source.count}</strong> : null}
        </SlipTitleRow>
        {mode === 'source' ? (
          <SlipDescription>{source.description ?? source.sourceFamily ?? 'High-signal AI engineering source'}</SlipDescription>
        ) : null}
      </SlipCopy>
      {mode === 'source' ? (
        <SlipFooter>
          <span>{source.evidenceLevel ?? 'manual'}</span>
          <span>{source.health}</span>
        </SlipFooter>
      ) : null}
    </SlipRoot>
  )
}

const NoteRoot = styled('section', {
  position: 'relative',
  zIndex: 1,
  minHeight: '$noteMin',
  margin: '4px $5 8px 32px',
  padding: '14px $4 $3 $5',
  color: '$ink',
  background: paperSurface(
    'linear-gradient(90deg, rgba(92, 56, 34, 0.12), transparent 12px), linear-gradient(0deg, rgba(241, 217, 150, 0.2), rgba(241, 217, 150, 0.2))',
    paperWarmTexture,
  ),
  backgroundSize: 'auto, auto, 320px 320px',
  backgroundBlendMode: 'multiply, overlay, normal',
  border: '1px solid rgba(84, 52, 30, 0.2)',
  borderRadius: '5px 4px 7px 5px',
  boxShadow: '$note',
  transform: 'rotate(0.6deg)',

  '&::before': {
    content: '',
    position: 'absolute',
    top: 7,
    bottom: 7,
    left: -15,
    width: 24,
    background: 'rgba(213, 185, 134, 0.62)',
    border: '1px solid rgba(84, 52, 30, 0.14)',
    borderRight: 0,
    borderRadius: '5px 0 0 5px',
    boxShadow: '-4px 7px 13px rgba(0, 0, 0, 0.18)',
  },

  '&:nth-child(2)': {
    marginTop: -1,
    transform: 'rotate(-0.7deg)',
  },

  '&:nth-child(3)': {
    marginTop: -1,
    transform: 'rotate(0.9deg)',
  },

  variants: {
    color: {
      ivory: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(92, 56, 34, 0.11), transparent 12px), linear-gradient(0deg, rgba(255, 250, 231, 0.22), rgba(255, 250, 231, 0.22))',
        ),
      },
      amber: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(92, 56, 34, 0.12), transparent 12px), linear-gradient(0deg, rgba(241, 217, 150, 0.2), rgba(241, 217, 150, 0.2))',
          paperWarmTexture,
        ),
      },
      rose: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(92, 56, 34, 0.11), transparent 12px), linear-gradient(0deg, rgba(189, 111, 88, 0.18), rgba(189, 111, 88, 0.18))',
        ),
      },
      blue: {
        background: paperSurface(
          'linear-gradient(90deg, rgba(92, 56, 34, 0.11), transparent 12px), linear-gradient(0deg, rgba(111, 151, 163, 0.2), rgba(111, 151, 163, 0.2))',
        ),
      },
    },
  },
})

const TapeStrip = styled('span', {
  position: 'absolute',
  top: -7,
  left: '47%',
  width: 58,
  height: 13,
  background: tapeSurface('linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent)'),
  backgroundSize: 'auto, 256px 96px',
  backgroundBlendMode: 'screen, normal',
  boxShadow: '0 1px 0 rgba(85, 49, 22, 0.12)',
  clipPath: 'polygon(0 12%, 9% 0, 95% 7%, 100% 88%, 88% 100%, 3% 91%)',
  transform: 'translateX(-50%) rotate(-2deg)',
})

const NoteClip = styled('span', {
  position: 'absolute',
  top: 16,
  left: -24,
  width: 12,
  height: 12,
  background: 'radial-gradient(circle, rgba(29, 23, 18, 0.42) 0 2px, rgba(255, 255, 255, 0.16) 2px 4px, rgba(29, 23, 18, 0.3) 4px)',
  borderRadius: '$round',
  boxShadow: '0 7px 10px rgba(0, 0, 0, 0.26)',
  transform: 'rotate(-7deg)',
})

const NoteSourceMark = styled('span', {
  position: 'absolute',
  top: 24,
  left: -5,
  zIndex: 1,
  display: 'grid',
  placeItems: 'center',
  width: 19,
  height: 19,
  color: '#2f2116',
  background: 'rgba(239, 211, 154, 0.82)',
  border: '1px solid rgba(84, 52, 30, 0.22)',
  borderRadius: '$sharp',
  boxShadow: '0 5px 9px rgba(0, 0, 0, 0.18)',
  fontFamily: '$mono',
  fontSize: '$xs',
  fontWeight: 700,
  textTransform: 'uppercase',
  transform: 'rotate(-5deg)',
})

const NoteSourceHint = styled('span', {
  display: 'inline-flex',
  margin: '0 0 $1',
  color: 'rgba(75, 58, 49, 0.68)',
  fontFamily: '$mono',
  fontSize: '$xs',
  textTransform: 'uppercase',
})

const NoteTitleRow = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '$2',
  alignItems: 'baseline',
})

const NoteTitle = styled('strong', {
  display: 'block',
  marginBottom: '$1',
  color: '#2f2116',
  fontFamily: '$note',
  fontSize: '$md',
})

const NoteBody = styled('p', {
  margin: 0,
  color: '#3d2c18',
  fontFamily: '$note',
  fontSize: '$md',
  lineHeight: 1.35,
})

export function PinnedNoteCard({ note }: { note: PinnedNote }) {
  return (
    <NoteRoot color={note.color} aria-label={note.title}>
      <TapeStrip aria-hidden="true" />
      <NoteClip aria-hidden="true" />
      <NoteSourceMark aria-hidden="true">{note.title.slice(0, 1)}</NoteSourceMark>
      <NoteTitleRow>
        <NoteTitle>{note.title}</NoteTitle>
        <NoteSourceHint>{note.sourceHint}</NoteSourceHint>
      </NoteTitleRow>
      <NoteBody>{note.text}</NoteBody>
    </NoteRoot>
  )
}

const PreviewRoot = styled('aside', {
  position: 'relative',
  width: 238,
  minHeight: 292,
  padding: '$5 $4 $4',
  color: '$ink',
  background: paperSurface(
    'linear-gradient(100deg, rgba(255, 255, 255, 0.22), transparent 54%), linear-gradient(0deg, rgba(255, 178, 135, 0.08), rgba(255, 178, 135, 0.08))',
  ),
  backgroundSize: 'auto, auto, 320px 320px',
  backgroundBlendMode: 'screen, multiply, normal',
  border: '1px solid rgba(73, 45, 28, 0.32)',
  borderRadius: '10px 8px 12px 9px',
  boxShadow: '0 24px 42px rgba(0, 0, 0, 0.42), -10px 7px 0 rgba(0, 0, 0, 0.08)',
  clipPath: 'polygon(2% 1%, 98% 0, 100% 94%, 94% 100%, 1% 97%)',
  transform: 'rotate(2.4deg)',

  '&::before': {
    content: '',
    position: 'absolute',
    top: -9,
    left: 20,
    width: 34,
    height: 23,
    background:
      'radial-gradient(circle, rgba(28, 22, 18, 0.44) 0 4px, rgba(255, 255, 255, 0.25) 4px 7px, rgba(28, 22, 18, 0.28) 7px)',
    borderRadius: '$round',
    boxShadow: '0 10px 16px rgba(0, 0, 0, 0.28)',
    transform: 'rotate(-20deg)',
  },

  '&::after': {
    content: '',
    position: 'absolute',
    top: 16,
    right: 16,
    left: 16,
    height: 1,
    background: 'rgba(84, 52, 30, 0.28)',
  },
})

const PreviewTitle = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '$3',
  alignItems: 'baseline',
  marginBottom: '$4',
  paddingTop: '$2',

  strong: {
    color: '$stampRed',
    fontFamily: '$mono',
    fontSize: '$md',
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  span: {
    color: '#6f4029',
    fontFamily: '$mono',
    fontSize: '$md',
  },
})

const PreviewMeta = styled('p', {
  margin: '0 0 $4',
  color: '$inkSoft',
  fontFamily: '$note',
  fontSize: '$sm',
  lineHeight: 1.45,
})

const PreviewList = styled('div', {
  display: 'grid',
  gap: '$2',
  marginBottom: '$4',
})

const PreviewRow = styled('div', {
  display: 'grid',
  gridTemplateColumns: '18px minmax(0, 1fr) 48px 18px',
  gap: '$2',
  alignItems: 'center',
  color: '$ink',
  fontFamily: '$note',
  fontSize: '$sm',
})

const PreviewIcon = styled('span', {
  display: 'grid',
  placeItems: 'center',
  width: 16,
  height: 16,
  color: '#2a2118',
  background: 'rgba(255, 178, 135, 0.22)',
  border: '1px solid rgba(84, 52, 30, 0.22)',
  borderRadius: '$sharp',
  fontFamily: '$mono',
  fontSize: '$xs',
})

const MiniSignal = styled('span', {
  height: 14,
  background:
    'repeating-linear-gradient(90deg, transparent 0 3px, rgba(113, 155, 98, 0.92) 3px 4px, transparent 4px 6px)',
  borderRadius: '$sharp',

  variants: {
    tone: {
      strong: {},
      mid: {
        background:
          'repeating-linear-gradient(90deg, transparent 0 4px, rgba(231, 158, 64, 0.9) 4px 5px, transparent 5px 7px)',
      },
      weak: {
        background:
          'repeating-linear-gradient(90deg, transparent 0 5px, rgba(140, 91, 65, 0.8) 5px 6px, transparent 6px 9px)',
      },
    },
  },
  defaultVariants: {
    tone: 'strong',
  },
})

const PreviewFooter = styled('footer', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '$3',
  borderTop: '1px solid rgba(84, 52, 30, 0.22)',
  color: '#5e3b27',
  fontFamily: '$note',
  fontSize: '$sm',
})

export function HighSignalPreviewCard({ items }: { items: ClippingItem[] }) {
  const tones = ['strong', 'mid', 'weak'] as const

  return (
    <PreviewRoot aria-label="High signal preview card">
      <PreviewTitle>
        <strong>High Signal</strong>
        <span>{items.length}</span>
      </PreviewTitle>
      <PreviewMeta>{items.length} 个来源 · 更新频率高 · 覆盖广</PreviewMeta>
      <PreviewList>
        {items.map((item, index) => (
          <PreviewRow key={item.id}>
            <PreviewIcon aria-hidden="true">{item.title.slice(0, 1)}</PreviewIcon>
            <span>{item.title}</span>
            <MiniSignal tone={tones[index % tones.length]} aria-hidden="true" />
            <span>{index === 0 ? '强' : index === 1 ? '中' : '弱'}</span>
          </PreviewRow>
        ))}
      </PreviewList>
      <PreviewFooter>
        <span>查看全部</span>
        <span>→</span>
      </PreviewFooter>
    </PreviewRoot>
  )
}

const ClippingRoot = styled('article', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 18px',
  gap: '$2',
  minHeight: '$clippingHeight',
  padding: '8px 8px 8px 25px',
  color: 'rgba(255, 237, 214, 0.86)',
  background: 'rgba(11, 7, 4, 0.34)',
  border: '1px solid rgba(207, 169, 126, 0.12)',
  borderBottom: 0,

  '&:last-child': {
    borderBottom: '1px solid rgba(207, 169, 126, 0.12)',
  },

  strong: {
    display: 'block',
    marginBottom: 3,
    color: 'rgba(255, 237, 214, 0.92)',
    fontFamily: '$mono',
    fontSize: '$xs',
    textTransform: 'uppercase',
  },

  p: {
    margin: 0,
    color: 'rgba(255, 237, 214, 0.78)',
    fontFamily: '$mono',
    fontSize: '$sm',
    lineHeight: 1.32,
  },

  variants: {
    mode: {
      dispatch: {},
      quick: {
        gridTemplateColumns: 'minmax(0, 1fr) 18px',
        minHeight: 30,
        padding: '7px 8px 7px 25px',

        strong: {
          display: 'none',
        },

        p: {
          color: 'rgba(255, 237, 214, 0.9)',
          fontSize: '$sm',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      },
    },
  },
  defaultVariants: {
    mode: 'quick',
  },
})

const ClippingPin = styled('span', {
  alignSelf: 'center',
  justifySelf: 'end',
  width: 9,
  height: 9,
  border: '1px solid rgba(255, 178, 135, 0.52)',
  transform: 'rotate(45deg)',
})

export function ClippingCard({ item, mode = 'quick' }: { item: ClippingItem; mode?: 'quick' | 'dispatch' }) {
  return (
    <ClippingRoot mode={mode}>
      <FreshnessGlyph placement="clipping" health={item.health} />
      <div>
        <strong>{item.source}</strong>
        <p>{item.title}</p>
      </div>
      <ClippingPin aria-hidden="true" />
    </ClippingRoot>
  )
}

const footerActionClass = css({
  position: 'relative',
  display: 'inline-flex',
  gap: '$2',
  alignItems: 'center',
  justifyContent: 'flex-start',
  justifySelf: 'start',
  width: 'fit-content',
  minWidth: 164,
  minHeight: 36,
  padding: '8px $4',
  color: '#2d1d13',
  background: paperSurface(
    'linear-gradient(90deg, rgba(255, 255, 255, 0.2), transparent 62%)',
    paperWarmTexture,
  ),
  backgroundSize: 'auto, 320px 320px',
  backgroundBlendMode: 'screen, normal',
  border: '1px solid rgba(74, 45, 32, 0.28)',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 12px 24px rgba(0, 0, 0, 0.22)',
  clipPath: 'polygon(1% 9%, 97% 0, 100% 88%, 0 100%)',
  fontFamily: '$mono',
  fontSize: '$md',
  textTransform: 'uppercase',
  transform: 'rotate(-0.7deg)',
  transition: 'box-shadow 180ms ease, transform 180ms ease',

  '&:hover': {
    transform: 'translateY(-2px) rotate(-0.2deg)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 18px 30px rgba(0, 0, 0, 0.28)',
  },
})

const FooterMark = styled('span', {
  display: 'grid',
  placeItems: 'center',
  width: 17,
  height: 17,
  border: '1px solid rgba(74, 45, 32, 0.34)',
  lineHeight: 1,
})

export function DeskFooterAction({
  children,
  asChild,
  className,
  ...props
}: {
  children: ReactNode
  asChild?: boolean
} & ComponentPropsWithoutRef<'button'>) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp className={cx(footerActionClass(), className)} type={asChild ? undefined : 'button'} {...props}>
      <FooterMark aria-hidden="true">+</FooterMark>
      {children}
    </Comp>
  )
}

export const SourceDeskFooter = styled('div', {
  position: 'relative',
  zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '$3',
  alignItems: 'center',
  padding: '$4 $5 0',

  span: {
    color: '$deskMuted',
    fontFamily: '$mono',
    fontSize: '$xs',
  },
})

const PopoverContent = styled(Tooltip.Content, {
  zIndex: 50,
  maxWidth: 260,
  padding: '$3 $4',
  color: '$ink',
  background: paperSurface('linear-gradient(140deg, rgba(255, 255, 255, 0.2), transparent 52%)'),
  backgroundSize: 'auto, 320px 320px',
  backgroundBlendMode: 'screen, normal',
  border: '1px solid rgba(73, 45, 28, 0.24)',
  borderRadius: '$paper',
  boxShadow: '$popover',
  fontFamily: '$serif',
  fontSize: '$md',
  lineHeight: 1.45,

  strong: {
    display: 'block',
    marginBottom: '$1',
    color: '$blueprint',
    fontFamily: '$mono',
    fontSize: '$xs',
    textTransform: 'uppercase',
  },

  p: {
    margin: 0,
  },
})

const PopoverArrow = styled(Tooltip.Arrow, {
  fill: '$paper',
})

export function IndexPreviewPopover({
  children,
  trigger,
  side = 'right',
}: {
  children: ReactNode
  trigger: ReactNode
  side?: Tooltip.TooltipContentProps['side']
}) {
  return (
    <Tooltip.Provider delayDuration={120}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Slot>{trigger}</Slot>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <PopoverContent side={side} sideOffset={10}>
            {children}
            <PopoverArrow />
          </PopoverContent>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export const MaterialSurface = styled('div', {
  position: 'relative',
  minHeight: 108,
  padding: '$4',
  color: '$ink',
  border: '1px solid $paperEdge',
  borderRadius: '$paper',
  fontFamily: '$mono',
  fontSize: '$sm',
  textTransform: 'uppercase',

  '&::after': {
    content: '',
    position: 'absolute',
    right: 12,
    bottom: 10,
    left: 12,
    height: 1,
    background: 'rgba(73, 45, 28, 0.18)',
    transform: 'rotate(-1deg)',
  },

  variants: {
    material: {
      paper: {
        background: paperSurface('linear-gradient(100deg, rgba(255, 255, 255, 0.2), transparent 52%)'),
        backgroundSize: 'auto, 320px 320px',
        boxShadow: '$paperContact',
      },
      lifted: {
        background: paperSurface('linear-gradient(100deg, rgba(255, 255, 255, 0.22), transparent 52%)'),
        backgroundSize: 'auto, 320px 320px',
        boxShadow: '$paperLift',
        transform: 'translateY(-3px) rotate(-0.4deg)',
      },
      floating: {
        background: paperSurface(
          'linear-gradient(100deg, rgba(255, 255, 255, 0.24), transparent 52%)',
          paperWarmTexture,
        ),
        backgroundSize: 'auto, 320px 320px',
        boxShadow: '$paperFloat',
        transform: 'translateY(-8px) rotate(0.4deg)',
      },
      desk: {
        color: '$deskInk',
        background: `${deskGrainLayers}, $deskPanel`,
        borderColor: '$deskLine',
        boxShadow: '$deskPanel',
      },
      tape: {
        minHeight: 58,
        background: tapeSurface('linear-gradient(90deg, rgba(255, 255, 255, 0.22), transparent)'),
        backgroundSize: 'auto, 256px 96px',
        clipPath: 'polygon(0 10%, 8% 0, 100% 8%, 94% 100%, 3% 90%)',
        boxShadow: '0 9px 18px rgba(0, 0, 0, 0.18)',
      },
      dropTarget: {
        color: '$deskMuted',
        background: 'rgba(11, 7, 4, 0.2)',
        border: '1px dashed rgba(207, 169, 126, 0.42)',
        boxShadow: '$dropSlot',
      },
    },
  },
  defaultVariants: {
    material: 'paper',
  },
})
