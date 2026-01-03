import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Loader2, AlertCircle, Save, X } from 'lucide-react';


interface PropertyFormProps {
    initialData?: any;
    onSuccess: (data: any) => void;
    onCancel: () => void;
    title?: string;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ initialData, onSuccess, onCancel, title }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Dropdown Data
    const [ventures, setVentures] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);



    const [formData, setFormData] = useState<any>({
        code: '',
        venture_id: '',
        plot_no: '',
        title: '',
        location: '',
        village: '',
        survey_no: '',
        facing: '',
        roadsize: '',
        boundry_north: '',
        boundry_south: '',
        boundry_east: '',
        boundry_west: '',
        customer_id: '',
        customer_name: '',
        profile_id: '', // Agent
        agent_code: '',
        address: '',
        length: '',
        width: '',
        dimensions: '',
        srq_feets: '',
        srq_yards: '',
        ankanams: '',
        ankanam_cost: '',
        price: '',
        document_value: '',
        market_cost: '',
        registration_amount: '',
        discount: '',
        total_cost: '',
        paid: '0',
        outstanding: '0',
        cashreward: '0',
        excessamount: '0',
        dips: '0',
        booking: '',
        slab: '',
        status: 'Available',
        status_remarks: '',
        incentive: '0',
        full_payment_dip: '0',
        registration_dip: '0',
        agreement_dip: '0',
        booking_dip: '0',
        registration_type: '',
        doublecommission: '0',
        doubleincentive: '0',
        gold_coin: '0',
        goldcoin_grms: '',
        customer_offer_amount: '',
        agent_offer_amount: '',
        installment: '',
        installments: '',
        authority: '',
    });


    // Fetch Helper Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetch for resources
                const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [vRes, cRes, aRes, _sRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/ventures`, { headers }),
                    fetch(`${API_BASE_URL}/customers?type=customer`, { headers }),
                    fetch(`${API_BASE_URL}/admin/agents`, { headers }),
                    fetch(`${API_BASE_URL}/settings/all`, { headers })
                ]);

                const parseResponse = async (res: Response) => {
                    const text = await res.text();
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        const firstBrace = text.indexOf('{');
                        const lastBrace = text.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1) {
                            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
                        }
                        return {}; // Safe fallback
                    }
                };

                const vData = await parseResponse(vRes);
                let fetchedVentures = [];
                if (vData.status || Array.isArray(vData.data)) fetchedVentures = vData.data || vData;

                // Check if current venture is in the list, if not fetch and add it
                if (initialData && initialData.venture_id) {
                    const exists = fetchedVentures.find((v: any) => String(v.id) === String(initialData.venture_id));
                    if (!exists) {
                        try {
                            const specificVRes = await fetch(`${API_BASE_URL}/ventures/${initialData.venture_id}`, { headers });
                            const specificVData = await parseResponse(specificVRes);
                            const specificVenture = specificVData.media || specificVData.data || specificVData;
                            if (specificVenture && specificVenture.id) {
                                fetchedVentures.push(specificVenture);
                            }
                        } catch (e) {
                            console.error("Failed to fetch specific venture", e);
                        }
                    }
                }
                setVentures(fetchedVentures);

                // Customers
                if (cRes.ok) {
                    const cData = await parseResponse(cRes);
                    setCustomers(cData.data || cData || []);
                }

                // Agents
                if (aRes.ok) {
                    const aData = await parseResponse(aRes);
                    setAgents(aData.data || aData || []);
                }

                // Removed settings fetch as fields are hidden

            } catch (err) {
                console.error("Error fetching form options", err);
            }
        };

        fetchData();
    }, [token]);

    // Initialize Data
    useEffect(() => {
        if (initialData) {
            // Ensure booleans/numbers match string format for form
            const formatted = { ...initialData };
            // Convert boolean flags to '1'/'0' if they come as numbers/bools
            ['incentive', 'full_payment_dip', 'registration_dip', 'agreement_dip', 'booking_dip', 'doublecommission', 'doubleincentive', 'gold_coin'].forEach(k => {
                if (typeof formatted[k] === 'boolean') formatted[k] = formatted[k] ? '1' : '0';
                if (typeof formatted[k] === 'number') formatted[k] = String(formatted[k]);
                if (!formatted[k]) formatted[k] = '0';
            });
            // Fix ID types for dropdowns
            if (formatted.customer_id) formatted.customer_id = String(formatted.customer_id);
            if (formatted.profile_id) formatted.profile_id = String(formatted.profile_id);
            if (formatted.venture_id) formatted.venture_id = String(formatted.venture_id);
            if (formatted.status) formatted.status = String(formatted.status);

            // Handle Dates
            setFormData((prev: any) => ({ ...prev, ...formatted }));
        }
    }, [initialData]);

    // Handle Calculations
    useEffect(() => {
        const l = parseFloat(formData.length) || 0;
        const w = parseFloat(formData.width) || 0;

        if (l > 0 || w > 0) {
            const dims = `${l} x ${w}`;
            const sqft = (l * w).toFixed(2);
            const sqyd = (parseFloat(sqft) / 9).toFixed(2);
            const anks = (parseFloat(sqyd) / 4).toFixed(2);

            setFormData((prev: any) => {
                // Prevent infinite loop if values are same
                if (prev.dimensions === dims && prev.srq_yards === sqyd) return prev;
                return {
                    ...prev,
                    dimensions: dims,
                    srq_feets: sqft,
                    srq_yards: sqyd,
                    ankanams: anks
                };
            });
        }
    }, [formData.length, formData.width]);

    // Ankanam Cost -> Price
    useEffect(() => {
        const anks = parseFloat(formData.ankanams) || 0;
        const cost = parseFloat(formData.ankanam_cost) || 0;
        if (anks > 0 && cost > 0) {
            const price = (anks * cost).toFixed(2);
            setFormData((prev: any) => {
                if (prev.price === price) return prev;
                return { ...prev, price: price };
            });
        }
    }, [formData.ankanams, formData.ankanam_cost]);

    // Price - Discount -> Total Cost
    useEffect(() => {
        const price = parseFloat(formData.price) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const total = (price - discount).toFixed(2);
        setFormData((prev: any) => {
            if (prev.total_cost === total) return prev;
            return { ...prev, total_cost: total };
        });
    }, [formData.price, formData.discount]);

    // Plot No -> Title
    useEffect(() => {
        if (formData.plot_no && !initialData) { // Only auto-set on create or if empty
            setFormData((prev: any) => ({ ...prev, title: `Plot No: ${formData.plot_no}` }));
        }
    }, [formData.plot_no, initialData]);

    // Venture Select -> Location/Village
    const handleVentureChange = (val: string) => {
        const v = ventures.find(v => String(v.id) === val);
        setFormData((prev: any) => ({
            ...prev,
            venture_id: val,
            location: v ? v.title : '',
            village: v ? v.location : ''
        }));
    };

    // Customer Select -> Name
    const handleCustomerChange = (val: string) => {
        const c = customers.find(c => String(c.id) === val);
        setFormData((prev: any) => ({
            ...prev,
            customer_id: val,
            customer_name: c ? `${c.fullname} ${c.surname}` : ''
        }));
    };

    // Agent Select -> Code
    const handleAgentChange = (val: string) => {
        const a = agents.find(a => String(a.id) === val);
        setFormData((prev: any) => ({
            ...prev,
            profile_id: val,
            agent_code: a ? a.agent_code : ''
        }));
    };

    const handleChange = (field: string, val: string) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidationError(null);

        // Basic validation
        // Basic validation
        if (!formData.venture_id) {
            setValidationError("Please select a Venture.");
            setLoading(false);
            window.scrollTo(0, 0);
            return;
        }

        try {
            await onSuccess(formData);
        } catch (err: any) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const isEditMode = !!initialData;

    return (
        <div className="space-y-6">
            {/* Property Overview - Visible in Edit Mode or as a Summary in Create Mode */}
            {isEditMode && (
                <Card className="shadow-sm bg-slate-50 border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-slate-700">Property Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><Label className="text-muted-foreground">Code</Label><div className="font-semibold">{formData.code}</div></div>
                            <div><Label className="text-muted-foreground">Venture</Label><div className="font-semibold">{ventures.find(v => String(v.id) === formData.venture_id)?.title || formData.venture_id}</div></div>
                            <div><Label className="text-muted-foreground">Plot No</Label><div className="font-semibold">{formData.plot_no}</div></div>
                            <div><Label className="text-muted-foreground">Orignal Price</Label><div className="font-semibold">{formData.price}</div></div>

                            <div><Label className="text-muted-foreground">Dimensions</Label><div className="font-medium">{formData.dimensions} ({formData.srq_yards} SqYds)</div></div>
                            <div><Label className="text-muted-foreground">Facing</Label><div className="font-medium">{formData.facing}</div></div>
                            <div><Label className="text-muted-foreground">Location</Label><div className="font-medium">{formData.location}, {formData.village}</div></div>
                            <div><Label className="text-muted-foreground">Current Status</Label><Badge variant="outline">{formData.status}</Badge></div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm">
                {!isEditMode && title && (
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>
                )}
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {validationError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Validation Error</AlertTitle>
                                <AlertDescription>{validationError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Create Mode: Core Inputs */}


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Editable Fields for Both Modes */}

                            {/* Left: Customer & Agent */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Venture *</Label>
                                    <SearchableSelect
                                        value={formData.venture_id}
                                        onChange={handleVentureChange}
                                        options={ventures.map(v => ({ value: String(v.id), label: `${v.title} - ${v.location}` }))}
                                        placeholder="Select Venture"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Customer</Label>
                                    <SearchableSelect
                                        value={formData.customer_id}
                                        onChange={handleCustomerChange}
                                        options={customers.map(c => ({ value: String(c.id), label: `${c.code} : ${c.fullname} ${c.surname}` }))}
                                        placeholder="Select / Change Customer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Agent</Label>
                                    <SearchableSelect
                                        value={formData.profile_id}
                                        onChange={handleAgentChange}
                                        options={agents.map(a => ({ value: String(a.id), label: `${a.agent_code} : ${a.name}` }))}
                                        placeholder="Select / Change Agent"
                                    />
                                </div>
                            </div>

                            {/* Right: Boundaries */}
                            <div className="space-y-4">
                                <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
                                    <Label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Boundaries</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1"><Input placeholder="North" value={formData.boundry_north} onChange={e => handleChange('boundry_north', e.target.value)} className="bg-white" /></div>
                                        <div className="space-y-1"><Input placeholder="South" value={formData.boundry_south} onChange={e => handleChange('boundry_south', e.target.value)} className="bg-white" /></div>
                                        <div className="space-y-1"><Input placeholder="East" value={formData.boundry_east} onChange={e => handleChange('boundry_east', e.target.value)} className="bg-white" /></div>
                                        <div className="space-y-1"><Input placeholder="West" value={formData.boundry_west} onChange={e => handleChange('boundry_west', e.target.value)} className="bg-white" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-4 border-t sticky bottom-0 bg-white z-10">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="min-w-[150px] bg-cyan-600 hover:bg-cyan-700">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {isEditMode ? 'Update Property' : 'Create Property'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PropertyForm;
