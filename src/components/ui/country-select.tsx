"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { getCountries, getCountryCallingCode } from "react-phone-number-input/input"
import en from "react-phone-number-input/locale/en"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type CountrySelectProps = {
    value?: string
    onChange: (value: string) => void
    placeholder?: string
}

export function CountrySelect({ value, onChange, placeholder = "Select country" }: CountrySelectProps) {
    const [open, setOpen] = React.useState(false)

    const countries = getCountries().map((country) => ({
        value: country,
        label: en[country],
        flag: `https://purecatamphetamine.github.io/country-flag-icons/3x2/${country}.svg`, // Using a CDN for flags or simple emoji if preferred
    }))

    const selectedCountry = countries.find((country) => country.value === value)

    // Use Emoji flags for simplicity if SVG fails or as a fallback
    const getFlagEmoji = (countryCode: string) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-gray-50/50 border-gray-200 h-11 text-base md:text-sm shadow-none font-normal"
                >
                    {selectedCountry ? (
                        <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{getFlagEmoji(selectedCountry.value)}</span>
                            <span className="truncate">{selectedCountry.label}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.value}
                                    value={country.label}
                                    onSelect={(currentValue) => {
                                        onChange(country.value)
                                        setOpen(false)
                                    }}
                                    keywords={[country.label, country.value]}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === country.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="mr-2 text-lg leading-none">{getFlagEmoji(country.value)}</span>
                                    {country.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
