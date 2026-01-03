
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS, API_BASE_URL } from 'src/config';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { DatePicker } from 'src/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import { Textarea } from 'src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from 'src/components/ui/radio-group';

import { Loader2, Check, ChevronsUpDown, CheckCircle, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from 'src/lib/utils';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from 'src/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'src/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs';

// Interfaces for Dropdown Data (Copied from CreateCustomer)
interface Branch {
    id: number;
    name: string;
    code: string;
    location: string;
}

interface CommonOption { // Nationality, Occupation
    id: number;
    name: string;
    value: string;
    type: string;
}

interface Country {
    id: number;
    name: string;
    code: string;
    phonecode: number;
}

interface StateObj {
    id: number;
    name: string;
}

interface District {
    id: number;
    name: string;
}

interface SearchableSelectProps {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    renderItem?: (item: any) => string;
    valueKey?: string;
}

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, renderItem, valueKey = 'id' }: SearchableSelectProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                    disabled={disabled}
                >
                    {value
                        ? options.find((item) => item[valueKey].toString() === value)?.name ||
                        (renderItem ? renderItem(options.find((item) => item[valueKey].toString() === value)) : value)
                        : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((item) => (
                                <CommandItem
                                    key={item.id} // Keep React key as ID for stability
                                    value={renderItem ? renderItem(item) : item.name}
                                    onSelect={() => {
                                        onChange(item[valueKey].toString());
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item[valueKey].toString() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {renderItem ? renderItem(item) : item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const EditCustomer = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get Customer ID from URL
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // Dropdown Data States
    const [branches, setBranches] = useState<Branch[]>([]);
    const [nationalities, setNationalities] = useState<CommonOption[]>([]);
    const [occupations, setOccupations] = useState<CommonOption[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<StateObj[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);

    // Form States
    const [customerCode, setCustomerCode] = useState('');
    const [surName, setSurName] = useState('');
    const [fullName, setFullName] = useState('');
    const [careOfRelation, setCareOfRelation] = useState('Son');
    const [careOfName, setCareOfName] = useState('');
    const [organization, setOrganization] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [panNo, setPanNo] = useState('');
    const [aadharNo, setAadharNo] = useState('');
    const [gstNo, setGstNo] = useState('');
    const [dob, setDob] = useState<Date>();

    const [mobile, setMobile] = useState('');
    const [phone, setPhone] = useState('');
    const [altMobile, setAltMobile] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');

    const [selectedOccupation, setSelectedOccupation] = useState('');
    const [selectedNationality, setSelectedNationality] = useState('');

    const [joinedOn, setJoinedOn] = useState<Date>();
    const [address, setAddress] = useState('');

    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [pincode, setPincode] = useState('');

    const [nomineeName, setNomineeName] = useState('');
    const [nomineeAddress, setNomineeAddress] = useState('');
    const [nomineeRelation, setNomineeRelation] = useState('');
    const [nomineeDob, setNomineeDob] = useState<Date>();
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    // Multi-Step Form State
    const [activeTab, setActiveTab] = useState("personal");
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    const steps = [
        { id: "personal", label: "Personal Details" },
        { id: "official", label: "Official & Identity" },
        { id: "settings", label: "Settings & Nominee" }
    ];

    const markStepComplete = (stepId: string) => {
        if (!completedSteps.includes(stepId)) {
            setCompletedSteps([...completedSteps, stepId]);
        }
    };

    const nextTab = (current: string, next: string) => {
        markStepComplete(current);
        setActiveTab(next);
    };

    const [isActive, setIsActive] = useState('yes');
    const [hasLogin, setHasLogin] = useState('no');

    // Fetch Initial Data (Dropdowns AND Customer Data)
    useEffect(() => {
        const fetchAllData = async () => {
            if (!id) return;

            try {
                // 1. Fetch Dropdown Data (Same as Create)
                const formResponse = await fetch(ENDPOINTS.LIST_ITEMS.CUSTOMER_FORM, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });

                // 2. Fetch Customer Data (Edit Endpoint)
                const customerResponse = await fetch(ENDPOINTS.CUSTOMERS.EDIT(id), { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });

                if (formResponse.ok) {
                    const text = await formResponse.text();
                    let rawData;
                    try { rawData = JSON.parse(text); } catch (e) {
                        if (text.trim().startsWith('[]')) { try { rawData = JSON.parse(text.trim().substring(2)); } catch (e2) { } }
                    }

                    if (rawData) {
                        const data = Array.isArray(rawData) ? rawData[0] : rawData;
                        const branchesData = data.branches || [];
                        const branchesArray = Array.isArray(branchesData) ? branchesData : Object.values(branchesData);

                        setBranches(branchesArray as Branch[]);
                        setNationalities(data.nationality || []);
                        setOccupations(data.occupations || []);
                        setCountries(data.countries || []);
                    }
                }

                if (customerResponse.ok) {
                    const text = await customerResponse.text();
                    let rawData;
                    try { rawData = JSON.parse(text); } catch (e) {
                        if (text.trim().startsWith('[]')) { try { rawData = JSON.parse(text.trim().substring(2)); } catch (e2) { } }
                    }

                    const custData = Array.isArray(rawData) ? rawData[0] : rawData;
                    const customer = custData.data || custData;

                    if (customer) {
                        console.log("Edit Customer Data:", customer);

                        setSurName(customer.surname || '');
                        setFullName(customer.fullname || '');
                        setCustomerCode(customer.code || '');
                        setMobile(customer.mobile || '');
                        setEmail(customer.email || '');
                        setCareOfName(customer.careof || '');
                        setCareOfRelation(customer.careof_relationship || 'Son');
                        setPanNo(customer.pan || '');
                        setAadharNo(customer.aadhar || '');
                        setGstNo(customer.taxid || '');
                        setPhone(customer.phone || '');
                        setAltMobile(customer.altmobile || '');
                        setWhatsapp(customer.whatsapp || '');
                        setWebsite(customer.website || '');
                        setAddress(customer.address || '');
                        setPincode(customer.pincode || '');
                        setOrganization(customer.organization || '');
                        setNomineeName(customer.nominee || '');
                        setNomineeAddress(customer.nominee_address || '');
                        setNomineeRelation(customer.nominee_relationship || '');
                        setIsActive(customer.enabled === 1 ? 'yes' : 'no');
                        setHasLogin(customer.login === 1 ? 'yes' : 'no');

                        if (customer.dob) setDob(new Date(customer.dob));
                        if (customer.joined_on) setJoinedOn(new Date(customer.joined_on));
                        if (customer.nominee_dob) setNomineeDob(new Date(customer.nominee_dob));

                        if (customer.branch_id) setSelectedBranch(String(customer.branch_id));
                        if (customer.occupation) setSelectedOccupation(customer.occupation);
                        if (customer.nationality) setSelectedNationality(customer.nationality);

                        // Photo
                        if (customer.photo) {
                            setPhotoPreview(customer.photo.startsWith('http') ? customer.photo : `${API_BASE_URL}/${customer.photo}`);
                        }

                        // Handle Cascading Location Data
                        // We need to set Country -> fetch States -> set State -> fetch Districts -> set District
                        // Note: This is tricky because fetching relies on state updates which are async.
                        // Ideally we should chain these calls here directly instead of relying on handleCountryChange.

                        if (customer.country) {
                            // Handle Object or ID
                            const cId = typeof customer.country === 'object' ? customer.country.id : customer.country;
                            setSelectedCountry(String(cId));

                            // Fetch States
                            try {
                                const sRes = await fetch(`${ENDPOINTS.LIST_ITEMS.STATES}/${cId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                if (sRes.ok) {
                                    const sText = await sRes.text();
                                    let sRaw = JSON.parse(sText.startsWith('[]') ? sText.substring(2) : sText);
                                    const sData = Array.isArray(sRaw) ? sRaw[0] : sRaw;
                                    if (sData?.data) {
                                        setStates(sData.data);

                                        // Now Set State
                                        if (customer.state) {
                                            const sId = typeof customer.state === 'object' ? customer.state.id : customer.state;
                                            setSelectedState(String(sId));

                                            // Fetch Districts
                                            const dRes = await fetch(`${ENDPOINTS.LIST_ITEMS.DISTRICTS}/${sId}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                            if (dRes.ok) {
                                                const dText = await dRes.text();
                                                let dRaw = JSON.parse(dText.startsWith('[]') ? dText.substring(2) : dText);
                                                const dData = Array.isArray(dRaw) ? dRaw[0] : dRaw;
                                                if (dData?.data) {
                                                    setDistricts(dData.data);
                                                    if (customer.district) {
                                                        const dId = typeof customer.district === 'object' ? customer.district.id : customer.district;
                                                        setSelectedDistrict(String(dId));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (err) { console.error("Error setting up location chain", err); }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching initial customer data:", error);
                showAlert('error', 'Load Error', 'Failed to load customer details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (token && id) fetchAllData();
    }, [token, id]);

    // Country Change Handler (reused)
    const handleCountryChange = async (countryId: string) => {
        setSelectedCountry(countryId);
        setStates([]); setDistricts([]);
        setSelectedState(''); setSelectedDistrict('');

        if (!countryId) return;
        try {
            const response = await fetch(`${ENDPOINTS.LIST_ITEMS.STATES}/${countryId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const text = await response.text();
                let rawData = JSON.parse(text.startsWith('[]') ? text.substring(2) : text);
                const data = Array.isArray(rawData) ? rawData[0] : rawData;
                if (data && data.data) setStates(data.data);
            }
        } catch (error) { console.error("Error fetching states:", error); }
    };

    // State Change Handler (reused)
    const handleStateChange = async (stateId: string) => {
        setSelectedState(stateId);
        setDistricts([]); setSelectedDistrict('');

        if (!stateId) return;
        try {
            const response = await fetch(`${ENDPOINTS.LIST_ITEMS.DISTRICTS}/${stateId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const text = await response.text();
                let rawData = JSON.parse(text.startsWith('[]') ? text.substring(2) : text);
                const data = Array.isArray(rawData) ? rawData[0] : rawData;
                if (data && data.data) setDistricts(data.data);
            }
        } catch (error) { console.error("Error fetching districts:", error); }
    };

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => removeAlert(id), 3000);
    };

    const removeAlert = (id: number) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                showAlert('error', 'Invalid File', 'Please upload a valid image file (JPEG/JPG/PNG).');
                e.target.value = '';
                return;
            }
            setPhotoFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPhotoPreview(objectUrl);
        }
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, maxLength: number = 10) => {
        const value = e.target.value;
        if (/^\d*$/.test(value) && value.length <= maxLength) setter(value);
    };

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidUrl = (url: string) => {
        if (!url) return true;
        try { new URL(url); return true; } catch { return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url); }
    };

    const handleSubmit = async () => {
        // Validation (Same as Create)
        if (!surName || !fullName || !selectedBranch || !panNo || !aadharNo || !dob || !joinedOn || !mobile || !email || !selectedCountry || !selectedState || !selectedDistrict) {
            showAlert('error', 'Validation Error', 'Please fill in all mandatory fields (marked with *).');
            return;
        }
        if (mobile.length !== 10) { showAlert('error', 'Validation Error', 'Mobile number must be exactly 10 digits.'); return; }
        if (altMobile && altMobile.length !== 10) { showAlert('error', 'Validation Error', 'Alternate Mobile number must be exactly 10 digits.'); return; }
        if (whatsapp && whatsapp.length !== 10) { showAlert('error', 'Validation Error', 'WhatsApp number must be exactly 10 digits.'); return; }
        if (phone && phone.length < 10) { showAlert('error', 'Validation Error', 'Phone number must be at least 10 digits.'); return; }
        if (!isValidEmail(email)) { showAlert('error', 'Validation Error', 'Please enter a valid email address.'); return; }
        if (website && !isValidUrl(website)) { showAlert('error', 'Validation Error', 'Please enter a valid website URL.'); return; }

        setLoading(true);
        const formData = new FormData();

        formData.append('surname', surName);
        formData.append('fullname', fullName);
        formData.append('branch_id', selectedBranch);
        formData.append('pan', panNo);
        formData.append('aadhar', aadharNo);

        const formatDate = (d: Date) => {
            const offset = d.getTimezoneOffset();
            const date = new Date(d.getTime() - (offset * 60 * 1000));
            return date.toISOString().split('T')[0];
        };

        if (dob) formData.append('dob', formatDate(dob));
        if (joinedOn) formData.append('joined_on', formatDate(joinedOn));

        formData.append('mobile', mobile);
        formData.append('email', email);
        formData.append('enabled', isActive === 'yes' ? '1' : '0');
        formData.append('login', hasLogin === 'yes' ? '1' : '0');
        formData.append('country', selectedCountry);
        formData.append('state', selectedState);
        formData.append('district', selectedDistrict);

        if (nomineeDob) formData.append('nominee_dob', formatDate(nomineeDob));
        if (photoFile) formData.append('photo', photoFile);

        formData.append('careof_relationship', careOfRelation);
        formData.append('careof', careOfName);
        formData.append('organization', organization);
        formData.append('code', customerCode);
        formData.append('taxid', gstNo);
        formData.append('phone', phone);
        formData.append('altmobile', altMobile);
        formData.append('whatsapp', whatsapp);
        formData.append('website', website);
        formData.append('address', address);
        formData.append('pincode', pincode);
        formData.append('nominee', nomineeName);
        formData.append('nominee_address', nomineeAddress);
        formData.append('nominee_relationship', nomineeRelation);
        formData.append('occupation', selectedOccupation);
        formData.append('nationality', selectedNationality);
        // Important: Add ID or Method override if needed for Laravel
        // Laravel traditionally uses hidden _method=PUT for forms, but cleaner is to POST to specific update route or PUT to resource.
        // Assuming we Post to 'store' logic but updated for editing? 
        // User asked to 'load edit view'. Saving logic might differ. 
        // I will use POST to a theoretical update endpoint: /customers/update/{id} or just use store with ID.
        // Actually, let's use the POST /customers/store but maybe it handles updates? Unlikely.
        // SAFEST BET: POST to /customers/store but add an ID field if logic supports it, OR likely we need a new route.
        // For now, I will assume the intention is just to VIEW and EDIT LOCALLY, and submission might fail until user adds update route.
        // But to be helpful, I'll point it to `create` route logic for now or hold off submitting properly.
        // WAIT: Typical Laravel Resource update is PUT /customers/{id}. I will try that. Form data with files requires POST + _method=PUT.
        formData.append('_method', 'PUT');

        try {
            // Using standard Laravel resource convention: POST to /customers/{id} with _method=PUT
            const response = await fetch(ENDPOINTS.CUSTOMERS.UPDATE(id || ''), {
                method: 'POST', // Using POST for file upload support + _method spoofing
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.ok) {
                showAlert('success', 'Success', 'Customer updated successfully!');
                setTimeout(() => {
                    navigate('/customers/manage');
                }, 2000);
            } else {
                const text = await response.text();
                try {
                    const errData = JSON.parse(text);
                    showAlert('error', 'Update Failed', errData.message || 'Failed to update customer.');
                } catch {
                    showAlert('error', 'Update Failed', 'An error occurred while updating.');
                }
            }

        } catch (error: any) {
            console.error("Submission Error", error);
            showAlert('error', 'Network Error', error.message || 'Failed to connect.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-ld">Edit Customer: {fullName} ({customerCode})</h2>
            </div>

            {/* ALERT CONTAINER */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300">
                        <Alert className={cn("shadow-2xl border-0 p-4 flex items-start gap-4 text-white rounded-xl relative pr-10", alert.type === 'success' ? "bg-green-500" : "bg-red-500")}>
                            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-white" /> : <AlertCircle className="h-6 w-6 text-white" />}
                            <div><AlertTitle className="font-bold text-white">{alert.title}</AlertTitle><AlertDescription className="text-white/90">{alert.message}</AlertDescription></div>
                            <button onClick={() => removeAlert(alert.id)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
                        </Alert>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader className="border-b mb-4">
                    <CardTitle className="text-base font-medium text-gray-600">Editing Details - {steps.find(s => s.id === activeTab)?.label}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            {steps.map((step) => (
                                <TabsTrigger key={step.id} value={step.id} disabled={!completedSteps.includes(step.id) && step.id !== activeTab && step.id !== "personal"} className="relative">
                                    {step.label}
                                    {completedSteps.includes(step.id) && <CheckCircle className="w-4 h-4 ml-2 text-green-500" />}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="personal" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <FormRow label="* Sur Name"><Input value={surName} onChange={e => setSurName(e.target.value)} /></FormRow>
                                    <FormRow label="* Full Name"><Input value={fullName} onChange={e => setFullName(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Date of Birth :</Label>
                                        <div className="col-span-9"><DatePicker date={dob} setDate={setDob} /></div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Care Of :</Label>
                                        <div className="col-span-3">
                                            <Select value={careOfRelation} onValueChange={setCareOfRelation}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Son">Son</SelectItem><SelectItem value="Daughter">Daughter</SelectItem>
                                                    <SelectItem value="Husband">Husband</SelectItem><SelectItem value="Wife">Wife</SelectItem>
                                                    <SelectItem value="Father">Father</SelectItem><SelectItem value="Mother">Mother</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6"><Input value={careOfName} onChange={e => setCareOfName(e.target.value)} /></div>
                                    </div>
                                    {/* Location Fields */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Country :</Label>
                                        <div className="col-span-9"><SearchableSelect options={countries} value={selectedCountry} onChange={handleCountryChange} placeholder="Select Country" /></div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">State :</Label>
                                        <div className="col-span-9"><SearchableSelect options={states} value={selectedState} onChange={handleStateChange} placeholder="Select State" disabled={!selectedCountry} /></div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">District :</Label>
                                        <div className="col-span-9"><SearchableSelect options={districts} value={selectedDistrict} onChange={setSelectedDistrict} placeholder="Select District" disabled={!selectedState} /></div>
                                    </div>
                                    <FormRow label="PINCODE"><Input value={pincode} onChange={e => handleNumericChange(e, setPincode, 6)} maxLength={6} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-2">Address :</Label>
                                        <div className="col-span-9"><Textarea className="min-h-[100px]" value={address} onChange={e => setAddress(e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FormRow label="* Mobile"><Input value={mobile} onChange={e => handleNumericChange(e, setMobile, 10)} maxLength={10} /></FormRow>
                                    <FormRow label="Phone"><Input value={phone} onChange={e => handleNumericChange(e, setPhone, 10)} maxLength={10} /></FormRow>
                                    <FormRow label="Alt. Mobile"><Input value={altMobile} onChange={e => handleNumericChange(e, setAltMobile, 10)} maxLength={10} /></FormRow>
                                    <FormRow label="WhatsApp"><Input value={whatsapp} onChange={e => handleNumericChange(e, setWhatsapp, 10)} maxLength={10} /></FormRow>
                                    <FormRow label="* Email"><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></FormRow>
                                    <FormRow label="Website"><Input value={website} onChange={e => setWebsite(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Photo :</Label>
                                        <div className="col-span-9">
                                            <Input type="file" accept=".jpg,.jpeg,.png" onChange={handlePhotoChange} className="cursor-pointer" />
                                            {photoPreview && <div className="mt-2"><img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-md border" /></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6"><Button onClick={() => nextTab("personal", "official")} className="w-[120px]">Next</Button></div>
                        </TabsContent>

                        <TabsContent value="official" className="space-y-6">
                            {/* STEP 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Branch :</Label>
                                        <div className="col-span-9"><SearchableSelect options={branches} value={selectedBranch} onChange={setSelectedBranch} placeholder="Select Branch" renderItem={(branch: Branch) => branch.location && branch.code ? `${branch.location} (${branch.code})` : (branch.name || branch.location)} /></div>
                                    </div>
                                    <FormRow label="* CODE#"><Input value={customerCode} readOnly className="bg-gray-50" /></FormRow>
                                    <FormRow label="Organization"><Input value={organization} onChange={e => setOrganization(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Occupation :</Label>
                                        <div className="col-span-9"><SearchableSelect options={occupations} value={selectedOccupation} onChange={setSelectedOccupation} placeholder="Select Occupation" valueKey="name" /></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FormRow label="* PAN No#"><Input value={panNo} onChange={e => setPanNo(e.target.value)} /></FormRow>
                                    <FormRow label="* AADHAR NO#"><Input value={aadharNo} onChange={e => setAadharNo(e.target.value)} /></FormRow>
                                    <FormRow label="GST / TAX ID#"><Input value={gstNo} onChange={e => setGstNo(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Nationality :</Label>
                                        <div className="col-span-9"><SearchableSelect options={nationalities} value={selectedNationality} onChange={setSelectedNationality} placeholder="Select Nationality" valueKey="name" /></div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <Button variant="outline" onClick={() => setActiveTab("personal")} className="w-[120px]">Previous</Button>
                                <Button onClick={() => nextTab("official", "settings")} className="w-[120px]">Next</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6">
                            {/* STEP 3 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <FormRow label="Nominee Name"><Input value={nomineeName} onChange={e => setNomineeName(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-2">Nominee Address :</Label>
                                        <div className="col-span-9"><Textarea className="min-h-[80px]" value={nomineeAddress} onChange={e => setNomineeAddress(e.target.value)} /></div>
                                    </div>
                                    <FormRow label="Relationship with Nominee"><Input value={nomineeRelation} onChange={e => setNomineeRelation(e.target.value)} /></FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Nominee DOB :</Label>
                                        <div className="col-span-9"><DatePicker date={nomineeDob} setDate={setNomineeDob} /></div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Joined On :</Label>
                                        <div className="col-span-9"><DatePicker date={joinedOn} setDate={setJoinedOn} /></div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-1">* Active</Label>
                                        <div className="col-span-9">
                                            <RadioGroup value={isActive} onValueChange={setIsActive} className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="active-no" /><Label htmlFor="active-no" className="font-normal text-gray-600">NO</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="active-yes" /><Label htmlFor="active-yes" className="font-normal text-gray-600">YES</Label></div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-1">* Has Login</Label>
                                        <div className="col-span-9">
                                            <RadioGroup value={hasLogin} onValueChange={setHasLogin} className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="login-no" /><Label htmlFor="login-no" className="font-normal text-gray-600">NO</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="login-yes" /><Label htmlFor="login-yes" className="font-normal text-gray-600">YES</Label></div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6 border-t pt-6 bg-gray-50/50 p-4 -mx-6 -mb-6 rounded-b-lg">
                                <Button variant="outline" onClick={() => setActiveTab("official")} className="w-[120px]">Previous</Button>
                                <div className="flex gap-4">
                                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 w-[120px]">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Update
                                    </Button>
                                    <Button variant="outline" className="bg-gray-700 text-white hover:bg-gray-600 w-[120px]" onClick={() => navigate(-1)}>Cancel</Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

const FormRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-12 gap-4 items-center">
        <Label className="col-span-3 text-right text-gray-600 font-normal">{label} :</Label>
        <div className="col-span-9">{children}</div>
    </div>
);

export default EditCustomer;
