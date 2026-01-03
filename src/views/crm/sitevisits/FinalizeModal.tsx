import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ENDPOINTS } from 'src/config';
import { useAuth } from 'src/context/AuthContext';
import { SearchableSelect } from 'src/components/ui/searchable-select';

interface FinalizeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (message?: string) => void;
    visit: any;
    statusOptions: any[];
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ isOpen, onClose, onSuccess, visit, statusOptions }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        distance: '',
        rent: '',
        fuel: '',
        betta: '', // Driver Tips
        tips: '', // Other Tips
        food: '',
        tolls: '',
        otherexpense: '',
        status: '',
        details: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(ENDPOINTS.SITE_VISITS.FINAL_STATUS(visit.id), {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess('Site visit finalized successfully');
                onClose();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Finalize error:', error);
            alert('Error updating final status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Finalize Site Visit</DialogTitle>
                    <DialogDescription>
                        Complete the details below to finalize the site visit.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Total Distance (KMs) *</Label>
                            <Input name="distance" value={formData.distance} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Rent Amount</Label>
                            <Input name="rent" value={formData.rent} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fuel Charges</Label>
                            <Input name="fuel" value={formData.fuel} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Driver Tips (Betta)</Label>
                            <Input name="betta" value={formData.betta} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Other Tips</Label>
                            <Input name="tips" value={formData.tips} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Food/Snacks</Label>
                            <Input name="food" value={formData.food} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Toll/RTO Charges</Label>
                            <Input name="tolls" value={formData.tolls} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Other Expenses</Label>
                            <Input name="otherexpense" value={formData.otherexpense} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Final Status *</Label>
                        <SearchableSelect
                            options={statusOptions.map((s: any) => ({
                                value: typeof s === 'string' ? s : s.name || s.status || s.value || s.setting || s.key || s.title || s.id,
                                label: typeof s === 'string' ? s : s.name || s.status || s.value || s.setting || s.key || s.title || s.label
                            }))}
                            value={formData.status}
                            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            placeholder="-- Select Status --"
                            searchPlaceholder="Search status..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Details</Label>
                        <Textarea name="details" value={formData.details} onChange={handleChange} rows={3} />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save & Close
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FinalizeModal;
