'use client';

import { useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";

interface MultiSelectComboboxProps {
    options: string[];
    selected: string[];
    onSelectedChange: (selected: string[]) => void;
    placeholder: string;
    creatable?: boolean;
    onOptionCreate?: (option: string) => void;
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
    options,
    selected,
    onSelectedChange,
    placeholder,
    creatable = false,
    onOptionCreate,
}) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const handleSelect = (option: string) => {
        onSelectedChange([...selected, option].sort());
        setInputValue("");
        // Do not close on select to allow multiple selections
    };

    const handleCreate = () => {
        if (creatable && onOptionCreate && inputValue.trim() && !options.includes(inputValue) && !selected.includes(inputValue)) {
            const newOption = inputValue.trim();
            onOptionCreate(newOption);
            onSelectedChange([...selected, newOption].sort());
        }
        setInputValue("");
    };

    const handleUnselect = (option: string) => {
        onSelectedChange(selected.filter(s => s !== option));
    };
    
    const filteredOptions = options.filter(option => !selected.includes(option));

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
                        <div className="flex flex-wrap gap-1">
                            {selected.length > 0 
                                ? selected.map(val => (
                                    <Badge key={val} variant="secondary" className="mr-1">
                                        {val}
                                        <button onClick={(e) => { e.stopPropagation(); handleUnselect(val); }} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                                : placeholder}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search or create..."
                            value={inputValue}
                            onValueChange={setInputValue}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreate();
                                }
                            }}
                        />
                        <CommandList>
                             <CommandEmpty>
                                {creatable && onOptionCreate && inputValue.trim() ? (
                                    <Button variant="ghost" className="w-full justify-start" onClick={handleCreate}>
                                        Create "{inputValue}"
                                    </Button>
                                ) : (
                                    "No results found."
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {filteredOptions.map((option) => (
                                    <CommandItem key={option} onSelect={() => handleSelect(option)}>
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};
