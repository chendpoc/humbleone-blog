'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XMarkIcon } from './ReaderIcons'

type StandardSourceTextDialogProps = {
  description: string
  initialValue?: string
  label: string
  open: boolean
  placeholder: string
  submitLabel?: string
  title: string
  onOpenChange: (open: boolean) => void
  onSubmit: (value: string) => void
}

export function StandardSourceTextDialog({
  description,
  initialValue = '',
  label,
  open,
  placeholder,
  submitLabel,
  title,
  onOpenChange,
  onSubmit,
}: StandardSourceTextDialogProps) {
  const { t } = useTranslation('reader')
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
    }
  }, [initialValue, open])

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextValue = value.trim()

    if (!nextValue) {
      return
    }

    onSubmit(nextValue)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="standard-source-dialog-overlay" />
        <Dialog.Content className="standard-source-dialog">
          <div className="standard-source-dialog-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label={t('sourceManagement.closeDialogAria')}>
                <XMarkIcon />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description>{description}</Dialog.Description>
          <form className="standard-source-dialog-form" onSubmit={submitForm}>
            <label>
              <span>{label}</span>
              <input autoFocus value={value} placeholder={placeholder} onChange={(event) => setValue(event.target.value)} />
            </label>
            <div className="standard-source-dialog-actions">
              <Dialog.Close asChild>
                <button type="button">{t('sourceManagement.cancel')}</button>
              </Dialog.Close>
              <button type="submit" className="is-primary" disabled={!value.trim()}>
                {submitLabel ?? t('sourceManagement.save')}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
