'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useTranslation } from 'react-i18next'
import { EllipsisHorizontalIcon, FolderPlusIcon, PencilSquareIcon, PlusIcon, TrashIcon } from './ReaderIcons'

type StandardSourceCollectionMenuProps = {
  canDelete: boolean
  onAddSources: () => void
  onCreateCollection: () => void
  onDeleteCollection: () => void
  onRenameCollection: () => void
}

export function StandardSourceCollectionMenu({
  canDelete,
  onAddSources,
  onCreateCollection,
  onDeleteCollection,
  onRenameCollection,
}: StandardSourceCollectionMenuProps) {
  const { t } = useTranslation('reader')

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="standard-source-menu-trigger" aria-label={t('sourceManagement.groupMenuAria')}>
          <EllipsisHorizontalIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="standard-source-action-menu" align="end" sideOffset={5}>
          <DropdownMenu.Item className="standard-source-action-menu-item" onSelect={onAddSources}>
            <FolderPlusIcon />
            <span>{t('sourceManagement.addSources')}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className="standard-source-action-menu-item" onSelect={onRenameCollection}>
            <PencilSquareIcon />
            <span>{t('sourceManagement.renameGroup')}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item className="standard-source-action-menu-item" onSelect={onCreateCollection}>
            <PlusIcon />
            <span>{t('sourceManagement.newGroup')}</span>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="standard-source-action-menu-separator" />
          <DropdownMenu.Item
            className="standard-source-action-menu-item is-danger"
            disabled={!canDelete}
            onSelect={onDeleteCollection}
          >
            <TrashIcon />
            <span>{t('sourceManagement.deleteGroup')}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
