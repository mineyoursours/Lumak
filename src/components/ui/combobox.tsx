import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  value?: string
  onSelect: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  options: { value: string; label: string }[]
  emptyMessage?: string
  className?: string
}

export function Combobox({
  value,
  onSelect,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  options = [],
  emptyMessage = "No options found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  const handleSelect = (currentValue: string) => {
    onSelect(currentValue === value ? "" : currentValue)
    setOpen(false)
    setSearchValue("")
  }

  const handleClearSearch = () => {
    setSearchValue("")
  }

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <div className="flex items-center gap-1">
            {selectedOption && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClearSelection}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="flex-1"
            />
            {searchValue && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 cursor-pointer hover:opacity-100"
                onClick={handleClearSearch}
              />
            )}
          </div>
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}