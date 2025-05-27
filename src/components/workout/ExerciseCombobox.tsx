'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COMMON_EXERCISES, type Exercise } from '@/lib/types'

interface ExerciseComboboxProps {
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
}

export function ExerciseCombobox({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select exercise...',
  emptyMessage = 'No exercise found.',
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')

  const exercises: { label: string; value: string }[] = COMMON_EXERCISES.map(ex => ({
    label: ex.name,
    value: ex.name, // Using the name itself as the value, as it's used for matching
  }))

  // Find the currently selected exercise object for display
  const selectedExercise = exercises.find(
    exercise => exercise.value.toLowerCase() === value?.toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-muted-foreground"
          disabled={disabled}
        >
          {selectedExercise ? selectedExercise.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          {' '}
          {/* We do custom filtering via CommandInput value */}
          <CommandInput
            placeholder="Search exercise..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {exercises
                .filter(exercise => exercise.label.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(exercise => (
                  <CommandItem
                    key={exercise.value}
                    value={exercise.value} // This value is used by Command for its internal state/selection
                    onSelect={(currentValue: string) => {
                      // currentValue is the exercise.value (the name string)
                      onValueChange(currentValue === value ? '' : currentValue)
                      setOpen(false)
                      setSearchTerm('') // Reset search term on select
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value?.toLowerCase() === exercise.value.toLowerCase()
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {exercise.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
