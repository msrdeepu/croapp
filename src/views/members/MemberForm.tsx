import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from 'src/config';
import { Check, ChevronsUpDown } from 'lucide-react';
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

interface MemberFormProps {
    initialData?: any;
    mode: 'create' | 'edit';
}

const SearchableSelect = ({ options, value, onChange, placeholder, disabled = false }: any) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}
                    disabled={disabled}
                    type="button" // Prevent form submission
                >
                    {value
                        ? options.find((option: any) => String(option.value) === String(value))?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option: any) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const MemberForm: React.FC<MemberFormProps> = ({ initialData, mode }) => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Dropdown Options
    const [roles, setRoles] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        fullname: '',
        surname: '',
        role: 'agent', // Default to agent as per typical use case, or empty
        level: '',
        branch_id: '',
        email: '',
        phone: '',
        mobile: '',
        whatsapp: '0',
        password: '',
        password_confirmation: '',
        is_manager: false,
    });

    useEffect(() => {
        fetchFormData();
        if (initialData) {
            setFormData({
                fullname: initialData.fullname || initialData.name?.split(' ')[0] || '',
                surname: initialData.surname || '',
                role: initialData.roles?.[0]?.name || initialData.type || 'agent',
                level: initialData.level || '',
                branch_id: initialData.branch_id || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                mobile: initialData.mobile || '',
                whatsapp: String(initialData.whatsapp || '0'),
                password: '', // Don't prefill password
                password_confirmation: '',
                is_manager: Boolean(initialData.is_manager),
            });
        }
    }, [initialData]);

    const fetchFormData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/members/form-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.trim().substring(2));
                    } else {
                        throw e;
                    }
                }

                setRoles(data.roles || []);
                setLevels(data.levels || []);
                setBranches(data.branches || []);
            }
        } catch (err) {
            console.error("Failed to fetch form options", err);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationError(null);

        // Basic Validation
        if (!formData.fullname || !formData.email || !formData.mobile) {
            setValidationError("Please fill all mandatory fields (*)");
            setLoading(false);
            window.scrollTo(0, 0);
            return;
        }

        if (mode === 'create' && (!formData.password)) {
            setValidationError("Password is required for new members.");
            setLoading(false);
            window.scrollTo(0, 0);
            return;
        }

        if (formData.password && formData.password !== formData.password_confirmation) {
            setValidationError("Passwords do not match.");
            setLoading(false);
            window.scrollTo(0, 0);
            return;
        }

        try {
            const url = mode === 'create'
                ? `${API_BASE_URL}/members`
                : `${API_BASE_URL}/members/${initialData.id}`;
            const method = mode === 'create' ? 'POST' : 'PUT';

            // Prepare payload
            const payload: any = {
                fullname: formData.fullname,
                surname: formData.surname,
                type: formData.role, // Mapping role to type as per controller
                level: formData.role === 'agent' ? formData.level : null,
                branch_id: formData.branch_id,
                email: formData.email,
                phone: formData.phone,
                mobile: formData.mobile,
                whatsapp: formData.whatsapp === '1',
                is_manager: formData.is_manager
            };

            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password_confirmation;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('[]')) {
                    result = JSON.parse(text.trim().substring(2));
                } else {
                    console.error("Failed to parse response:", text);
                    throw new Error("Invalid server response");
                }
            }

            if (!response.ok) {
                // Handle Validation Errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    throw new Error(errorMessages || "Validation failed");
                }
                throw new Error(result.message || "Operation failed");
            }

            const msg = mode === 'create' ? "Member created successfully!" : "Member updated successfully!";
            navigate('/members', { state: { successMessage: msg } });
        } catch (err: any) {
            setError(err.message);
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

    // Determine if we should show Level field
    const showLevel = formData.role === 'agent';

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {validationError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                            value={formData.fullname}
                            onChange={e => handleChange('fullname', e.target.value)}
                            placeholder="Enter Full Name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Surname</Label>
                        <Input
                            value={formData.surname}
                            onChange={e => handleChange('surname', e.target.value)}
                            placeholder="Enter Surname"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Role *</Label>
                        <SearchableSelect
                            options={roles.map((r: any) => ({ label: r.display_name, value: r.name }))}
                            value={formData.role}
                            onChange={(val: any) => handleChange('role', val)}
                            placeholder="Select Role"
                        />
                    </div>

                    {showLevel && (
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <SearchableSelect
                                options={levels.map((l: any) => ({ label: l.name, value: l.name }))}
                                value={formData.level}
                                onChange={(val: any) => handleChange('level', val)}
                                placeholder="Select Level"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Branch</Label>
                        <SearchableSelect
                            options={branches.map((b: any) => ({ label: `${b.code} - ${b.location}`, value: b.id }))}
                            value={formData.branch_id}
                            onChange={(val: any) => handleChange('branch_id', val)}
                            placeholder="Select Branch"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                            placeholder="valid@email.com"
                            required
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                            type="number"
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            placeholder="Phone Number"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Mobile *</Label>
                        <Input
                            type="number"
                            value={formData.mobile}
                            onChange={e => handleChange('mobile', e.target.value)}
                            placeholder="Mobile Number"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>WhatsApp *</Label>
                        <div className="flex items-center space-x-4 pt-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="0"
                                    checked={formData.whatsapp === '0'}
                                    onChange={e => handleChange('whatsapp', e.target.value)}
                                    className="accent-slate-900"
                                />
                                <span>NO</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="1"
                                    checked={formData.whatsapp === '1'}
                                    onChange={e => handleChange('whatsapp', e.target.value)}
                                    className="accent-green-600"
                                />
                                <span className="text-green-700 font-medium">YES</span>
                            </label>
                        </div>
                        <p className="text-xs text-muted-foreground">Does the above Mobile Number have a WhatsApp Account?</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Password {mode === 'create' ? '*' : '(Leave blank to keep current)'}</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={e => handleChange('password', e.target.value)}
                            placeholder={mode === 'create' ? "Required" : "New Password"}
                            required={mode === 'create'}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Confirm Password {mode === 'create' ? '*' : ''}</Label>
                        <Input
                            type="password"
                            value={formData.password_confirmation}
                            onChange={e => handleChange('password_confirmation', e.target.value)}
                            placeholder="Confirm Password"
                            required={mode === 'create' || formData.password.length > 0}
                        />
                    </div>

                    {/* Admin Only - Manager Access - simplified to always clickable but logically backend handles it depending on user role permissions */}
                    <div className="flex items-center space-x-2 pt-4">
                        <input
                            type="checkbox"
                            id="is_manager"
                            checked={formData.is_manager}
                            onChange={e => handleChange('is_manager', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is_manager">Manager Access</Label>
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
                <Button type="button" variant="outline" onClick={() => navigate('/members')}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Member'}</Button>
            </div>
        </form>
    );
};

export default MemberForm;
