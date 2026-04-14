
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
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useI18n } from '@/lib/i18n'

interface BookAppointmentModalProps {
    doctorId: Id<"doctors">;
    doctorName: string;
    department: string;
}

export function BookAppointmentModal({ doctorId, doctorName, department }: BookAppointmentModalProps) {
    const { isSignedIn } = useAuth();
    const { t } = useI18n();
    const patientProfile = useQuery(api.patientProfiles.getMyPatientProfile);
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
            
            toast.success(t('booking_success'));
            setIsOpen(false);
            setNotes("");
            setSelectedTime(null);
            setDate(undefined);
        } catch (error) {
            console.error("Failed to book appointment", error);
            const errorMessage = (error as Error)?.message || t('booking_error');
            
            if (errorMessage.includes("ملف") || errorMessage.includes("profile")) {
                toast.error(t('booking_profile_first_hint'));
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSignedIn) {
        return (
            <div className="w-full">
                <SignInButton mode="modal" fallbackRedirectUrl="/appointments">
                    <div className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-sm transition-all duration-200 shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:shadow-lg p-3 cursor-pointer flex items-center justify-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {t('booking_signin')}
                    </div>
                </SignInButton>
            </div>
        );
    }

    // إذا لم يكن لديه ملف شخصي
    if (!patientProfile) {
        return (
            <div className="w-full">
                <Link href="/patient-profile" className="block w-full">
                    <div className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full text-sm transition-all duration-200 shadow-sm shadow-amber-600/20 hover:shadow-amber-600/40 hover:shadow-lg gap-2 p-3 cursor-pointer flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                        {t('booking_profile_first_btn')}
                    </div>
                </Link>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2 text-center">
                    {t('booking_profile_first_hint')}
                </p>
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="w-full">
                <div className="w-full bg-primary hover:bg-primary/90 text-white rounded-full text-sm transition-all duration-200 shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:shadow-lg gap-2 p-3 cursor-pointer flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4" />
                    {t('booking_signin')}
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t('booking_title')}</DialogTitle>
                    <DialogDescription>
                        {t('booking_description')} {doctorName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Date Selection */}
                    <div className="flex flex-col gap-2">
                        <Label>{t('booking_select_date')}</Label>
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
                            <Label>{t('booking_select_time')}</Label>
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

                    {/* Notes Section */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="notes">{t('booking_notes')}</Label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('booking_notes_placeholder')}
                            className="border rounded-md p-2 text-sm resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                   
                    <Button 
                        onClick={handleBook} 
                        disabled={!date || !selectedTime || isLoading}
                        className="w-full"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? t('booking_loading') : t('booking_confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}