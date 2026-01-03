import React, { useState, useEffect } from 'react';
import { DatePicker } from 'src/components/ui/date-picker';
import { format } from 'date-fns';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Loader2 } from 'lucide-react';

interface LeadFormProps {
    leadId?: number; // If present, Edit mode
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

interface DropdownData {
    id: string | number;
    name?: string;
    value?: string; // For budget/source/status
    title?: string;
    location?: string;
    code?: string;
}

import { SearchableSelect } from 'src/components/ui/searchable-select';

const LeadForm: React.FC<LeadFormProps> = ({ leadId, initialData, onSuccess, onCancel }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: '',
        mobile: '',
        email: '',
        sitevisiton: '',
        budget: '',
        source: '',
        status: 'Requested Site Visit', // Default
        oneventure_id: '',
        oneproperty_id: '',
        twoventure_id: '',
        twoproperty_id: '',
        threeventure_id: '',
        threeproperty_id: '',
        fourventure_id: '',
        fourproperty_id: '',
        notes: '',
    });

    // Dropdown States
    const [budgets, setBudgets] = useState<DropdownData[]>([]);
    const [sources, setSources] = useState<DropdownData[]>([]);
    const [statuses, setStatuses] = useState<DropdownData[]>([]);
    const [ventures, setVentures] = useState<DropdownData[]>([]);

    // Dynamic Property Options per Venture
    const [oneProps, setOneProps] = useState<DropdownData[]>([]);
    const [twoProps, setTwoProps] = useState<DropdownData[]>([]);
    const [threeProps, setThreeProps] = useState<DropdownData[]>([]);
    const [fourProps, setFourProps] = useState<DropdownData[]>([]);

    // Visibility toggle for "More Ventures"
    const [showMoreVentures, setShowMoreVentures] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await fetchMetadata();

            if (leadId) {
                // If editing, fetch full details for this lead
                fetchLeadDetails(leadId);
            } else if (initialData) {
                // Determine if we need to show extra ventures based on initialData
                // (Only for non-edit cases or if we relied on it)
                setFormData({ ...initialData });
                if (initialData.twoventure_id || initialData.threeventure_id || initialData.fourventure_id) {
                    setShowMoreVentures(true);
                }
                // Trigger property fetches for initial selections
                if (initialData.oneventure_id) fetchProperties(initialData.oneventure_id, setOneProps);
            }
        };
        loadData();
    }, [leadId, initialData]);

    const fetchLeadDetails = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                // Sanitizing response: remove '[]' prefix if present
                if (text.startsWith('[]')) {
                    text = text.substring(2);
                }

                try {
                    const data = JSON.parse(text);
                    console.log("Edit Mode - Fetched Data:", data); // Debug Log

                    // Normalize ID types to strings for consistency with SearchableSelect
                    const normalizedData = { ...data };
                    ['oneventure_id', 'oneproperty_id', 'twoventure_id', 'twoproperty_id',
                        'threeventure_id', 'threeproperty_id', 'fourventure_id', 'fourproperty_id'].forEach(key => {
                            if (normalizedData[key] !== undefined && normalizedData[key] !== null) {
                                normalizedData[key] = normalizedData[key].toString();
                            }
                        });

                    setFormData(normalizedData);

                    // Show more ventures if they exist in the fetched data
                    if (normalizedData.twoventure_id || normalizedData.threeventure_id || normalizedData.fourventure_id) {
                        setShowMoreVentures(true);
                    }

                    // Fetch properties for populated ventures
                    if (normalizedData.oneventure_id) {
                        console.log("Triggering fetch properties for Venture 1:", normalizedData.oneventure_id);
                        fetchProperties(normalizedData.oneventure_id, setOneProps);
                    }
                    if (normalizedData.twoventure_id) fetchProperties(normalizedData.twoventure_id, setTwoProps);
                    if (normalizedData.threeventure_id) fetchProperties(normalizedData.threeventure_id, setThreeProps);
                    if (normalizedData.fourventure_id) fetchProperties(normalizedData.fourventure_id, setFourProps);
                } catch (jsonError) {
                    console.error("JSON Parse Error in fetchLeadDetails:", jsonError);
                }
            }
        } catch (error) {
            console.error("Error fetching lead details:", error);
        }
    };

    const fetchMetadata = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/leads/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                // Sanitizing response: remove '[]' prefix if present
                if (text.startsWith('[]')) {
                    text = text.substring(2);
                }
                try {
                    const data = JSON.parse(text);
                    setBudgets(data.budgets || []);
                    setSources(data.source || []);
                    setStatuses(data.status || []);
                    setVentures(data.ventures || []);
                } catch (jsonError) {
                    console.error("JSON Parse Error in form-data:", jsonError);
                }
            }
        } catch (error) {
            console.error("Error fetching form metadata:", error);
        }
    };

    const fetchProperties = async (ventureId: string, setFn: React.Dispatch<React.SetStateAction<DropdownData[]>>) => {
        if (!ventureId) {
            setFn([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/leads/properties/${ventureId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                // Sanitizing response: remove '[]' prefix if present
                if (text.startsWith('[]')) {
                    text = text.substring(2);
                }
                try {
                    const data = JSON.parse(text);
                    setFn(data);
                } catch (jsonError) {
                    console.error(`JSON Parse Error in properties/${ventureId}:`, jsonError);
                }
            }
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));

        // Handle dependent logic for ventures
        if (field === 'oneventure_id') {
            setFormData((prev: any) => ({ ...prev, oneproperty_id: '' })); // Reset property
            fetchProperties(value, setOneProps);
        }
        if (field === 'twoventure_id') {
            setFormData((prev: any) => ({ ...prev, twoproperty_id: '' }));
            fetchProperties(value, setTwoProps);
        }
        if (field === 'threeventure_id') {
            setFormData((prev: any) => ({ ...prev, threeproperty_id: '' }));
            fetchProperties(value, setThreeProps);
        }
        if (field === 'fourventure_id') {
            setFormData((prev: any) => ({ ...prev, fourproperty_id: '' }));
            fetchProperties(value, setFourProps);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = leadId ? `${API_BASE_URL}/leads/${leadId}` : `${API_BASE_URL}/leads`;
            const method = leadId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                onSuccess();
            } else {
                console.error("Failed to save lead");
                // TODO: Handle validation errors
            }
        } catch (error) {
            console.error("Error saving lead:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper options mappers
    const budgetOptions = budgets.map(b => ({ value: b.value || '', label: b.name || '' }));
    const sourceOptions = sources.map(s => ({ value: s.value || '', label: s.name || '' }));
    const statusOptions = statuses.map(s => ({ value: s.value || '', label: s.name || '' }));
    const ventureOptions = ventures.map(v => ({ value: v.id.toString(), label: `${v.title} - ${v.location}` }));

    // Property options need to be mapped dynamically
    const onePropOptions = oneProps.map(p => ({ value: p.id.toString(), label: `${p.code} : ${p.title}` }));
    const twoPropOptions = twoProps.map(p => ({ value: p.id.toString(), label: `${p.code} : ${p.title}` }));
    const threePropOptions = threeProps.map(p => ({ value: p.id.toString(), label: `${p.code} : ${p.title}` }));
    const fourPropOptions = fourProps.map(p => ({ value: p.id.toString(), label: `${p.code} : ${p.title}` }));

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" required value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Full Name" />
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input id="mobile" required value={formData.mobile} onChange={e => handleChange('mobile', e.target.value)} placeholder="Contact Number" />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="Email Address" />
                </div>



                {/* Site Visit */}
                <div className="space-y-2">
                    <Label htmlFor="sitevisiton">Site Visit On *</Label>
                    <DatePicker
                        date={formData.sitevisiton ? new Date(formData.sitevisiton) : undefined}
                        setDate={(date) => handleChange('sitevisiton', date ? format(date, "yyyy-MM-dd HH:mm:ss") : '')}
                        placeholder="Pick a date"
                    />
                </div>

                {/* Budget */}
                <div className="space-y-2">
                    <Label>Budget</Label>
                    <SearchableSelect
                        options={budgetOptions}
                        value={formData.budget}
                        onChange={(val) => handleChange('budget', val)}
                        placeholder="Select Budget"
                    />
                </div>

                {/* Source */}
                <div className="space-y-2">
                    <Label>Source</Label>
                    <SearchableSelect
                        options={sourceOptions}
                        value={formData.source}
                        onChange={(val) => handleChange('source', val)}
                        placeholder="Select Source"
                    />
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label>Status</Label>
                    <SearchableSelect
                        options={statusOptions}
                        value={formData.status}
                        onChange={(val) => handleChange('status', val)}
                        placeholder="Select Status"
                    />
                </div>
            </div>

            {/* Venture 1 */}
            <div className="border p-3 rounded-md space-y-3 bg-gray-50">
                <h4 className="font-medium text-sm">Venture & Plot 1 *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Venture</Label>
                        <SearchableSelect
                            options={ventureOptions}
                            value={formData.oneventure_id}
                            onChange={(val) => handleChange('oneventure_id', val)}
                            placeholder="Select Venture"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Property</Label>
                        <SearchableSelect
                            options={onePropOptions}
                            value={formData.oneproperty_id} // Normalized to string in fetchLeadDetails
                            onChange={(val) => handleChange('oneproperty_id', val)}
                            placeholder="Select Property"
                        />
                    </div>
                </div>
            </div>

            {!showMoreVentures ? (
                <Button type="button" variant="outline" className="w-full text-cyan-600 border-cyan-200" onClick={() => setShowMoreVentures(true)}>
                    + More Ventures
                </Button>
            ) : (
                <div className="space-y-4">
                    {/* Venture 2 */}
                    <div className="border p-3 rounded-md space-y-3 bg-gray-50">
                        <h4 className="font-medium text-sm">Venture & Plot 2</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Venture</Label>
                                <SearchableSelect
                                    options={ventureOptions}
                                    value={formData.twoventure_id}
                                    onChange={(val) => handleChange('twoventure_id', val)}
                                    placeholder="Select Venture"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Property</Label>
                                <SearchableSelect
                                    options={twoPropOptions}
                                    value={formData.twoproperty_id}
                                    onChange={(val) => handleChange('twoproperty_id', val)}
                                    placeholder="Select Property"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Venture 3 */}
                    <div className="border p-3 rounded-md space-y-3 bg-gray-50">
                        <h4 className="font-medium text-sm">Venture & Plot 3</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Venture</Label>
                                <SearchableSelect
                                    options={ventureOptions}
                                    value={formData.threeventure_id}
                                    onChange={(val) => handleChange('threeventure_id', val)}
                                    placeholder="Select Venture"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Property</Label>
                                <SearchableSelect
                                    options={threePropOptions}
                                    value={formData.threeproperty_id}
                                    onChange={(val) => handleChange('threeproperty_id', val)}
                                    placeholder="Select Property"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Venture 4 */}
                    <div className="border p-3 rounded-md space-y-3 bg-gray-50">
                        <h4 className="font-medium text-sm">Venture & Plot 4</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Venture</Label>
                                <SearchableSelect
                                    options={ventureOptions}
                                    value={formData.fourventure_id}
                                    onChange={(val) => handleChange('fourventure_id', val)}
                                    placeholder="Select Venture"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Property</Label>
                                <SearchableSelect
                                    options={fourPropOptions}
                                    value={formData.fourproperty_id}
                                    onChange={(val) => handleChange('fourproperty_id', val)}
                                    placeholder="Select Property"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Lead
                </Button>
            </div>
        </form>
    );
};

export default LeadForm;
