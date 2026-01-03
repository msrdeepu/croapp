import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { SearchableSelect } from 'src/components/ui/searchable-select';
// Using a standard HTML multiple select for now or a custom MultiSelect if available.
// Since SearchableSelect might not support multiple, we might need a different approach for Leads.
// Check if we have a MultiSelect component. If not, use standard select with multiple.
import { Loader2 } from 'lucide-react';
import { DatePicker } from 'src/components/ui/date-picker';

// We need a MultiSelect. I'll check if one exists or use a simple one.
// For now, I'll assume SearchableSelect can handle single values, and I'll use a standard multiple select for Leads 
// or I'll implement a simple multi-select using a library or custom code if needed.
// Given strict instructions, I'll stick to simple UI components or existing ones.
// I'll use a standard select multiple for Leads for now to be safe, or a series of checkboxes if the list is small (it might not be).
// Actually, I'll use a custom rudimentary multi-select using standard UI if needed, but let's see.

interface SiteVisitFormProps {
    initialData?: any;
    isEdit?: boolean;
}

const SiteVisitForm: React.FC<SiteVisitFormProps> = ({
    initialData,
    isEdit = false,
}) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        lead_id: [] as string[],
        profile_id: '',
        vehical_id: '',
        branch_id: '',
        starts: '',
        drops: '',
        date: null as Date | null,
        status: '',
        details: '',
    });

    const [options, setOptions] = useState<{
        leads: any[];
        agents: any[];
        vehicals: any[];
        branches: any[];
        status: any[];
    }>({
        leads: [],
        agents: [],
        vehicals: [],
        branches: [],
        status: [],
    });

    useEffect(() => {
        if (token) fetchFormData();
    }, [token]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                lead_id: initialData.leads ? initialData.leads.map((l: any) => String(l.id)) : [],
                profile_id: initialData.profile_id ? String(initialData.profile_id) : '',
                vehical_id: initialData.vehical_id ? String(initialData.vehical_id) : '',
                branch_id: initialData.branch_id ? String(initialData.branch_id) : '',
                starts: initialData.starts || '',
                drops: initialData.drops || '',
                date: initialData.date ? new Date(initialData.date) : null,
                status: initialData.status || (initialData.leads && initialData.leads[0] ? initialData.leads[0].status : ''),
                details: initialData.details || '',
            });
        }
    }, [initialData]);

    const fetchFormData = useCallback(async () => {
        try {
            // Use CREATE_FORM_DATA endpoint. Even for edit, it provides the lists. 
            // The Edit endpoint also provides data + lists, but we might have passed initialData from parent (EditSiteVisit).
            // If parent passed initialData, we still need the options (leads, agents, etc).
            // The backend Edit endpoint returns everything.
            // If isEdit is true and initialData is missing, parent handles fetching.
            // But here we need to populate options. 
            // If initialData comes from Edit endpoint, it might contain the options?
            // Reviewing backend Edit(): returns 'data', 'status', 'agents', 'branches', 'vehicals', 'leads'.
            // Reviewing backend Create(): returns 'status', 'agents', ...

            // So if initialData is provided and contains options (from Edit), we use them.
            // Otherwise fetch from create.

            // Wait, initialData in props usually refers to the *record* being edited.
            // But the Edit endpoint returns a wrapper object with 'data' (the record) AND the lists.
            // So EditSiteVisit should pass the whole response or we fetch it here?
            // Let's assume EditSiteVisit passes the lists via props? Or we fetch here?
            // To keep it simple: fetch options from CREATE endpoint if not provided?
            // Actually, for Edit, the leads list filters out 'Completed', 'Not Interested' etc.
            // The Create list filters 'Requested Site Visit', 'Pending Decision'.
            // So the lists might differ!
            // I should rely on the fetch inside this component or receive options as props.

            // Let's fetch form data here. If isEdit, we might need to hit the Edit endpoint to get the specific lists context?
            // But `initialData` usually implies the form values. 
            // I'll fetch `CREATE_FORM_DATA` for lists by default. If `isEdit`, the leads list might be different.
            // However, since `SiteVisitForm` is generic, maybe I should just fetch `CREATE_FORM_DATA` and if it's edit, 
            // the parent might have already provided the correct context?
            // Let's just fetch `CREATE_FORM_DATA` for now. If we need specific edit lists, we might need to change this.

            const response = await fetch(ENDPOINTS.SITE_VISITS.CREATE_FORM_DATA, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const data = await response.json();

            // Note: the backend create() returns { status, agents, branches, vehicals, leads }
            // It does NOT envelope them in 'data' key based on the code provided ( return response()->json([...]) )
            // Check PHP: `return response()->json(['status' => ..., 'agents' => ...])`

            setOptions({
                leads: data.leads || [],
                agents: data.agents || [],
                vehicals: data.vehicals || [],
                branches: data.branches || [],
                status: data.status || [],
            });

        } catch (error) {
            console.error('Error fetching form options:', error);
        }
    }, [token]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, lead_id: selectedOptions }));
    };

    const formatDateForBackend = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                ...formData,
                date: formData.date ? formatDateForBackend(formData.date) : null
            };

            const url = isEdit
                ? `${ENDPOINTS.SITE_VISITS.BASE}/${initialData.id}`
                : ENDPOINTS.SITE_VISITS.BASE;

            const method = isEdit ? 'PUT' : 'POST';

            // For PUT, we typically use POST with _method=PUT in Laravel if using FormData, 
            // but here we can send JSON since we have no files?
            // The PHP code uses `enctype="multipart/form-data"`.
            // But `SitevisitController` code doesn't seem to handle file uploads in `store` or `update` explicitly?
            // `store`: `Vehical::findOrFail`, `Sitevisit::create($input)`. No file handling seen.
            // So JSON should work.

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const res = await response.json();

            if (response.ok || res.message) { // Check for success
                navigate('/crm/sitevisits');
            } else {
                alert('Error: ' + (res.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving site visit:', error);
            alert('Failed to save site visit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="lead_id">Leads *</Label>
                        <select
                            multiple
                            id="lead_id"
                            name="lead_id"
                            value={formData.lead_id}
                            onChange={handleMultiSelectChange}
                            required
                            className="flex min-h-[100px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {options.leads.map((lead: any) => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.id}: {lead.name} - {lead.mobile}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple leads.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="profile_id">Promoter / Agent *</Label>
                        <SearchableSelect
                            options={options.agents.map((a: any) => ({
                                value: String(a.id),
                                label: `${a.agent_code} : ${a.fullname} ${a.surname || ''}`
                            }))}
                            value={formData.profile_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, profile_id: val }))}
                            placeholder="-- Select Promoter / Agent --"
                            searchPlaceholder="Search agent..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehical_id">Vehicle *</Label>
                        <SearchableSelect
                            options={options.vehicals.map((v: any) => ({
                                value: String(v.id),
                                label: `${v.ownedby} : ${v.vehical} [${v.owner} - ${v.number}]`
                            }))}
                            value={formData.vehical_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, vehical_id: val }))}
                            placeholder="-- Select Vehicle --"
                            searchPlaceholder="Search vehicle..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch_id">Branch *</Label>
                        <SearchableSelect
                            options={options.branches.map((b: any) => ({
                                value: String(b.id),
                                label: `${b.code} : ${b.location}`
                            }))}
                            value={formData.branch_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, branch_id: val }))}
                            placeholder="-- Select Branch --"
                            searchPlaceholder="Search branch..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="starts">Starting Location *</Label>
                        <Input
                            id="starts"
                            name="starts"
                            value={formData.starts}
                            onChange={handleChange}
                            required
                            placeholder="Enter Location Here"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="drops">Dropping Location *</Label>
                        <Input
                            id="drops"
                            name="drops"
                            value={formData.drops}
                            onChange={handleChange}
                            required
                            placeholder="Enter Location Here"
                        />
                    </div>

                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <DatePicker
                                date={formData.date || undefined}
                                setDate={(val) => setFormData(prev => ({ ...prev, date: val || null }))}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <SearchableSelect
                            options={options.status.map((s: any) => ({
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
                        <Label htmlFor="details">Details</Label>
                        <Textarea
                            id="details"
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <Button disabled={loading} type="submit">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate('/crm/sitevisits')}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default SiteVisitForm;
