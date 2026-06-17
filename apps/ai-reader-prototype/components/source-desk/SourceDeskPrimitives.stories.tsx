import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { styled } from '../../stitches.config'
import { dailyBrief, type SourceDeskItem } from '../../lib/prototype-data'
import {
  ClippingCard,
  DeskFooterAction,
  DeskHeaderTools,
  FreshnessGlyph,
  HighSignalPreviewCard,
  IndexPreviewPopover,
  MaterialSurface,
  PinnedNoteCard,
  SourceDeskFooter,
  SourceDeskHeader,
  SourceDeskSection,
  SourceDeskShell,
  SourceSlip,
  StampBadge,
} from './SourceDeskPrimitives'

const meta = {
  title: 'Source Desk/Primitives',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const StoryGrid = styled('div', {
  display: 'grid',
  gap: '$4',
  width: 'min(920px, calc(100vw - 64px))',

  variants: {
    mode: {
      slips: {
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      },
      notes: {
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
      },
      clippings: {
        maxWidth: 520,
      },
      tokens: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
      },
      materials: {
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        alignItems: 'start',
      },
    },
  },
})

const StoryPanel = styled('div', {
  display: 'grid',
  gap: '$4',
  padding: '$5',
  width: 'min(920px, calc(100vw - 64px))',
  background:
    'radial-gradient(circle at 15% 16%, rgba(255, 178, 135, 0.08), transparent 11rem), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 7px), $deskPanel',
  border: '1px solid $deskLine',
  borderRadius: '$paper',
  boxShadow: '$deskPanel',
})

const ShowcaseStage = styled('div', {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '340px 260px',
  gap: '$6',
  alignItems: 'start',
  width: 'min(760px, calc(100vw - 64px))',
  padding: '$5',
  background:
    'radial-gradient(circle at 15% 16%, rgba(255, 178, 135, 0.08), transparent 11rem), url("/textures/desk-walnut.svg"), $deskPanel',
  backgroundSize: 'auto, 384px 384px, auto',
  border: '1px solid $deskLine',
  borderRadius: '$paper',
  boxShadow: '$deskPanel',

  '@compact': {
    gridTemplateColumns: '1fr',
  },
})

const MaterialLabel = styled('span', {
  display: 'block',
  marginTop: '$2',
  color: '$deskMuted',
  fontFamily: '$mono',
  fontSize: '$xs',
  textTransform: 'uppercase',
})

const GlyphDemo = styled('span', {
  position: 'relative',
  width: 42,
  height: 42,
  background: 'rgba(255, 250, 232, 0.72)',
  border: '1px solid rgba(73, 45, 28, 0.18)',
})

const source = dailyBrief.sourceDesk.sourceSlips[0]
const sourceStates: SourceDeskItem[] = [
  { ...source, id: 'source-default', label: 'Default Source', state: 'default', health: 'fresh' },
  { ...source, id: 'source-hover', label: 'Hover Source', state: 'hover', health: 'fresh' },
  { ...source, id: 'source-selected', label: 'Selected Source', state: 'selected', health: 'fresh' },
  { ...source, id: 'source-new', label: 'New Source', state: 'new', health: 'fresh' },
  { ...source, id: 'source-stale', label: 'Stale Source', state: 'stale', health: 'stale' },
  {
    ...source,
    id: 'source-failed',
    label: 'Failed Source',
    state: 'failed',
    health: 'failed',
    description: 'Adapter returned no reliable feed items.',
  },
  { ...source, id: 'source-dragging', label: 'Dragging Source', state: 'dragging', health: 'fresh' },
  { ...source, id: 'source-drop-target', label: 'Drop Target', state: 'drop-target', health: 'quiet' },
]

export const SourceSlipStates: Story = {
  render: () => (
    <StoryGrid mode="slips">
      {sourceStates.map((item, index) => (
        <SourceSlip key={item.id} source={item} index={index} />
      ))}
    </StoryGrid>
  ),
}

export const SourceDeskBoard: Story = {
  render: () => (
    <SourceDeskShell aria-label="Source Desk component board">
      <SourceDeskHeader
        label="BUILDER_OS"
        title="AI Workstation v1.0"
        scale="console"
        action={<DeskHeaderTools />}
      />
      <SourceDeskSection label="Source Desk" tab kind="folders">
        {dailyBrief.sourceDesk.sourceGroups.map((item, index) => (
          <SourceSlip key={item.id} source={item} index={index} />
        ))}
      </SourceDeskSection>
      <SourceDeskSection label="Pinned Notes" action="Edit" kind="notes">
        {dailyBrief.sourceDesk.pinnedNotes.map((note) => (
          <PinnedNoteCard key={note.id} note={note} />
        ))}
      </SourceDeskSection>
      <SourceDeskSection label="Quick Access" action="Drag to pin" kind="clippings">
        {dailyBrief.sourceDesk.quickAccess.map((item) => (
          <ClippingCard key={item.id} item={item} />
        ))}
      </SourceDeskSection>
      <SourceDeskFooter>
        <DeskFooterAction>{dailyBrief.sourceDesk.footerAction.label}</DeskFooterAction>
        <span>{dailyBrief.sourceDesk.footerAction.secondaryLabel}</span>
      </SourceDeskFooter>
    </SourceDeskShell>
  ),
}

export const SourceDeskShowcase: Story = {
  render: () => (
    <ShowcaseStage>
      <SourceDeskShell aria-label="Source Desk showcase board">
        <SourceDeskHeader
          label="BUILDER_OS"
          title="AI Workstation v1.0"
          scale="console"
          action={<DeskHeaderTools />}
        />
        <SourceDeskSection label="Source Desk" tab kind="folders">
          {dailyBrief.sourceDesk.sourceGroups.map((item, index) => (
            <SourceSlip key={item.id} source={item} index={index} />
          ))}
        </SourceDeskSection>
        <SourceDeskSection label="Pinned Notes" action="Edit" kind="notes">
          {dailyBrief.sourceDesk.pinnedNotes.map((note) => (
            <PinnedNoteCard key={note.id} note={note} />
          ))}
        </SourceDeskSection>
        <SourceDeskSection label="Quick Access" action="Drag to pin" kind="clippings">
          {dailyBrief.sourceDesk.quickAccess.map((item) => (
            <ClippingCard key={item.id} item={item} />
          ))}
        </SourceDeskSection>
        <SourceDeskFooter>
          <DeskFooterAction>{dailyBrief.sourceDesk.footerAction.label}</DeskFooterAction>
          <span>{dailyBrief.sourceDesk.footerAction.secondaryLabel}</span>
        </SourceDeskFooter>
      </SourceDeskShell>
      <HighSignalPreviewCard items={dailyBrief.sourceDesk.quickAccess} />
    </ShowcaseStage>
  ),
}

export const MaterialSamples: Story = {
  render: () => (
    <StoryPanel>
      <StoryGrid mode="materials">
        <div>
          <MaterialSurface material="desk">Desk grain</MaterialSurface>
          <MaterialLabel>Dark desk surface</MaterialLabel>
        </div>
        <div>
          <MaterialSurface material="paper">Paper flat</MaterialSurface>
          <MaterialLabel>Contact shadow</MaterialLabel>
        </div>
        <div>
          <MaterialSurface material="lifted">Paper lifted</MaterialSurface>
          <MaterialLabel>Hover lift</MaterialLabel>
        </div>
        <div>
          <MaterialSurface material="floating">Paper floating</MaterialSurface>
          <MaterialLabel>Dragging</MaterialLabel>
        </div>
        <div>
          <MaterialSurface material="tape">Tape strip</MaterialSurface>
          <MaterialLabel>Torn tape</MaterialLabel>
        </div>
        <div>
          <MaterialSurface material="dropTarget">Drop target</MaterialSurface>
          <MaterialLabel>Pencil slot</MaterialLabel>
        </div>
      </StoryGrid>
    </StoryPanel>
  ),
}

export const InteractionStates: Story = {
  render: () => (
    <StoryPanel>
      <StoryGrid mode="slips">
        {sourceStates.map((item, index) => (
          <SourceSlip key={item.id} source={item} index={index} />
        ))}
      </StoryGrid>
    </StoryPanel>
  ),
}

export const PinnedNotes: Story = {
  render: () => (
    <StoryGrid mode="notes">
      {dailyBrief.sourceDesk.pinnedNotes.map((note) => (
        <PinnedNoteCard key={note.id} note={note} />
      ))}
    </StoryGrid>
  ),
}

export const Clippings: Story = {
  render: () => (
    <StoryGrid mode="clippings">
      {dailyBrief.sourceDesk.quickAccess.map((item) => (
        <ClippingCard key={item.id} item={item} />
      ))}
    </StoryGrid>
  ),
}

export const StampsAndFreshness: Story = {
  render: () => (
    <StoryGrid mode="tokens">
      <StampBadge>6 items</StampBadge>
      <StampBadge tone="blue">official</StampBadge>
      <StampBadge tone="green">saved</StampBadge>
      <StampBadge tone="copper">manual</StampBadge>
      <GlyphDemo>
        <FreshnessGlyph health="fresh" state="new" placement="demo" label="Fresh source" />
      </GlyphDemo>
      <GlyphDemo>
        <FreshnessGlyph health="stale" state="stale" placement="demo" label="Stale source" />
      </GlyphDemo>
      <GlyphDemo>
        <FreshnessGlyph health="failed" state="failed" placement="demo" label="Failed source" />
      </GlyphDemo>
      <DeskFooterAction>Add Source</DeskFooterAction>
    </StoryGrid>
  ),
}

export const RadixPreviewPopover: Story = {
  render: () => (
    <IndexPreviewPopover
      trigger={
        <DeskFooterAction>
          Hover index
        </DeskFooterAction>
      }
    >
      <strong>Radix Tooltip Primitive</strong>
      <p>Popover behavior comes from Radix. Paper, ink, stamp and clipping styling stay owned by this project.</p>
    </IndexPreviewPopover>
  ),
}
