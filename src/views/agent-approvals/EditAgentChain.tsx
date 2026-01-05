
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "src/components/ui/card";
import { Label } from "src/components/ui/label";
import { Input } from "src/components/ui/input";
import { Button } from "src/components/ui/button";
import { SearchableSelect } from "src/components/ui/searchable-select";
import { DatePicker } from "src/components/ui/date-picker";
import Spinner from 'src/views/spinner/Spinner';
import { API_BASE_URL } from 'src/config';
import { useAuth } from 'src/context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const EditAgentChain = () => {
    const { token } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({});
    const [profile, setProfile] = useState<any>({});

    // Dropdown Data
    const [branches, setBranches] = useState([]);
    const [maritals, setMaritals] = useState([]);
    const [countries, setCountries] = useState([]);
    // const [states, setStates] = useState([]); // Loaded dynamically
    // const [districts, setDistricts] = useState([]); // Loaded dynamically
    const [agents, setAgents] = useState([]); // For Introducer

    // Logic for State/District dynamic loading
    const [stateOptions, setStateOptions] = useState<any[]>([]);
    const [districtOptions, setDistrictOptions] = useState<any[]>([]);

    // Date of Birth state
    const [dob, setDob] = useState<Date | undefined>(undefined);



    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Form Data (Settings, etc)
                const formResponse = await fetch(`${API_BASE_URL}/profiles/form-data`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (formResponse.ok) {
                    const text = await formResponse.text();
                    let formDataResult;
                    try {
                        formDataResult = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            formDataResult = JSON.parse(text.trim().substring(2));
                        } else {
                            throw e;
                        }
                    }

                    setBranches(formDataResult.branches || []);
                    setMaritals(formDataResult.maritals || []);
                    setCountries(formDataResult.countries || []);
                    setAgents(formDataResult.agents || []); // Full agent list for introducer
                }

            } catch (error) {
                console.error("Error fetching form data:", error);
            }
        };

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
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
                    setProfile(data);

                    // Initialize form state
                    setFormData(data);

                    // Initialize DOB from profile data
                    if (data.dob) {
                        setDob(new Date(data.dob));
                    }

                    // Load dependent data (State/District) if Country/State exist
                    if (data.country) handleCountryChange(data.country);
                    if (data.state) handleStateChange(data.state);
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };


        if (id && token) {
            fetchInitialData().then(fetchProfile);
        }
    }, [id, token]);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = async (countryId: string) => {
        handleSelectChange('country', countryId);
        // Fetch States
        try {
            const res = await fetch(`${API_BASE_URL}/data/states/${countryId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const states = await res.json();
            // Convert object to array for Select
            const options = Object.entries(states).map(([id, name]) => ({ value: id, label: name as string }));
            setStateOptions(options);
        } catch (e) { console.error(e) }
    };

    const handleStateChange = async (stateId: string) => {
        handleSelectChange('state', stateId);
        // Fetch Districts
        try {
            const res = await fetch(`${API_BASE_URL}/data/districts/${stateId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const districts = await res.json();
            const options = Object.entries(districts).map(([id, name]) => ({ value: id, label: name as string }));
            setDistrictOptions(options);
        } catch (e) { console.error(e) }
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            // Format date helper
            const formatDate = (d: Date | undefined) => {
                if (!d) return '';
                const offset = d.getTimezoneOffset();
                const date = new Date(d.getTime() - (offset * 60 * 1000));
                return date.toISOString().split('T')[0];
            };

            // Prepare form data with formatted DOB
            const submitData = {
                ...formData,
                dob: formatDate(dob)
            };

            const res = await fetch(`${API_BASE_URL}/profiles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(submitData)
            });
            if (res.ok) {
                navigate('/agent-approvals'); // Or go back to list
            } else {
                const err = await res.json();
                alert("Error updating profile: " + (err.message || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert("Error updating profile");
        }
    };


    if (loading) return <Spinner />;

    // Helper options mappers
    const mapToOptions = (items: any[]) => items.map(i => ({ value: i.id?.toString() || i.value, label: i.name || i.location || i.label }));
    const mapAgentOptions = (items: any[]) => items.map(i => ({ value: i.id?.toString(), label: `${i.agent_code} - ${i.fullname} ${i.surname} (${i.level})` }));

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage User Profile & Chain</CardTitle>
                    <CardDescription>Edit details for {profile.fullname}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}> <ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Personal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Surname</Label>
                            <Input name="surname" value={formData.surname || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input name="fullname" value={formData.fullname || ''} onChange={handleInputChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Care Of Relation</Label>
                            <SearchableSelect
                                value={formData.careof_relationship}
                                onChange={(v) => handleSelectChange('careof_relationship', v)}
                                options={[
                                    { label: 'Son', value: 'Son' }, { label: 'Daughter', value: 'Daughter' },
                                    { label: 'Husband', value: 'Husband' }, { label: 'Wife', value: 'Wife' },
                                    { label: 'Father', value: 'Father' }, { label: 'Mother', value: 'Mother' }
                                ]}
                                placeholder="Select Relation"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Care Of Name</Label>
                            <Input name="careof" value={formData.careof || ''} onChange={handleInputChange} />
                        </div>

                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <SearchableSelect
                                value={formData.branch_id?.toString()}
                                onChange={(v) => handleSelectChange('branch_id', v)}
                                options={mapToOptions(branches)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>PAN No</Label>
                            <Input name="pan" value={formData.pan || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Aadhar No</Label>
                            <Input name="aadhar" value={formData.aadhar || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <DatePicker
                                date={dob}
                                setDate={setDob}
                                placeholder="Select date of birth"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Marital Status</Label>
                            <SearchableSelect
                                value={formData.marital_status}
                                onChange={(v) => handleSelectChange('marital_status', v)}
                                options={mapToOptions(maritals)}
                            />
                        </div>
                    </div>

                    <div className="border-t my-4" />

                    {/* Chain Details */}
                    <h3 className="font-semibold text-lg">Chain Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Introducer</Label>
                            <SearchableSelect
                                value={formData.introducer?.toString()}
                                onChange={(v) => handleSelectChange('introducer', v)}
                                options={mapAgentOptions(agents)}
                                placeholder="Select Introducer"
                            />
                        </div>

                        {profile.registration_fee_paid ? (
                            <>
                                <div className="space-y-2">
                                    <Label>Project Manager (PM)</Label>
                                    <SearchableSelect
                                        value={formData.pm?.toString()}
                                        onChange={(v) => handleSelectChange('pm', v)}
                                        options={mapAgentOptions(agents)} // Ideally filtered
                                        placeholder="Select PM"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senior PM (SPM)</Label>
                                    <SearchableSelect
                                        value={formData.spm?.toString()}
                                        onChange={(v) => handleSelectChange('spm', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select SPM"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Dev Officer (DO)</Label>
                                    <SearchableSelect
                                        value={formData.do?.toString()}
                                        onChange={(v) => handleSelectChange('do', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select DO"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senior DO (SDO)</Label>
                                    <SearchableSelect
                                        value={formData.sdo?.toString()}
                                        onChange={(v) => handleSelectChange('sdo', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select SDO"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Marketing Director (MD)</Label>
                                    <SearchableSelect
                                        value={formData.md?.toString()}
                                        onChange={(v) => handleSelectChange('md', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select MD"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senior MD (SMD)</Label>
                                    <SearchableSelect
                                        value={formData.smd?.toString()}
                                        onChange={(v) => handleSelectChange('smd', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select SMD"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Regional MD (RMD)</Label>
                                    <SearchableSelect
                                        value={formData.rmd?.toString()}
                                        onChange={(v) => handleSelectChange('rmd', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select RMD"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Chief MD (CMD)</Label>
                                    <SearchableSelect
                                        value={formData.cmd?.toString()}
                                        onChange={(v) => handleSelectChange('cmd', v)}
                                        options={mapAgentOptions(agents)}
                                        placeholder="Select CMD"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="col-span-2 p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                                <p className="font-semibold">⚠️ Agent Joining/Promotion Fee Payment Approval is Pending.</p>
                                <p className="text-sm">Chain details cannot be edited until payment is validated.</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t my-4" />

                    {/* Bank & Address */}
                    <h3 className="font-semibold text-lg">Bank & Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input name="bank" value={formData.bank || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Account No</Label>
                            <Input name="account_no" value={formData.account_no || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input name="ifsc_code" value={formData.ifsc_code || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>UPI ID</Label>
                            <Input name="upi_no" value={formData.upi_no || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input name="address" value={formData.address || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <SearchableSelect
                                value={formData.country?.toString()}
                                onChange={handleCountryChange}
                                options={mapToOptions(countries)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>State</Label>
                            <SearchableSelect
                                value={formData.state?.toString()}
                                onChange={handleStateChange}
                                options={stateOptions}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <SearchableSelect
                                value={formData.district?.toString()}
                                onChange={(v) => handleSelectChange('district', v)}
                                options={districtOptions}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Pincode</Label>
                            <Input name="pincode" value={formData.pincode || ''} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="border-t my-4" />
                    {/* Nominee */}
                    <h3 className="font-semibold text-lg">Nominee Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nominee Name</Label>
                            <Input name="nominee" value={formData.nominee || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Input name="nominee_relationship" value={formData.nominee_relationship || ''} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Nominee Address</Label>
                            <Input name="nominee_address" value={formData.nominee_address || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nominee Co-worker?</Label>
                            <SearchableSelect
                                value={formData.nominee_coworker?.toString()}
                                onChange={(v) => handleSelectChange('nominee_coworker', v)}
                                options={[
                                    { label: 'Yes', value: '1' },
                                    { label: 'No', value: '0' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default EditAgentChain;
