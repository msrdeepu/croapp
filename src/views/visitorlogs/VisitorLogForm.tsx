import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from 'src/components/ui/date-picker';
import { TimePicker } from 'src/components/ui/time-picker';
import { Textarea } from 'src/components/ui/textarea';

interface VisitorLogFormProps {
    logId?: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const VisitorLogForm = ({ logId, initialData, onSuccess, onCancel }: VisitorLogFormProps) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // Dropdown Data
    const [branches, setBranches] = useState<any[]>([]);
    const [visitorTypes, setVisitorTypes] = useState<any[]>([]);

    // Suggestions
    const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
    const [personSuggestions, setPersonSuggestions] = useState<string[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        branch_id: '',
        visitor_type: '',
        name: '',
        contact: '',
        date: new Date(),
        time: '',
        person_to_meet: '',
        purpose: '',
        last_visit: undefined as Date | undefined,
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchFormData();
            if (initialData) {
                populateForm(initialData);
            } else if (logId) {
                await fetchLogDetails(logId);
            }
            setLoading(false);
        };
        init();
    }, [logId, initialData]);

    const fetchFormData = async () => {
        setFetchingData(true);
        try {
            const response = await fetch(`${API_BASE_URL}/visitor-logs/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else throw e;
                }
                setBranches(data.branches || []);
                setVisitorTypes(data.visitor_types || []);
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
        } finally {
            setFetchingData(false);
        }
    };

    const fetchLogDetails = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/visitor-logs/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else throw e;
                }
                // Handle potential nested data structure { data: {...} }
                const logData = data.data || data;
                populateForm(logData);
            }
        } catch (error) {
            console.error("Error fetching log details:", error);
        }
    };

    const populateForm = (data: any) => {
        setFormData({
            branch_id: data.branch_id?.toString() || '',
            visitor_type: data.visitor_type || '',
            name: data.name || '',
            contact: data.contact || '',
            date: data.date ? new Date(data.date) : new Date(),
            time: data.time || '',
            person_to_meet: data.person_to_meet || '',
            purpose: data.purpose || '',
            last_visit: data.last_visit ? new Date(data.last_visit) : undefined,
        });

        // Trigger fetches for suggestions if needed, though they usually run on change
        if (data.visitor_type) fetchVisitorSuggestions(data.visitor_type);
        if (data.branch_id) fetchPersonSuggestions(data.branch_id);
    };

    const fetchVisitorSuggestions = async (type: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/visitor-logs/visitor-suggestions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type })
            });
            if (response.ok) {
                const text = await response.text();
                let names;
                try {
                    names = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        names = JSON.parse(text.substring(2));
                    } else throw e;
                }
                setNameSuggestions(names);
            }
        } catch (error) {
            console.error("Error fetching visitor suggestions:", error);
        }
    };

    const fetchPersonSuggestions = async (branchId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/visitor-logs/person-suggestions?branchId=${branchId}`, { // Changed to GET/POST depending on API, assuming POST based on user provided code but API controller snippet used POST
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ branchId })
            });
            if (response.ok) {
                const text = await response.text();
                let names;
                try {
                    names = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        names = JSON.parse(text.substring(2));
                    } else throw e;
                }
                setPersonSuggestions(names);
            }
        } catch (error) {
            console.error("Error fetching person suggestions:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'visitor_type') {
            fetchVisitorSuggestions(value);
        }
        if (name === 'branch_id') {
            fetchPersonSuggestions(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                date: formData.date ? format(formData.date, 'yyyy-MM-dd') : null,
                last_visit: formData.last_visit ? format(formData.last_visit, 'yyyy-MM-dd') : null,
            };

            const url = logId
                ? `${API_BASE_URL}/visitor-logs/${logId}`
                : `${API_BASE_URL}/visitor-logs`;

            const method = logId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onSuccess();
            } else {
                const errorData = await response.json();
                alert(`Failed to save log: ${errorData.message || JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="p-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /> Loading data...</div>;

    const branchOptions = branches.map(b => ({ value: b.id.toString(), label: `${b.code} - ${b.location}` }));
    const visitorTypeOptions = visitorTypes.map(v => ({ value: v.value, label: v.name }));

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visitor Type */}
                <div className="space-y-2">
                    <Label htmlFor="visitor_type">Select Visitor Type *</Label>
                    <SearchableSelect
                        options={visitorTypeOptions}
                        value={formData.visitor_type}
                        onChange={(val) => handleSelectChange('visitor_type', val)}
                        placeholder="Select Visitor Type"
                        searchPlaceholder="Search Type..."
                    />
                </div>

                {/* Branch */}
                <div className="space-y-2">
                    <Label htmlFor="branch_id">Select Branch *</Label>
                    <SearchableSelect
                        options={branchOptions}
                        value={formData.branch_id}
                        onChange={(val) => handleSelectChange('branch_id', val)}
                        placeholder="Select Branch"
                        searchPlaceholder="Search Branch..."
                    />
                </div>

                {/* Name */}
                <div className="space-y-2 relative">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter Visitor Name"
                        list="name-suggestions"
                        required
                    />
                    <datalist id="name-suggestions">
                        {nameSuggestions.map((name, i) => (
                            <option key={i} value={name} />
                        ))}
                    </datalist>
                </div>

                {/* Person to Meet */}
                <div className="space-y-2">
                    <Label htmlFor="person_to_meet">Person to Meet *</Label>
                    <Input
                        id="person_to_meet"
                        name="person_to_meet"
                        value={formData.person_to_meet}
                        onChange={handleInputChange}
                        placeholder="Enter Person to Meet"
                        list="person-suggestions"
                        required
                    />
                    <datalist id="person-suggestions">
                        {personSuggestions.map((name, i) => (
                            <option key={i} value={name} />
                        ))}
                    </datalist>
                </div>

                {/* Contact */}
                <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number *</Label>
                    <Input id="contact" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="Enter Contact Number" required />
                </div>

                {/* Date */}
                <div className="space-y-2">
                    <Label>Date *</Label>
                    <DatePicker
                        date={formData.date}
                        setDate={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                    />
                </div>

                {/* Time */}
                <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <TimePicker
                        time={formData.time}
                        setTime={(time) => setFormData(prev => ({ ...prev, time }))}
                    />
                </div>

                {/* Last Visit */}
                <div className="space-y-2">
                    <Label>Last Visit</Label>
                    <DatePicker
                        date={formData.last_visit}
                        setDate={(date) => setFormData(prev => ({ ...prev, last_visit: date }))}
                    />
                </div>

                {/* Purpose */}
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="purpose">Purpose *</Label>
                    <Textarea
                        id="purpose"
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Enter Purpose"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Log
                </Button>
            </div>
        </form>
    );
};

export default VisitorLogForm;
