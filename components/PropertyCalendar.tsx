"use client"

import * as React from "react"
import { DayPicker, DateRange } from "react-day-picker"
import { format, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import "react-day-picker/dist/style.css"

export type SeasonalPrice = {
    date: Date
    price: number
}

interface PropertyCalendarProps {
    blockedDates?: Date[]
    seasonalPrices?: SeasonalPrice[]
    onRangeSelect?: (range: DateRange | undefined) => void
    className?: string
}

export function PropertyCalendar({
    blockedDates = [],
    seasonalPrices = [],
    onRangeSelect,
    className,
}: PropertyCalendarProps) {
    const [range, setRange] = React.useState<DateRange | undefined>()

    const handleSelect = (newRange: DateRange | undefined) => {
        setRange(newRange)
        if (onRangeSelect) {
            onRangeSelect(newRange)
        }
    }

    const isBlocked = (date: Date) => {
        return blockedDates.some((blockedDate) => isSameDay(blockedDate, date))
    }



    return (
        <div className={`p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 ${className}`}>
            <DayPicker
                mode="range"
                selected={range}
                onSelect={handleSelect}
                disabled={blockedDates}
                components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                    DayContent: ({ date }) => (
                        <div className="flex flex-col items-center justify-center w-full h-full relative p-1">
                            <span className="z-10">{format(date, 'd')}</span>

                        </div>
                    )
                }}
                classNames={{
                    month: "w-full",
                    table: "w-full table-fixed border-collapse",
                    head_cell: "text-muted-foreground font-normal text-[0.8rem] text-center pb-2",
                    cell: "text-center p-0 align-middle",
                    day: "w-8 h-8 sm:w-10 sm:h-10 mx-auto font-normal rounded-full hover:bg-gray-100 flex items-center justify-center",
                    day_selected: "!bg-gold-500/20 !text-black hover:bg-gold-500/30 focus:!bg-gold-500/30 focus:!text-black",
                    day_range_start: `${range?.from && range?.to && !isSameDay(range.from, range.to)
                        ? "rounded-l-full rounded-r-none"
                        : "rounded-full"
                        } !bg-gold-500/20 !text-black hover:bg-gold-500/30`,
                    day_range_end: "!bg-gold-500/20 !text-black rounded-r-full rounded-l-none hover:bg-gold-500/30",
                    day_range_middle: "!bg-gold-500/20 !text-black rounded-none hover:!bg-gold-500/30",
                    day_today: "font-bold text-amber-600",
                    day_outside: "text-gray-300 opacity-50",
                    day_disabled: "text-gray-400 opacity-50 line-through decoration-red-500",
                    day_hidden: "invisible",
                }}
                modifiersClassNames={{
                    selected: "bg-black text-white hover:bg-gray-800",
                }}

            // Note: react-day-picker v8 uses 'components' for custom renderers but the customized day content 
            // is often easier via the formatters or children. 
            // For v8, we can use the `formatDay` prop or custom components.
            // Let's use a simpler approach for the "Pro" touch: Customizing the `DayContent`

            // Actually, for custom content inside the day cell:
            />
        </div>
    )
}
