import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { RadioGroup, RadioGroupItem } from "src/components/ui/radio-group";
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from 'src/components/ui/date-picker';

interface VehicleOwnerFormProps {
    ownerId?: number;
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const VehicleOwnerForm = ({ ownerId, initialData, onSuccess, onCancel }: VehicleOwnerFormProps) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // Dropdown Data
    const [branches, setBranches] = useState<any[]>([]);
    const [countries, setCountries] = useState<any[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);

    // Photo Preview State
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        fullname: '',
        surname: '',
        organization: '',
        branch_id: '',
        code: '',
        dob: undefined as Date | undefined,
        mobile: '',
        phone: '',
        altmobile: '',
        whatsapp: '',
        email: '',
        website: '',
        pan: '',
        aadhar: '',
        taxid: '',
        joined_on: undefined as Date | undefined,
        address: '',
        country: '',
        state: '',
        district: '',
        pincode: '',
        enabled: '1',
        login: '0',
        photo: null as File | null,
    });

    const populateForm = async (data: any) => {
        setFetchingData(true);
        // We might need to fetch states/districts based on country/state if they exist
        if (data.country) await fetchGeoData('country', data.country);
        if (data.state) await fetchGeoData('state', data.state);

        setFormData({
            fullname: data.fullname || '',
            surname: data.surname || '',
            organization: data.organization || '',
            branch_id: data.branch_id?.toString() || '',
            code: data.code || '',
            dob: data.dob ? new Date(data.dob) : undefined,
            mobile: data.mobile || '',
            phone: data.phone || '',
            altmobile: data.altmobile || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            website: data.website || '',
            pan: data.pan || '',
            aadhar: data.aadhar || '',
            taxid: data.taxid || '',
            joined_on: data.joined_on ? new Date(data.joined_on) : undefined,
            address: data.address || '',
            country: data.country?.toString() || '',
            state: data.state?.toString() || '',
            district: data.district?.toString() || '',
            pincode: data.pincode || '',
            enabled: data.enabled?.toString() || '1',
            login: data.login?.toString() || '0',
            photo: null, // File input can't be pre-filled securely
        });

        // precise set for photo preview if data.photo exists
        if (data.photo) {
            setPhotoPreview(data.photo);
        }

        setFetchingData(false);
    };

    // ... (fetchGeoData and other handlers)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, photo: file }));
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    // ... (handleSubmit)

    // ... (JSX)



    useEffect(() => {
        const init = async () => {
            setLoading(true); // Initial load state
            await fetchDropdownData();
            if (initialData) {
                populateForm(initialData);
            } else if (ownerId) {
                await fetchOwnerDetails(ownerId);
            }
            setLoading(false);
        };
        init();
    }, [ownerId, initialData]);

    const fetchOwnerDetails = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicle-owners/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                // Basic robust parse check
                if (text.startsWith('[]') && text.length > 2) text = text.substring(2);
                const data = JSON.parse(text);
                populateForm(data.data || data);
            }
        } catch (error) {
            console.error("Error fetching owner details:", error);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/vehicle-owners/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                // Basic robust parse check
                if (text.startsWith('[]') && text.length > 2) text = text.substring(2);
                const data = JSON.parse(text);

                setBranches(data.branches || []);
                setCountries(data.countries || []);

                if (!initialData) {
                    setFormData(prev => ({ ...prev, code: data.new_code }));
                }
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
        }
    };



    const fetchGeoData = async (type: 'country' | 'state', id: string) => {
        if (!id) return;
        try {
            const body = type === 'country' ? { country_id: id } : { state_id: id };
            const response = await fetch(`${API_BASE_URL}/vehicle-owners/geo-data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (response.ok) {
                let text = await response.text();
                // Basic robust parse check
                if (text.startsWith('[]') && text.length > 2) text = text.substring(2);
                const data = JSON.parse(text);

                if (type === 'country') {
                    setStates(data.states || []);
                    setDistricts([]); // Reset districts when country changes
                } else {
                    setDistricts(data.districts || []);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${type} data:`, error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = async (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'country') {
            await fetchGeoData('country', value);
            setFormData(prev => ({ ...prev, state: '', district: '' }));
        }
        if (name === 'state') {
            await fetchGeoData('state', value);
            setFormData(prev => ({ ...prev, district: '' }));
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    if (value instanceof Date) {
                        formDataToSend.append(key, format(value, 'yyyy-MM-dd'));
                    } else {
                        formDataToSend.append(key, value as string | Blob); // Type assertion for File
                    }
                }
            });

            // For updates via Inertia/Laravel resource controller usually PUT/PATCH is used
            // But FormData cannot send PUT directly in some setups with files?
            // Laravel method spoofing:
            if (ownerId) {
                formDataToSend.append('_method', 'PUT');
            }

            const url = ownerId
                ? `${API_BASE_URL}/vehicle-owners/${ownerId}`
                : `${API_BASE_URL}/vehicle-owners`;

            // If strictly using PUT, fetch options differ, but with _method spoofing we can use POST for update with files
            const method = ownerId ? 'POST' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type header not set manually for FormData, browser sets it with boundary
                },
                body: formDataToSend
            });

            if (response.ok) {
                onSuccess();
            } else {
                let text = await response.text();
                // Basic robust parse check
                if (text.startsWith('[]') && text.length > 2) text = text.substring(2);

                try {
                    const errorData = JSON.parse(text);
                    console.error("Submission failed:", errorData);
                    alert(`Failed to save owner: ${errorData.message || JSON.stringify(errorData) || "Check console for details."}`);
                } catch (e) {
                    console.error("Submission failed (raw):", text);
                    alert("Failed to save owner. Server returned invalid response.");
                }
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) return <div className="p-4 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /> Loading data...</div>;

    const branchOptions = branches.map(b => ({ value: b.id.toString(), label: b.location }));
    const countryOptions = countries.map(c => ({ value: c.id.toString(), label: c.name }));
    const stateOptions = states.map(s => ({ value: s.id.toString(), label: s.name }));
    const districtOptions = districts.map(d => ({ value: d.id.toString(), label: d.name }));

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-4">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" name="fullname" value={formData.fullname} onChange={handleInputChange} placeholder="Enter Full Name" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="surname">Surname</Label>
                    <Input id="surname" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="Enter Surname" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" name="organization" value={formData.organization} onChange={handleInputChange} placeholder="Enter Organization" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="branch_id">Branch *</Label>
                    <SearchableSelect
                        options={branchOptions}
                        value={formData.branch_id}
                        onChange={(val) => handleSelectChange('branch_id', val)}
                        placeholder="Select Branch"
                        searchPlaceholder="Search Branch..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input id="code" name="code" value={formData.code} readOnly className="bg-gray-100" />
                </div>

                <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <DatePicker
                        date={formData.dob}
                        setDate={(date) => setFormData(prev => ({ ...prev, dob: date }))}
                    />
                </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
                </div>
            </div>

            {/* Identification & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label htmlFor="pan">PAN No</Label>
                    <Input id="pan" name="pan" value={formData.pan} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="aadhar">Aadhar No</Label>
                    <Input id="aadhar" name="aadhar" value={formData.aadhar} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                    <Label>Joined On *</Label>
                    <DatePicker
                        date={formData.joined_on}
                        setDate={(date) => setFormData(prev => ({ ...prev, joined_on: date }))}
                    />
                </div>
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <SearchableSelect
                        options={countryOptions}
                        value={formData.country}
                        onChange={(val) => handleSelectChange('country', val)}
                        placeholder="Select Country"
                        searchPlaceholder="Search Country..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <SearchableSelect
                        options={stateOptions}
                        value={formData.state}
                        onChange={(val) => handleSelectChange('state', val)}
                        placeholder="Select State"
                        searchPlaceholder="Search State..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <SearchableSelect
                        options={districtOptions}
                        value={formData.district}
                        onChange={(val) => handleSelectChange('district', val)}
                        placeholder="Select District"
                        searchPlaceholder="Search District..."
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                    <Label>Active Status *</Label>
                    <RadioGroup
                        value={formData.enabled}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, enabled: val }))}
                        className="flex space-x-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="active-yes" />
                            <Label htmlFor="active-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="active-no" />
                            <Label htmlFor="active-no">No</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label>Photo</Label>
                    <div className="flex items-center gap-4">
                        {photoPreview && (
                            <img
                                src={photoPreview}
                                alt="Preview"
                                className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                            />
                        )}
                        <Input type="file" onChange={handleFileChange} accept="image/*" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Owner
                </Button>
            </div>
        </form>
    );
};

export default VehicleOwnerForm;
