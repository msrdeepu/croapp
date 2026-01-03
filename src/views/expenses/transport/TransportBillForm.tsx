import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { DatePicker } from 'src/components/ui/date-picker';
import { Loader2 } from 'lucide-react';

interface TransportBillFormProps {
    initialData?: any;
    isEdit?: boolean;
}

const TransportBillForm: React.FC<TransportBillFormProps> = ({
    initialData,
    isEdit = false,
}) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        branch_id: '',
        vehicle_id: '',
        vendor_id: '',
        vendor: '',
        billingcategory_id: '',
        purpose: '',
        amount: '',
        payment_date: null as Date | null,
        payment_method: '',
        account_id: '',
        company_id: '',
        cheque_number: '',
        dd_number: '',
        drawnon: undefined as Date | undefined,
        details: '',
        bill: null as File | null,
        notes: '',
        bill_number: '',
    });

    const [options, setOptions] = useState<{
        branches: any[];
        companies: any[];
        vendors: any[];
        paymentmethods: any[];
        billingcategories: any[];
        vehicles: any[];
        defaultAccounts: any[];
    }>({
        branches: [],
        companies: [],
        vendors: [],
        paymentmethods: [],
        billingcategories: [],
        vehicles: [],
        defaultAccounts: [],
    });
    const [accounts, setAccounts] = useState<any[]>([]);

    const filterAccounts = React.useCallback((branchId: string, currentOptions = options) => {
        const filtered = currentOptions.defaultAccounts.filter((a: any) => String(a.branch_id) === String(branchId));
        setAccounts(filtered.length > 0 ? filtered : currentOptions.defaultAccounts);
    }, [options]);

    const fetchFormData = React.useCallback(async () => {
        try {
            const response = await fetch(ENDPOINTS.TRANSPORT_BILLS.FORM_DATA, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const text = await response.text();
            let res;
            try {
                res = JSON.parse(text);
            } catch {
                if (text.trim().startsWith('[]')) {
                    const fixedText = text.trim().substring(2);
                    try { res = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                } else {
                    console.error('Error parsing JSON');
                }
            }

            if (res && res.status) {
                const newOptions = {
                    branches: res.branches || [],
                    companies: res.companies || [],
                    vendors: res.vendors || [],
                    paymentmethods: res.paymentmethods || [],
                    billingcategories: res.billingcategories || [],
                    vehicles: res.vehicles || [],
                    defaultAccounts: res.accounts || [],
                };
                setOptions(newOptions);
                setAccounts(res.accounts || []);

                // If we have a branch selected, filter immediately? 
                // Wait, initialData might set branch_id. 
                // We handle that in another effect.
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchFormData();
    }, [token, fetchFormData]);

    useEffect(() => {
        if (initialData) {
            const newFormData = {
                ...initialData,
                payment_date: initialData.payment_date ? new Date(initialData.payment_date) : null,
                drawnon: initialData.drawnon ? new Date(initialData.drawnon) : undefined,
                branch_id: initialData.branch_id ? String(initialData.branch_id) : '',
                vehicle_id: initialData.vehicle_id ? String(initialData.vehicle_id) : '',
                vendor_id: initialData.vendor_id ? String(initialData.vendor_id) : '',
                company_id: initialData.company_id ? String(initialData.company_id) : '',
                account_id: initialData.account_id ? String(initialData.account_id) : '',
                billingcategory_id: initialData.billingcategory_id ? String(initialData.billingcategory_id) : '',
                payment_method: initialData.payment_method || '',
                vendor: initialData.vendor_name || (typeof initialData.vendor === 'string' ? initialData.vendor : '') || (initialData.vendor?.fullname ? `${initialData.vendor.fullname} ${initialData.vendor.surname || ''}`.trim() : '') || '',
                purpose: initialData.purpose || '',
                amount: initialData.amount || '',
                notes: initialData.notes || '',
                bill_number: initialData.bill_number || '',
                cheque_number: initialData.cheque_number || '',
                dd_number: initialData.dd_number || '',
                details: initialData.details || '',
                bill: null
            };
            setFormData(newFormData);
        }
    }, [initialData]);

    // Effect to update accounts if branches/initialData changes
    useEffect(() => {
        if (formData.branch_id && options.defaultAccounts.length > 0) {
            filterAccounts(formData.branch_id, options);
        }
    }, [formData.branch_id, options.defaultAccounts, filterAccounts, options]);

    const handleBranchChange = (val: string) => {
        setFormData((prev) => ({ ...prev, branch_id: val }));
        filterAccounts(val, options);
    };

    const handleVendorChange = (val: string) => {
        const vendorId = val;
        const vendor = options.vendors.find((v: any) => String(v.id) === String(vendorId)) as any;

        setFormData(prev => ({
            ...prev,
            vendor_id: vendorId,
            vendor: vendor ? `${vendor.fullname || ''} ${vendor.surname || ''} ${vendor.organization ? '- ' + vendor.organization : ''}` : prev.vendor
        }));
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData((prev) => ({ ...prev, bill: e.target.files![0] }));
        }
    };

    const formatDateForBackend = (date: any): string | null => {
        if (!date) return null;
        try {
            const d = date instanceof Date ? date : new Date(date);
            if (isNaN(d.getTime())) return null;

            // Format to YYYY-MM-DD HH:mm:ss
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (e) {
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();

        // Append standard fields
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'payment_date' || key === 'drawnon' || key === 'bill') {
                return; // Handled explicitly
            }
            data.append(key, value as string);
        });

        if (formData.bill instanceof File) {
            data.append('bill', formData.bill);
        }

        const paymentDateStr = formatDateForBackend(formData.payment_date);
        if (paymentDateStr) data.append('payment_date', paymentDateStr);

        const drawnOnStr = formatDateForBackend(formData.drawnon);
        if (drawnOnStr) data.append('drawnon', drawnOnStr);

        if (isEdit) {
            data.append('_method', 'PUT');
        }

        try {
            const url = isEdit
                ? `${ENDPOINTS.TRANSPORT_BILLS.BASE}/${initialData.id}`
                : ENDPOINTS.TRANSPORT_BILLS.BASE;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data
            });

            const res = await response.json();

            if (res.status) {
                navigate('/expenses/transport');
            } else {
                console.error(res.message);
                alert('Error: ' + res.message);
            }
        } catch (error) {
            console.error('Error saving bill:', error);
            alert('Failed to save bill');
        } finally {
            setLoading(false);
        }
    };

    const isChequeOrDD = formData.payment_method === 'CHEQUE' || formData.payment_method === 'DD';

    // The backend uses a specific 'Billing Category' for Transport Expense.
    // If the backend filters `billingcategories` correctly for us in formData, we just show them.
    // Otherwise we might need to filter `cset` or `type`. Assuming API provides correct list.

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="bill_number">Bill Number *</Label>
                        <Input
                            id="bill_number"
                            name="bill_number"
                            value={formData.bill_number}
                            onChange={handleChange}
                            required
                            placeholder="Enter Bill Number Here"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch_id">Branch *</Label>
                        <SearchableSelect
                            options={options.branches.map((branch: any) => ({
                                value: String(branch.id),
                                label: branch.location
                            }))}
                            value={formData.branch_id}
                            onChange={handleBranchChange}
                            placeholder="-- Select Branch --"
                            searchPlaceholder="Search branch..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vehicle_id">Vehicle *</Label>
                        <SearchableSelect
                            options={options.vehicles.map((v: any) => ({
                                value: String(v.id),
                                label: `${v.number} - ${v.name} (${v.ownedby})`
                            }))}
                            value={formData.vehicle_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, vehicle_id: val }))}
                            placeholder="-- Select Vehicle --"
                            searchPlaceholder="Search vehicle..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vendor_id">Paid To *</Label>
                        <SearchableSelect
                            options={options.vendors.map((vendor: any) => ({
                                value: String(vendor.id),
                                label: `${vendor.code} : ${vendor.fullname} ${vendor.surname} ${vendor.organization ? `- ${vendor.organization}` : ''}`
                            }))}
                            value={formData.vendor_id}
                            onChange={handleVendorChange}
                            placeholder="-- Select Person / Company --"
                            searchPlaceholder="Search vendor..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vendor">Person / Company Display Name *</Label>
                        <Input
                            id="vendor"
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="billingcategory_id">Billing Category *</Label>
                        <SearchableSelect
                            options={options.billingcategories.map((c: any) => ({
                                value: String(c.id),
                                label: c.name
                            }))}
                            value={formData.billingcategory_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, billingcategory_id: val }))}
                            placeholder="-- Select Category --"
                            searchPlaceholder="Search category..."
                        />
                    </div>


                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Paid On *</Label>
                        <DatePicker
                            date={formData.payment_date || undefined}
                            setDate={(newValue) => setFormData({ ...formData, payment_date: newValue ?? null })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="company_id">Company *</Label>
                        <SearchableSelect
                            options={options.companies.map((comp: any) => ({
                                value: String(comp.id),
                                label: comp.name
                            }))}
                            value={formData.company_id}
                            onChange={(val) => setFormData({ ...formData, company_id: val })}
                            placeholder="-- Select Company --"
                            searchPlaceholder="Search company..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_id">Paid Account *</Label>
                        <SearchableSelect
                            options={accounts.map((acc: any) => ({
                                value: String(acc.id),
                                label: acc.name
                            }))}
                            value={formData.account_id}
                            onChange={(val) => setFormData({ ...formData, account_id: val })}
                            placeholder="-- Select Account --"
                            searchPlaceholder="Search account..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_method">Payment Method *</Label>
                        <SearchableSelect
                            options={options.paymentmethods.map((pm: any) => ({
                                value: pm.value,
                                label: pm.name
                            }))}
                            value={formData.payment_method}
                            onChange={(val) => setFormData({ ...formData, payment_method: val })}
                            placeholder="-- Select Payment Method --"
                            searchPlaceholder="Search payment method..."
                        />
                    </div>

                    {isChequeOrDD && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="cheque_number">Cheque NO#</Label>
                                <Input
                                    id="cheque_number"
                                    name="cheque_number"
                                    value={formData.cheque_number}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dd_number">D.D. NO#</Label>
                                <Input
                                    id="dd_number"
                                    name="dd_number"
                                    value={formData.dd_number}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="drawnon">Drawn On</Label>
                                <DatePicker
                                    date={formData.drawnon}
                                    setDate={(newValue) => setFormData({ ...formData, drawnon: newValue })}
                                />
                            </div>
                        </>
                    )}

                    {!isChequeOrDD && (
                        <div className="space-y-2">
                            <Label htmlFor="details">Transaction Details</Label>
                            <Textarea
                                id="details"
                                name="details"
                                value={formData.details}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose *</Label>
                        <Input
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            required
                            placeholder="Enter Purpose Here"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bill">Attachment Bill</Label>
                        <Input
                            type="file"
                            id="bill"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        {isEdit && (initialData?.media_url || initialData?.bill_attachment) && (
                            <div className="mt-2">
                                <img
                                    src={
                                        initialData.media_url ||
                                        (() => {
                                            try {
                                                const url = new URL(ENDPOINTS.TRANSPORT_BILLS.BASE);
                                                const origin = url.origin;
                                                const path = initialData.bill_attachment.startsWith('/') ? initialData.bill_attachment.substring(1) : initialData.bill_attachment;
                                                return `${origin}/${path}`;
                                            } catch (e) {
                                                return '';
                                            }
                                        })()
                                    }
                                    alt="Attachment"
                                    className="max-h-[200px] border rounded p-1"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
                <Button disabled={loading} type="submit">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate('/expenses/transport')}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default TransportBillForm;
