'use client';

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const Root = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    items: unknown[]
    value?: unknown
    onValueChange?: (value: unknown) => void
    children?: React.ReactNode
    itemToStringValue?: (item: unknown) => string
    disabled?: boolean
  }
>(
  (
    {
      items,
      value,
      onValueChange,
      children,
      itemToStringValue,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchValue, setSearchValue] = React.useState("")

    const filteredItems = React.useMemo(() => {
      return items.filter((item) => {
        const stringValue = itemToStringValue
          ? itemToStringValue(item)
          : String(item)
        return stringValue
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      })
    }, [items, searchValue, itemToStringValue])

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              open,
              setOpen,
              searchValue,
              setSearchValue,
              value,
              onValueChange,
              items: filteredItems,
              disabled,
            } as any)
          }
          return child
        })}
      </div>
    )
  }
)
Root.displayName = "Combobox"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    open?: boolean
    setOpen?: (open: boolean) => void
    searchValue?: string
    setSearchValue?: (value: string) => void
  }
>(({ open, setOpen, searchValue, setSearchValue, className, ...props }, ref) => (
  <input
    ref={ref}
    type="text"
    value={searchValue}
    onChange={(e) => setSearchValue?.(e.target.value)}
    onFocus={() => setOpen?.(true)}
    className={cn(
      "flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
))
Input.displayName = "ComboboxInput"

const Content = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    setOpen?: (open: boolean) => void
  }
>(({ open, setOpen, className, ...props }, ref) => {
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref && "current" in ref && ref.current) {
        if (!ref.current.contains(e.target as Node)) {
          setOpen?.(false)
        }
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () =>
        document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen, ref])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full left-0 z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md",
        className
      )}
      {...props}
    />
  )
})
Content.displayName = "ComboboxContent"

const List = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children?: (item: unknown) => React.ReactNode
    items?: unknown[]
  }
>(({ children, items, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-64 overflow-y-auto", className)}
    {...props}
  >
    {items?.map((item, index) => (
      <React.Fragment key={index}>{children?.(item)}</React.Fragment>
    ))}
  </div>
))
List.displayName = "ComboboxList"

const Item = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: unknown
    onValueChange?: (value: unknown) => void
    setOpen?: (open: boolean) => void
  }
>(
  (
    { value, onValueChange, setOpen, className, onClick, ...props },
    ref
  ) => (
    <div
      ref={ref}
      role="option"
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={(e) => {
        onValueChange?.(value)
        setOpen?.(false)
        onClick?.(e)
      }}
      {...props}
    />
  )
)
Item.displayName = "ComboboxItem"

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)}
    {...props}
  />
))
Empty.displayName = "ComboboxEmpty"

export const Combobox = Object.assign(Root, {
  Input,
  Content,
  List,
  Item,
  Empty,
})

export {
  Root as ComboboxRoot,
  Input as ComboboxInput,
  Content as ComboboxContent,
  List as ComboboxList,
  Item as ComboboxItem,
  Empty as ComboboxEmpty,
}
