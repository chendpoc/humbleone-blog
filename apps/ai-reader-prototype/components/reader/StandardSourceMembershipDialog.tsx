'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StandardSource } from '../../types/reader'
import { normalizeFilter } from '../../utils/standardReaderModel'
import { XMarkIcon } from './ReaderIcons'

type StandardSourceMembershipDialogProps = {
  collectionName: string
  existingSourceIds: string[]
  open: boolean
  sources: StandardSource[]
  onOpenChange: (open: boolean) => void
  onSubmit: (sourceIds: string[]) => void
}

export function StandardSourceMembershipDialog({
  collectionName,
  existingSourceIds,
  open,
  sources,
  onOpenChange,
  onSubmit,
}: StandardSourceMembershipDialogProps) {
  const { t } = useTranslation('reader')
  const [query, setQuery] = useState('')
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(() => new Set())
  const existingSourceIdSet = useMemo(() => new Set(existingSourceIds), [existingSourceIds])
  const availableSources = useMemo(
    () => sources.filter((source) => !existingSourceIdSet.has(source.feedSourceId)),
    [existingSourceIdSet, sources],
  )
  const filteredSources = useMemo(() => {
    const normalizedQuery = normalizeFilter(query)

    if (!normalizedQuery) {
      return availableSources
    }

    return availableSources.filter((source) =>
      normalizeFilter(`${source.label} ${source.category} ${source.registry?.topicTags.join(' ') ?? ''}`).includes(
        normalizedQuery,
      ),
    )
  }, [availableSources, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedSourceIds(new Set())
    }
  }, [open])

  function toggleSource(sourceId: string) {
    setSelectedSourceIds((current) => {
      const next = new Set(current)

      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }

      return next
    })
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedSourceIds.size) {
      return
    }

    onSubmit([...selectedSourceIds])
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="standard-source-dialog-overlay" />
        <Dialog.Content className="standard-source-dialog is-wide">
          <div className="standard-source-dialog-header">
            <Dialog.Title>{t('sourceManagement.addSourcesTitle', { name: collectionName })}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label={t('sourceManagement.closeDialogAria')}>
                <XMarkIcon />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description>{t('sourceManagement.addSourcesDescription')}</Dialog.Description>
          <form className="standard-source-dialog-form" onSubmit={submitForm}>
            <label>
              <span>{t('sourceManagement.searchSources')}</span>
              <input
                autoFocus
                value={query}
                placeholder={t('sourceManagement.searchSourcesPlaceholder')}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="standard-source-picker" aria-label={t('sourceManagement.sourcePickerAria')}>
              {filteredSources.length ? (
                filteredSources.map((source) => (
                  <label key={source.feedSourceId}>
                    <input
                      checked={selectedSourceIds.has(source.feedSourceId)}
                      type="checkbox"
                      onChange={() => toggleSource(source.feedSourceId)}
                    />
                    <span>
                      <strong>{source.label}</strong>
                      <small>{source.registry?.adapter ?? source.category}</small>
                    </span>
                  </label>
                ))
              ) : (
                <p>{t('sourceManagement.noAvailableSources')}</p>
              )}
            </div>
            <div className="standard-source-dialog-actions">
              <span>{t('sourceManagement.selectedSources', { count: selectedSourceIds.size })}</span>
              <Dialog.Close asChild>
                <button type="button">{t('sourceManagement.cancel')}</button>
              </Dialog.Close>
              <button type="submit" className="is-primary" disabled={!selectedSourceIds.size}>
                {t('sourceManagement.addSelected')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
