/** True for inputs, textareas, selects, and contenteditable hosts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  const tag = target.tagName.toLowerCase()
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  )
}

/** True for controls that already handle Space/Enter themselves. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  if (isTypingTarget(target)) return true
  const tag = target.tagName.toLowerCase()
  return tag === 'button' || tag === 'a' || tag === 'summary'
}
