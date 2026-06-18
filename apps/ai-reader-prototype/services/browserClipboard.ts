export async function copyTextToClipboard(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return
  }

  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // The prototype still shows local intent feedback if browser permissions deny clipboard access.
  }
}
