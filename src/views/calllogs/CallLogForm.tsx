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
import { Textarea } from 'src/components/ui/textarea';

interface CallLogFormProps {
    logId?: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const CallLogForm = ({ logId, initialData, onSuccess, onCancel }: CallLogFormProps) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // Dropdown Data
    const [employees, setEmployees] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        date: new Date(),
        from_number: '',
        person_name: '',
        purpose: '',
        person_from: '',
        type: '',
        status: '',
        employee_id: '',
        notes: '',
    });

    useEffect(() => {
        const init = async () => {
            setFetchingData(true);
            await fetchFormData();
            if (initialData) {
                populateForm(initialData);
            } else if (logId) {
                await fetchLogDetails(logId);
            }
            setFetchingData(false);
        };
        init();
    }, [logId, initialData]);

    const fetchFormData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs/form-data`, {
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

                setEmployees(data.employees || []);
                setTypes(data.types || []);
                setStatuses(data.statuses || []);
                if (data.code && !logId) {
                    setFormData(prev => ({ ...prev, code: data.code }));
                }
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };

    const fetchLogDetails = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs/${id}`, {
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
                populateForm(data);
            }
        } catch (error) {
            console.error("Error fetching log details:", error);
        }
    };

    const populateForm = (data: any) => {
        setFormData({
            code: data.code || '',
            date: data.date ? new Date(data.date) : new Date(),
            from_number: data.from_number || '',
            person_name: data.person_name || '',
            purpose: data.purpose || '',
            person_from: data.person_from || '',
            type: data.type || '',
            status: data.status || '',
            employee_id: data.employee_id?.toString() || '',
            notes: data.notes || '',
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                date: formData.date ? format(formData.date, 'yyyy-MM-dd') : null,
            };

            const url = logId
                ? `${API_BASE_URL}/call-logs/${logId}`
                : `${API_BASE_URL}/call-logs`;

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

    const employeeOptions = employees.map(e => ({ value: e.value.toString(), label: e.label }));
    const typeOptions = types.map(t => ({ value: t.value || t.name, label: t.label || t.name }));
    const statusOptions = statuses.map(s => ({ value: s.value || s.name, label: s.label || s.name }));

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <h4 className="text-lg font-semibold border-b pb-2 mb-4">Call Log Details</h4>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    {/* Code */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">Code *</Label>
                        <div className="col-span-3">
                            <Input
                                id="code"
                                name="code"
                                value={formData.code}
                                // Code is usually auto-generated on create, editable on edit if needed, or read-only
                                readOnly={false}
                                placeholder={logId ? "Enter Code" : "Auto Generated (or enter manually)"}
                                onChange={handleInputChange}
                                disabled={false}
                                className={!logId && !formData.code ? "bg-gray-100" : ""}
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date *</Label>
                        <div className="col-span-3">
                            <DatePicker
                                date={formData.date}
                                setDate={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                            />
                        </div>
                    </div>

                    {/* From Number */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="from_number" className="text-right">From Number *</Label>
                        <div className="col-span-3">
                            <Input id="from_number" name="from_number" value={formData.from_number} onChange={handleInputChange} placeholder="Enter Caller Number" required />
                        </div>
                    </div>

                    {/* Person Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="person_name" className="text-right">Person Name</Label>
                        <div className="col-span-3">
                            <Input id="person_name" name="person_name" value={formData.person_name} onChange={handleInputChange} placeholder="Enter Person Name" />
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="purpose" className="text-right">Purpose</Label>
                        <div className="col-span-3">
                            <Input id="purpose" name="purpose" value={formData.purpose} onChange={handleInputChange} placeholder="Enter Purpose" />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Person From */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="person_from" className="text-right">Person From</Label>
                        <div className="col-span-3">
                            <Input id="person_from" name="person_from" value={formData.person_from} onChange={handleInputChange} placeholder="Enter Organization / Source" />
                        </div>
                    </div>

                    {/* Type */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <div className="col-span-3">
                            <SearchableSelect
                                options={typeOptions}
                                value={formData.type}
                                onChange={(val) => handleSelectChange('type', val)}
                                placeholder="Select Type"
                                searchPlaceholder="Search Type..."
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <div className="col-span-3">
                            <SearchableSelect
                                options={statusOptions}
                                value={formData.status}
                                onChange={(val) => handleSelectChange('status', val)}
                                placeholder="Select Status"
                                searchPlaceholder="Search Status..."
                            />
                        </div>
                    </div>

                    {/* Assigned To */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="employee_id" className="text-right">Assigned To</Label>
                        <div className="col-span-3">
                            <SearchableSelect
                                options={employeeOptions}
                                value={formData.employee_id}
                                onChange={(val) => handleSelectChange('employee_id', val)}
                                placeholder="Select Employee"
                                searchPlaceholder="Search Employee..."
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right mt-2">Notes</Label>
                        <div className="col-span-3">
                            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Enter additional details" rows={3} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 pt-6 border-t mt-6">
                <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 rounded-full px-8 text-white">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {logId ? 'Update' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel} className="bg-gray-800 hover:bg-gray-900 text-white rounded-full px-8">
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default CallLogForm;
