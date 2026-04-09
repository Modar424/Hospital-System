import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Id } from "@/convex/_generated/dataModel";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";

interface BookAppointmentModalProps {
    doctorId: Id<"doctors">;
    doctorName: string;
    department: string;
}

export function BookAppointmentModal({ doctorId, doctorName, department }: BookAppointmentModalProps) {
    const { isSignedIn } = useAuth();
    const TIME_SLOTS = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00"
    ];
    
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notes, setNotes] = useState("");
    
    const createAppointment = useMutation(api.appointments.createAppointment);

    const handleBook = async () => {
        if (!date || !selectedTime) return;
        
        setIsLoading(true);
        try {
            // Combine date and time
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const appointmentDate = new Date(date);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await createAppointment({
                doctorId,
                date: appointmentDate.toISOString(),
                notes,
                department,
            });
            
            toast.success("Appointment booked successfully!");
            setIsOpen(false);
            setNotes("");
            setSelectedTime(null);
            setDate(undefined);
        } catch (error) {
            console.error("Failed to book appointment", error);
            toast.error("Failed to book appointment. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {!isSignedIn ? (
                <SignInButton mode="modal">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-sm transition-all duration-200 shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:shadow-lg">
                        {<CalendarIcon className="mr-2 w-4 h-4" />} Book Appointment
                    </Button>
                </SignInButton>
            ) : (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger>
                        <span className={cn(
                            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                            "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                            "h-11 rounded-md px-8 text-lg flex-1 md:flex-none"
                        )}>
                            <CalendarIcon className="mr-2 w-5 h-5" /> Book Appointment
                        </span>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-425px">
                <DialogHeader>
                    <DialogTitle>Book Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a visit with Dr. {doctorName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Date Selection */}
                    <div className="flex flex-col gap-2">
                        <Label>Select Date</Label>
                        <div className="border rounded-md p-2 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                }}
                                initialFocus
                            />
                        </div>
                    </div>

                    {/* Time Selection */}
                    {date && (
                        <div className="flex flex-col gap-2">
                            <Label>Select Time</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {TIME_SLOTS.map((time) => (
                                    <Button
                                        key={time}
                                        type="button"
                                        variant={selectedTime === time ? "default" : "outline"}
                                        className={cn("text-sm", selectedTime === time && "border-primary")}
                                        onClick={() => setSelectedTime(time)}
                                        size="sm"
                                    >
                                        {time}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBook} 
                        disabled={!date || !selectedTime || isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Booking
                    </Button>
                </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}