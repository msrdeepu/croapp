import * as React from "react";
import { Clock } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "src/components/ui/popover";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";

interface TimePickerProps {
    time: string | undefined;
    setTime: (time: string) => void;
    className?: string;
}

export function TimePicker({ time, setTime, className }: TimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Parse time string (HH:mm) or default
    const [selectedHour, setSelectedHour] = React.useState<string | null>(null);
    const [selectedMinute, setSelectedMinute] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (time) {
            const [h, m] = time.split(':');
            setSelectedHour(h);
            setSelectedMinute(m);
        } else {
            setSelectedHour(null);
            setSelectedMinute(null);
        }
    }, [time]);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    const handleTimeSelect = (type: 'hour' | 'minute', value: string) => {
        if (type === 'hour') {
            setSelectedHour(value);
            if (selectedMinute) {
                setTime(`${value}:${selectedMinute}`);
            } else {
                // Default to 00 if minute not selected yet
                setSelectedMinute('00');
                setTime(`${value}:00`);
            }
        } else {
            setSelectedMinute(value);
            if (selectedHour) {
                setTime(`${selectedHour}:${value}`);
            } else {
                // Default to current hour or 09 if not selected
                const currentHour = new Date().getHours().toString().padStart(2, '0');
                setSelectedHour(currentHour);
                setTime(`${currentHour}:${value}`);
            }
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !time && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {time ? time : <span>Pick a time</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex h-[300px] divide-x">
                    {/* Hours Column */}
                    <div className="flex flex-col overflow-y-auto px-2 py-2 w-20 no-scrollbar">
                        <div className="mb-2 text-xs font-medium text-center text-muted-foreground">Hour</div>
                        {hours.map((hour) => (
                            <Button
                                key={hour}
                                variant={selectedHour === hour ? "default" : "ghost"}
                                className="justify-center h-8 mb-1 shrink-0"
                                onClick={() => handleTimeSelect('hour', hour)}
                            >
                                {hour}
                            </Button>
                        ))}
                    </div>

                    {/* Minutes Column */}
                    <div className="flex flex-col overflow-y-auto px-2 py-2 w-20 no-scrollbar">
                        <div className="mb-2 text-xs font-medium text-center text-muted-foreground">Minute</div>
                        {minutes.map((minute) => (
                            <Button
                                key={minute}
                                variant={selectedMinute === minute ? "default" : "ghost"}
                                className="justify-center h-8 mb-1 shrink-0"
                                onClick={() => handleTimeSelect('minute', minute)}
                            >
                                {minute}
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
