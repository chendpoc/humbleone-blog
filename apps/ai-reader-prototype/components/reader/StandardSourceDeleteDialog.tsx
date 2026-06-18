'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from './ReaderIcons'

type StandardSourceDeleteDialogProps = {
  collectionName: string
  open: boolean
  sourceCount: number
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function StandardSourceDeleteDialog({
  collectionName,
  open,
  sourceCount,
  onConfirm,
  onOpenChange,
}: StandardSourceDeleteDialogProps) {
  const { t } = useTranslation('reader')

  function confirmDelete() {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="standard-source-dialog-overlay" />
        <Dialog.Content className="standard-source-dialog">
          <div className="standard-source-dialog-header">
            <Dialog.Title>{t('sourceManagement.deleteGroupTitle', { name: collectionName })}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label={t('sourceManagement.closeDialogAria')}>
                <XMarkIcon />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description>
            {t('sourceManagement.deleteGroupDescription', { count: sourceCount })}
          </Dialog.Description>
          <div className="standard-source-dialog-actions">
            <Dialog.Close asChild>
              <button type="button">{t('sourceManagement.cancel')}</button>
            </Dialog.Close>
            <button type="button" className="is-danger" onClick={confirmDelete}>
              {t('sourceManagement.deleteConfirm')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
