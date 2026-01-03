import React, { useState, useEffect } from 'react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from 'src/components/ui/searchable-select';

interface VehicleFormProps {
    vehicleId?: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ vehicleId, initialData, onSuccess, onCancel }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Dropdown Data
    const [ownedByOptions, setOwnedByOptions] = useState<{ value: string, label: string }[]>([]);
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState<{ value: string, label: string }[]>([]);
    const [agentOptions, setAgentOptions] = useState<{ value: string, label: string }[]>([]);
    const [ownerOptions, setOwnerOptions] = useState<{ value: string, label: string }[]>([]);

    const [formData, setFormData] = useState({
        vehical: '',
        number: '',
        driver: '',
        drivercontact: '',
        ownedby: '',
        profile_id: '',
        customer_id: '',
        details: ''
    });

    useEffect(() => {
        fetchFormData();
        if (initialData) {
            setFormData({
                vehical: initialData.vehical || '',
                number: initialData.number || '',
                driver: initialData.driver || '',
                drivercontact: initialData.drivercontact || '',
                ownedby: initialData.ownedby || '',
                profile_id: initialData.profile_id ? initialData.profile_id.toString() : '',
                customer_id: initialData.customer_id ? initialData.customer_id.toString() : '',
                details: initialData.details || ''
            });
        }
    }, [initialData]);

    const fetchFormData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicals/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                if (text.startsWith('[]') && text.length > 2) {
                    text = text.substring(2);
                }

                try {
                    const data = JSON.parse(text);
                    setOwnedByOptions(data.ownedby.map((item: any) => ({ value: item.name, label: item.name })));
                    setVehicleTypeOptions(data.vehicals.map((item: any) => ({ value: item.name, label: item.name })));
                    setAgentOptions(data.agents.map((item: any) => ({ value: item.id.toString(), label: `${item.agent_code} : ${item.name}` })));
                    setOwnerOptions(data.owners.map((item: any) => ({ value: item.id.toString(), label: `${item.code} - ${item.name} ${item.organization}` })));
                } catch (e) {
                    console.error("JSON Parse Error in fetchFormData:", e, "Raw Text:", text);
                }
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
        } finally {
            setFetchingData(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Reset logic when ownedby changes
        if (field === 'ownedby') {
            if (value === 'Promoter') {
                setFormData(prev => ({ ...prev, [field]: value, customer_id: '' }));
            } else {
                setFormData(prev => ({ ...prev, [field]: value, profile_id: '' }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const url = vehicleId
            ? `${API_BASE_URL}/vehicals/${vehicleId}`
            : `${API_BASE_URL}/vehicals`;

        const method = vehicleId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSuccess();
            } else {
                console.error("Failed to save vehicle");
                // Handle errors (maybe show toast)
            }
        } catch (error) {
            console.error("Error saving vehicle:", error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h4 className="text-lg font-medium border-b pb-2 mb-4">Vehicle Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Vehicle Type *</Label>
                        <SearchableSelect
                            options={vehicleTypeOptions}
                            value={formData.vehical}
                            onChange={(val) => handleChange('vehical', val)}
                            placeholder="Select Vehicle Type"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="number">Vehicle Number *</Label>
                        <Input
                            id="number"
                            required
                            placeholder="Enter Vehicle Number"
                            value={formData.number}
                            onChange={(e) => handleChange('number', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="driver">Driver Name *</Label>
                        <Input
                            id="driver"
                            required
                            placeholder="Enter Driver Name"
                            value={formData.driver}
                            onChange={(e) => handleChange('driver', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="drivercontact">Driver Contact *</Label>
                        <Input
                            id="drivercontact"
                            required
                            placeholder="Enter Driver Contact"
                            value={formData.drivercontact}
                            onChange={(e) => handleChange('drivercontact', e.target.value)}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Owned By *</Label>
                        <SearchableSelect
                            options={ownedByOptions}
                            value={formData.ownedby}
                            onChange={(val) => handleChange('ownedby', val)}
                            placeholder="Select Owner Type"
                        />
                    </div>

                    {formData.ownedby === 'Promoter' && (
                        <div className="space-y-2">
                            <Label>Promoter / Agent *</Label>
                            <SearchableSelect
                                options={agentOptions}
                                value={formData.profile_id}
                                onChange={(val) => handleChange('profile_id', val)}
                                placeholder="Select Promoter"
                                searchPlaceholder="Search Agent..."
                            />
                        </div>
                    )}

                    {formData.ownedby && formData.ownedby !== 'Promoter' && (
                        <div className="space-y-2">
                            <Label>Vehicle Owner *</Label>
                            <SearchableSelect
                                options={ownerOptions}
                                value={formData.customer_id}
                                onChange={(val) => handleChange('customer_id', val)}
                                placeholder="Select Owner"
                                searchPlaceholder="Search Owner..."
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="details">Details</Label>
                        <Textarea
                            id="details"
                            placeholder="Enter details..."
                            value={formData.details}
                            onChange={(e) => handleChange('details', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default VehicleForm;
