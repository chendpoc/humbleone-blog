'use client'

import { useTranslation } from 'react-i18next'
import { PlusIcon } from './ReaderIcons'

type StandardSourceGroupsToolbarProps = {
  groupCount: number
  onCreateCollection: () => void
}

export function StandardSourceGroupsToolbar({ groupCount, onCreateCollection }: StandardSourceGroupsToolbarProps) {
  const { t } = useTranslation('reader')

  return (
    <div className="standard-source-groups-toolbar" aria-label={t('sourceManagement.groupsToolbarAria')}>
      <div>
        <span>{t('sourceManagement.groupsTitle')}</span>
        <small>{t('sourceManagement.groupsCount', { count: groupCount })}</small>
      </div>
      <button
        type="button"
        aria-label={t('sourceManagement.createGroupAria')}
        title={t('sourceManagement.newGroup')}
        onClick={onCreateCollection}
      >
        <PlusIcon />
      </button>
    </div>
  )
}
