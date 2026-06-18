'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from './ReaderIcons'

type StandardSourceRowMenuProps = {
  onRemoveFromCollection: () => void
  onRenameSource: () => void
}

export function StandardSourceRowMenu({ onRemoveFromCollection, onRenameSource }: StandardSourceRowMenuProps) {
  const { t } = useTranslation('reader')

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="standard-source-menu-trigger" aria-label={t('sourceManagement.sourceMenuAria')}>
          <EllipsisHorizontalIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="standard-source-action-menu" align="end" side="right" sideOffset={5}>
          <DropdownMenu.Item className="standard-source-action-menu-item" onSelect={onRenameSource}>
            <PencilSquareIcon />
            <span>{t('sourceManagement.renameSource')}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="standard-source-action-menu-separator" />
          <DropdownMenu.Item className="standard-source-action-menu-item is-danger" onSelect={onRemoveFromCollection}>
            <TrashIcon />
            <span>{t('sourceManagement.removeFromGroup')}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
