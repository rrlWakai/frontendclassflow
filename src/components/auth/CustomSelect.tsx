import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check } from 'lucide-react'

export interface CustomSelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  name: string
  value: string
  placeholder: string
  options: CustomSelectOption[]
  error?: string
  disabled?: boolean
  wide?: boolean
  onChange: (value: string) => void
}

export function CustomSelect({
  label,
  name,
  value,
  placeholder,
  options,
  error,
  disabled = false,
  wide = false,
  onChange,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const generatedId = useId()
  const triggerId = `${name}-trigger-${generatedId}`
  const listId = `${name}-listbox-${generatedId}`
  const labelId = `${name}-label-${generatedId}`
  const messageId = `${name}-message-${generatedId}`

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined

  function openList() {
    if (disabled || options.length === 0) {
      return
    }

    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setIsOpen(true)
  }

  function closeList(shouldFocusTrigger = false) {
    setIsOpen(false)
    setActiveIndex(-1)

    if (shouldFocusTrigger) {
      triggerRef.current?.focus()
    }
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    closeList(true)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    listRef.current?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeList()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return
    }

    const activeOption = listRef.current?.children[activeIndex]
    if (activeOption instanceof HTMLElement) {
      activeOption.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, isOpen])

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openList()
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((current) => (current + 1) % options.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((current) => (current - 1 + options.length) % options.length)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (activeIndex >= 0 && options[activeIndex]) {
          selectOption(options[activeIndex].value)
        }
        break
      case 'Escape':
        event.preventDefault()
        closeList(true)
        break
      case 'Tab':
        closeList()
        break
      default:
        break
    }
  }

  return (
    <div
      ref={rootRef}
      className={
        wide
          ? 'cf-auth__field cf-auth__field--wide cf-auth__select'
          : 'cf-auth__field cf-auth__select'
      }
    >
      <label className="cf-auth__label" htmlFor={triggerId}>
        {label}
      </label>
      <div className="cf-auth__select-control">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          className="cf-auth__select-trigger"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          disabled={disabled}
          onClick={() => (isOpen ? closeList(true) : openList())}
          onKeyDown={handleTriggerKeyDown}
        >
          <span
            className={
              selectedOption
                ? 'cf-auth__select-value'
                : 'cf-auth__select-value cf-auth__select-value--placeholder'
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="cf-auth__select-chevron" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none">
              <path
                d="M6 8.5 10 12.5 14 8.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {isOpen ? (
          <ul
            ref={listRef}
            id={listId}
            className="cf-auth__select-panel"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
            }
            onKeyDown={handleListKeyDown}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value

              return (
                <li
                  key={option.value}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className="cf-auth__select-option"
                  data-active={index === activeIndex}
                  onClick={() => selectOption(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="cf-auth__select-option-label">{option.label}</span>
                  <span className="cf-auth__select-check" aria-hidden="true">
                    <Check />
                  </span>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p className="cf-auth__field-error" id={messageId}>
          {error}
        </p>
      ) : null}
    </div>
  )
}