import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
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

// Interfaces for Dropdown Data
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
    valueKey?: string; // NEW: Allow helper to choose which key to treat as value
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

const CreateCustomer = () => {
    const navigate = useNavigate();
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
        // Validation Logic for Steps
        if (current === "personal") {
            if (!surName || !fullName || !dob || !mobile || !email || !selectedCountry || !selectedState || !selectedDistrict) {
                showAlert('error', 'Validation Error', 'Please fill in all mandatory fields (marked with *) in this step.');
                return;
            }
            if (mobile.length !== 10) {
                showAlert('error', 'Validation Error', 'Mobile number must be exactly 10 digits.');
                return;
            }
            if (altMobile && altMobile.length !== 10) {
                showAlert('error', 'Validation Error', 'Alternate Mobile number must be exactly 10 digits.');
                return;
            }
            if (whatsapp && whatsapp.length !== 10) {
                showAlert('error', 'Validation Error', 'WhatsApp number must be exactly 10 digits.');
                return;
            }
            if (phone && phone.length < 10) {
                showAlert('error', 'Validation Error', 'Phone number must be at least 10 digits.');
                return;
            }
            if (!isValidEmail(email)) {
                showAlert('error', 'Validation Error', 'Please enter a valid email address.');
                return;
            }
        } else if (current === "official") {
            if (!selectedBranch || !panNo || !aadharNo) {
                showAlert('error', 'Validation Error', 'Please fill in all mandatory fields (marked with *) in this step.');
                return;
            }
        }

        markStepComplete(current);
        setActiveTab(next);
    };

    const [isActive, setIsActive] = useState('yes');
    const [hasLogin, setHasLogin] = useState('no');

    // Fetch Initial Data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [formResponse, codeResponse] = await Promise.all([
                    fetch(ENDPOINTS.LIST_ITEMS.CUSTOMER_FORM, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                    }),
                    fetch(ENDPOINTS.CUSTOMERS.GET_CODE, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                    })
                ]);

                if (formResponse.ok) {
                    const text = await formResponse.text();
                    let rawData;
                    try {
                        rawData = JSON.parse(text);
                    } catch (e) {
                        // Handle malformed JSON like "[]{...}"
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try { rawData = JSON.parse(fixedText); } catch (e2) { console.error("Failed to fix JSON:", e2); }
                        } else {
                            console.error("JSON Parse Error:", e);
                        }
                    }

                    if (rawData) {
                        console.log("Customer Form Data:", rawData);

                        // Handle potential array wrapping (e.g. [{ branches: ... }])
                        const data = Array.isArray(rawData) ? rawData[0] : rawData;

                        // Handle branches whether it's an array or keyed object
                        const branchesData = data.branches || [];
                        const branchesArray = Array.isArray(branchesData)
                            ? branchesData
                            : Object.values(branchesData);

                        setBranches(branchesArray as Branch[]);
                        setNationalities(data.nationality || []); // API returns 'nationality' singular
                        setOccupations(data.occupations || []);
                        setCountries(data.countries || []);

                        // Use code from customer-form if available (user snippet showed it exists there)
                        if (data.code) {
                            setCustomerCode(data.code);
                        }
                    }
                }

                if (codeResponse.ok) {
                    const codeData = await codeResponse.json();
                    if (codeData.code) {
                        setCustomerCode(codeData.code);
                    }
                }
            } catch (error) {
                console.error("Error fetching initial customer data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchInitialData();
    }, [token]);

    // Country Change Handler
    const handleCountryChange = async (countryId: string) => {
        setSelectedCountry(countryId);
        setStates([]); // Reset states
        setDistricts([]); // Reset districts
        setSelectedState('');
        setSelectedDistrict('');

        if (!countryId) return;

        try {
            const response = await fetch(`${ENDPOINTS.LIST_ITEMS.STATES}/${countryId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const text = await response.text();
                let rawData;
                try {
                    rawData = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { rawData = JSON.parse(fixedText); } catch (e2) { console.error("Failed to fix JSON:", e2); }
                    }
                }

                const data = Array.isArray(rawData) ? rawData[0] : rawData;
                if (data && data.data) {
                    setStates(data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching states:", error);
        }
    };

    // State Change Handler
    const handleStateChange = async (stateId: string) => {
        setSelectedState(stateId);
        setDistricts([]); // Reset districts
        setSelectedDistrict('');

        if (!stateId) return;

        try {
            const response = await fetch(`${ENDPOINTS.LIST_ITEMS.DISTRICTS}/${stateId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const text = await response.text();
                let rawData;
                try {
                    rawData = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { rawData = JSON.parse(fixedText); } catch (e2) { console.error("Failed to fix JSON:", e2); }
                    }
                }

                const data = Array.isArray(rawData) ? rawData[0] : rawData;
                if (data && data.data) {
                    setDistricts(data.data);
                }
            }
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
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
        // Allow only number input
        if (/^\d*$/.test(value) && value.length <= maxLength) {
            setter(value);
        }
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidUrl = (url: string) => {
        if (!url) return true; // Optional field
        try {
            new URL(url);
            return true;
        } catch {
            return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(url);
        }
    };

    const fillDummyData = () => {
        setSurName("Doe");
        setFullName("John Doe");
        setMobile("9876543210");
        setEmail("john.doe@example.com");
        setCareOfName("Jane Doe");
        setCareOfRelation("Mother");
        setPanNo("ABCDE1234F");
        setAadharNo("123412341234");
        setDob(new Date("1990-01-01"));
        setJoinedOn(new Date());
        setAddress("123 Test St, Demo City");
        setPhone('9876543210');
        setWhatsapp('9876543210');
        setAltMobile('9876543210');
        setNomineeName('Nominee Doe');
        setNomineeRelation('Brother');
        setNomineeDob(new Date("1995-01-01"));
        setNomineeAddress('Same as above');
        setPincode('123456');

        // Select first available branch if any
        if (branches.length > 0) setSelectedBranch(String(branches[0].id));
        // Select first occupation/nationality if any
        if (occupations.length > 0) setSelectedOccupation(String(occupations[0].id));
        if (nationalities.length > 0) setSelectedNationality(String(nationalities[0].id));

        // Note: Country/State/District dependent logic might need manual trigger or complex chaining.
        // For now user can select them manually or we assume they will.
        if (countries.length > 0) {
            // handleCountryChange(countries[0].id); // This is async, might be better to let user pick or just set ID 
            // but setting ID won't trigger the fetch for states. 
            // Let's just alert the user to pick location
            showAlert('success', 'Demo Data Filled', 'Form filled with demo data. Please manually select Location fields.');
        } else {
            showAlert('success', 'Demo Data Filled', 'Form filled with demo data.');
        }
    };

    const handleSubmit = async () => {
        // 1. Mandatory Fields Check
        if (!surName || !fullName || !selectedBranch || !panNo || !aadharNo || !dob || !joinedOn || !mobile || !email || !selectedCountry || !selectedState || !selectedDistrict) {
            showAlert('error', 'Validation Error', 'Please fill in all mandatory fields (marked with *).');
            return;
        }

        // 2. Specific Format Validations
        if (mobile.length !== 10) {
            showAlert('error', 'Validation Error', 'Mobile number must be exactly 10 digits.');
            return;
        }
        if (altMobile && altMobile.length !== 10) {
            showAlert('error', 'Validation Error', 'Alternate Mobile number must be exactly 10 digits.');
            return;
        }
        if (whatsapp && whatsapp.length !== 10) {
            showAlert('error', 'Validation Error', 'WhatsApp number must be exactly 10 digits.');
            return;
        }
        if (phone && phone.length < 10) {
            // Phone could be landline, allowing looser check or strict 10? User said "all mobile related checks". 
            // Assuming similar rule or at least numeric which handleNumericChange ensures.
            // We'll enforce 10 for consistency based on user request "10 digits without any extra charecters allowed"
            showAlert('error', 'Validation Error', 'Phone number must be at least 10 digits.');
            return;
        }
        if (!isValidEmail(email)) {
            showAlert('error', 'Validation Error', 'Please enter a valid email address.');
            return;
        }
        if (website && !isValidUrl(website)) {
            showAlert('error', 'Validation Error', 'Please enter a valid website URL.');
            return;
        }

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

        try {
            const response = await fetch(ENDPOINTS.CUSTOMERS.CREATE, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.ok) {
                const text = await response.text();
                try { JSON.parse(text); } catch (e) { console.error("Invalid JSON response", e); }
                showAlert('success', 'Success', 'Customer created successfully!');
                setTimeout(() => {
                    navigate('/customers/manage');
                }, 2000); // Wait 2 seconds for toast
            } else {
                const text = await response.text();
                console.error("Submission failed", text);
                try {
                    const errData = JSON.parse(text);
                    showAlert('error', 'Submission Failed', errData.message || 'Failed to create customer.');
                } catch {
                    showAlert('error', 'Submission Failed', 'An error occurred while creating the customer.');
                }
            }

        } catch (error: any) {
            console.error("Submission Error", error);
            showAlert('error', 'Network Error', error.message || 'Failed to connect to server.');
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
                <h2 className="text-xl font-semibold text-ld">Customer Details</h2>
                <Button variant="outline" size="sm" onClick={fillDummyData} className="border-dashed border-gray-400 text-gray-500 hover:text-gray-700 hover:border-gray-500">
                    Fill Demo Data
                </Button>
            </div>

            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out"
                    >
                        <Alert
                            variant={alert.type as "default" | "destructive"} // Cast to satisfy type if needed, though 'success' is custom
                            className={cn(
                                "shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10",
                                alert.type === 'success' ? "bg-green-500" : "bg-red-500"
                            )}
                        >
                            {alert.type === 'success'
                                ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" />
                                : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                            }
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">
                                    {alert.message}
                                </AlertDescription>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader className="border-b mb-4">
                    <CardTitle className="text-base font-medium text-gray-600">Customer Full Details - {steps.find(s => s.id === activeTab)?.label}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            {steps.map((step) => (
                                <TabsTrigger
                                    key={step.id}
                                    value={step.id}
                                    disabled={!completedSteps.includes(step.id) && step.id !== activeTab && step.id !== "personal"}
                                    className="relative"
                                >
                                    {step.label}
                                    {completedSteps.includes(step.id) && (
                                        <CheckCircle className="w-4 h-4 ml-2 text-green-500 animate-in fade-in zoom-in duration-300" />
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <TabsContent value="personal" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* STEP 1: PERSONAL DETAILS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <FormRow label="* Sur Name">
                                        <Input placeholder="Enter Sur Name Here" value={surName} onChange={e => setSurName(e.target.value)} />
                                    </FormRow>
                                    <FormRow label="* Full Name">
                                        <Input placeholder="Enter Full Name Here" value={fullName} onChange={e => setFullName(e.target.value)} />
                                    </FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Date of Birth :</Label>
                                        <div className="col-span-9">
                                            <DatePicker date={dob} setDate={setDob} />
                                        </div>
                                    </div>
                                    {/* Care Of Group */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Care Of :</Label>
                                        <div className="col-span-3">
                                            <Select value={careOfRelation} onValueChange={setCareOfRelation}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Son">Son</SelectItem>
                                                    <SelectItem value="Daughter">Daughter</SelectItem>
                                                    <SelectItem value="Husband">Husband</SelectItem>
                                                    <SelectItem value="Wife">Wife</SelectItem>
                                                    <SelectItem value="Father">Father</SelectItem>
                                                    <SelectItem value="Mother">Mother</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-6">
                                            <Input placeholder="Enter Person Name Here" value={careOfName} onChange={e => setCareOfName(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Country :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={countries}
                                                value={selectedCountry}
                                                onChange={handleCountryChange}
                                                placeholder="Select Country"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* State :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={states}
                                                value={selectedState}
                                                onChange={handleStateChange}
                                                placeholder="Select State"
                                                disabled={!selectedCountry}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* District :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={districts}
                                                value={selectedDistrict}
                                                onChange={setSelectedDistrict}
                                                placeholder="Select District"
                                                disabled={!selectedState}
                                            />
                                        </div>
                                    </div>

                                    <FormRow label="PINCODE">
                                        <Input
                                            placeholder="Enter PINCODE Number Here"
                                            value={pincode}
                                            onChange={e => handleNumericChange(e, setPincode, 6)}
                                            maxLength={6}
                                        />
                                    </FormRow>

                                    {/* Address */}
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-2">Address :</Label>
                                        <div className="col-span-9">
                                            <Textarea className="min-h-[100px]" value={address} onChange={e => setAddress(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">

                                    <FormRow label="* Mobile">
                                        <Input
                                            placeholder="Enter Mobile Number Here"
                                            value={mobile}
                                            onChange={e => handleNumericChange(e, setMobile, 10)}
                                            maxLength={10}
                                        />
                                    </FormRow>
                                    <FormRow label="Phone">
                                        <Input
                                            placeholder="Enter Phone Number Here"
                                            value={phone}
                                            onChange={e => handleNumericChange(e, setPhone, 10)}
                                            maxLength={10}
                                        />
                                    </FormRow>
                                    <FormRow label="Alt. Mobile">
                                        <Input
                                            placeholder="Enter Alternate Mobile Number Here"
                                            value={altMobile}
                                            onChange={e => handleNumericChange(e, setAltMobile, 10)}
                                            maxLength={10}
                                        />
                                    </FormRow>
                                    <FormRow label="WhatsApp">
                                        <Input
                                            placeholder="Enter Whatsapp Number Here"
                                            value={whatsapp}
                                            onChange={e => handleNumericChange(e, setWhatsapp, 10)}
                                            maxLength={10}
                                        />
                                    </FormRow>
                                    <FormRow label="* Email">
                                        <Input placeholder="Enter Email Address Here" value={email} onChange={e => setEmail(e.target.value)} type="email" />
                                    </FormRow>
                                    <FormRow label="Website">
                                        <Input placeholder="Enter Website Url Here" value={website} onChange={e => setWebsite(e.target.value)} />
                                    </FormRow>



                                    {/* Photo */}
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Photo :</Label>
                                        <div className="col-span-9">
                                            <div className="space-y-2">
                                                <Input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={handlePhotoChange}
                                                    className="cursor-pointer"
                                                />
                                                {photoPreview && (
                                                    <div className="mt-2">
                                                        <img
                                                            src={photoPreview}
                                                            alt="Preview"
                                                            className="w-32 h-32 object-cover rounded-md border"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <Button onClick={() => nextTab("personal", "official")} className="w-[120px]">Next</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="official" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* STEP 2: OFFICIAL & IDENTITY */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Branch :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={branches}
                                                value={selectedBranch}
                                                onChange={setSelectedBranch}
                                                placeholder="Select Branch"
                                                renderItem={(branch: Branch) => branch.location && branch.code ? `${branch.location} (${branch.code})` : (branch.name || branch.location)}
                                            />
                                        </div>
                                    </div>
                                    <FormRow label="* CODE#">
                                        <Input value={customerCode} readOnly className="bg-gray-50" />
                                    </FormRow>
                                    <FormRow label="Organization">
                                        <Input placeholder="Enter Organization Here" value={organization} onChange={e => setOrganization(e.target.value)} />
                                    </FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Occupation :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={occupations}
                                                value={selectedOccupation}
                                                onChange={setSelectedOccupation}
                                                placeholder="Select Occupation"
                                                valueKey="name" // Use name instead of ID
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FormRow label="* PAN No#">
                                        <Input placeholder="Enter PAN Card Number Here" value={panNo} onChange={e => setPanNo(e.target.value)} />
                                    </FormRow>
                                    <FormRow label="* AADHAR NO#">
                                        <Input placeholder="Enter AADHAR Number Here" value={aadharNo} onChange={e => setAadharNo(e.target.value)} />
                                    </FormRow>
                                    <FormRow label="GST / TAX ID#">
                                        <Input placeholder="Enter GST / Tax Number Here" value={gstNo} onChange={e => setGstNo(e.target.value)} />
                                    </FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Nationality :</Label>
                                        <div className="col-span-9">
                                            <SearchableSelect
                                                options={nationalities}
                                                value={selectedNationality}
                                                onChange={setSelectedNationality}
                                                placeholder="Select Nationality"
                                                valueKey="name" // Use name instead of ID
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6">
                                <Button variant="outline" onClick={() => setActiveTab("personal")} className="w-[120px]">Previous</Button>
                                <Button onClick={() => nextTab("official", "settings")} className="w-[120px]">Next</Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* STEP 3: SETTINGS & NOMINEE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <FormRow label="Nominee Name">
                                        <Input placeholder="Enter Nominee Name Here" value={nomineeName} onChange={e => setNomineeName(e.target.value)} />
                                    </FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-2">Nominee Address :</Label>
                                        <div className="col-span-9">
                                            <Textarea className="min-h-[80px]" value={nomineeAddress} onChange={e => setNomineeAddress(e.target.value)} />
                                        </div>
                                    </div>
                                    <FormRow label="Relationship with Nominee">
                                        <Input placeholder="Enter Your Nominee Relationship with Nominee Here" value={nomineeRelation} onChange={e => setNomineeRelation(e.target.value)} />
                                    </FormRow>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">Nominee DOB :</Label>
                                        <div className="col-span-9">
                                            <DatePicker date={nomineeDob} setDate={setNomineeDob} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal">* Joined On :</Label>
                                        <div className="col-span-9">
                                            <DatePicker date={joinedOn} setDate={setJoinedOn} />
                                        </div>
                                    </div>
                                    {/* Active Radio */}
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-1">* Active</Label>
                                        <div className="col-span-9">
                                            <RadioGroup value={isActive} onValueChange={setIsActive} className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="no" id="active-no" />
                                                    <Label htmlFor="active-no" className="font-normal text-gray-600">NO</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="yes" id="active-yes" />
                                                    <Label htmlFor="active-yes" className="font-normal text-gray-600">YES</Label>
                                                </div>
                                            </RadioGroup>
                                            <p className="text-xs text-gray-400 mt-1">Account Status is Active or Not</p>
                                        </div>
                                    </div>

                                    {/* Has Login Radio */}
                                    <div className="grid grid-cols-12 gap-4 items-start">
                                        <Label className="col-span-3 text-right text-gray-600 font-normal mt-1">* Has Login</Label>
                                        <div className="col-span-9">
                                            <RadioGroup value={hasLogin} onValueChange={setHasLogin} className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="no" id="login-no" />
                                                    <Label htmlFor="login-no" className="font-normal text-gray-600">NO</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="yes" id="login-yes" />
                                                    <Label htmlFor="login-yes" className="font-normal text-gray-600">YES</Label>
                                                </div>
                                            </RadioGroup>
                                            <p className="text-xs text-gray-400 mt-1">Customer Login needed or Not</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6 border-t pt-6 bg-gray-50/50 p-4 -mx-6 -mb-6 rounded-b-lg">
                                <Button variant="outline" onClick={() => setActiveTab("official")} className="w-[120px]">Previous</Button>
                                <div className="flex gap-4">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 w-[120px]"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Save
                                    </Button>
                                    <Button variant="outline" className="bg-gray-700 text-white hover:bg-gray-600 hover:text-white border-0 w-[120px]" onClick={() => navigate(-1)}>Cancel</Button>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mt-2">Note: Fields Marked with (*) Astrik is Mandatory.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

// Helper Component for consistent row layout
const FormRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="grid grid-cols-12 gap-4 items-center">
        <Label className="col-span-3 text-right text-gray-600 font-normal">{label} :</Label>
        <div className="col-span-9">
            {children}
        </div>
    </div>
);

export default CreateCustomer;
