import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { DatePicker } from 'src/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { ENDPOINTS } from 'src/config';
import { useAuth } from 'src/context/AuthContext';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message?: string) => void;
    visit: any; // The site visit object to reschedule
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, onSuccess, visit }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: visit?.date ? new Date(visit.date) : new Date(),
        starts: visit?.starts || '',
        drops: visit?.drops || '',
        details: visit?.details || '',
    });

    React.useEffect(() => {
        if (visit) {
            setFormData({
                date: visit.date ? new Date(visit.date) : new Date(),
                starts: visit.starts || '',
                drops: visit.drops || '',
                details: visit.details || '',
            });
        }
    }, [visit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visit) return;
        setLoading(true);

        try {
            // Format date
            const date = formData.date;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            const payload = {
                date: formattedDate,
                starts: formData.starts,
                drops: formData.drops,
                details: formData.details,
            };

            const response = await fetch(ENDPOINTS.SITE_VISITS.RESCHEDULE(visit.id), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onSuccess('Site visit rescheduled successfully');
                onClose();
            } else {
                alert('Failed to reschedule');
            }
        } catch (error) {
            console.error('Reschedule error:', error);
            alert('Error rescheduling visit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reschedule Site Visit</DialogTitle>
                    <DialogDescription>
                        Select a new date and update locations to reschedule this visit.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>New Date *</Label>
                        <DatePicker
                            date={formData.date}
                            setDate={(d) => setFormData({ ...formData, date: d || new Date() })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Starting Location *</Label>
                        <Input
                            value={formData.starts}
                            onChange={(e) => setFormData({ ...formData, starts: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Dropping Location *</Label>
                        <Input
                            value={formData.drops}
                            onChange={(e) => setFormData({ ...formData, drops: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Details</Label>
                        <Textarea
                            rows={2}
                            value={formData.details}
                            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                            placeholder="Add reason for rescheduling..."
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Reschedule
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default RescheduleModal;
