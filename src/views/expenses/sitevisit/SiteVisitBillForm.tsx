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

interface SiteVisitBillFormProps {
    initialData?: any;
    isEdit?: boolean;
}

const SiteVisitBillForm: React.FC<SiteVisitBillFormProps> = ({
    initialData,
    isEdit = false,
}) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        bill_number: '',
        sitevisit_id: '',
        branch_id: '',
        vendor_id: '',
        vendor: '',
        payment_method: '',
        account_id: '',
        company_id: '',
        notes: '',
        amount: '',
        payment_date: null as Date | null,
        cheque_number: '',
        dd_number: '',
        drawnon: undefined as Date | undefined,
        details: '',
        bill: null as File | null,
    });

    const [options, setOptions] = useState({
        branches: [],
        companies: [],
        vendors: [],
        paymentmethods: [],
        sitevisits: [],
        defaultAccounts: [],
    });
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        if (token) fetchFormData();
    }, [token]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                payment_date: initialData.payment_date ? new Date(initialData.payment_date) : null,
                drawnon: initialData.drawnon ? new Date(initialData.drawnon) : undefined,
                sitevisit_id: initialData.sitevisit_id ? String(initialData.sitevisit_id) : (initialData.sitevisit ? String(initialData.sitevisit.id) : ''),
                branch_id: initialData.branch_id ? String(initialData.branch_id) : '',
                vendor_id: initialData.vendor_id ? String(initialData.vendor_id) : '',
                company_id: initialData.company_id ? String(initialData.company_id) : '',
                account_id: initialData.account_id ? String(initialData.account_id) : '',
                payment_method: initialData.payment_method || '',
                vendor: initialData.vendor_name || (typeof initialData.vendor === 'string' ? initialData.vendor : '') || (initialData.vendor?.fullname ? `${initialData.vendor.fullname} ${initialData.vendor.surname || ''}`.trim() : '') || '',
                notes: initialData.notes || '',
                cheque_number: initialData.cheque_number || '',
                dd_number: initialData.dd_number || '',
                details: initialData.details || '',
                bill: null
            });
        }
    }, [initialData]);

    // Effect to update accounts if branches/initialData changes
    useEffect(() => {
        if (formData.branch_id && options.defaultAccounts.length > 0) {
            filterAccounts(formData.branch_id);
        }
    }, [formData.branch_id, options.defaultAccounts]);


    const fetchFormData = async () => {
        try {
            const response = await fetch(ENDPOINTS.SITEVISIT_BILLS.FORM_DATA, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const text = await response.text();
            let res;
            try {
                res = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('[]')) {
                    const fixedText = text.trim().substring(2);
                    try { res = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                } else {
                    console.error('Error parsing JSON:', e);
                }
            }

            if (res && res.status) {
                setOptions({
                    branches: res.branches || [],
                    companies: res.companies || [],
                    vendors: res.vendors || [],
                    paymentmethods: res.paymentmethods || [],
                    sitevisits: res.sitevisits || [],
                    defaultAccounts: res.accounts || [],
                });
                setAccounts(res.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
        }
    };

    const filterAccounts = (branchId: string) => {
        const filtered = options.defaultAccounts.filter((a: any) => String(a.branch_id) === String(branchId));
        // Always set accounts, if filtered empty then empty (or defaultAccounts depending on logic, earlier was default but usually specific branch account needed)
        // Sticking to previous logic: if mismatch, create/edit logic might be tricky. Let's just set filtered.
        setAccounts(filtered.length > 0 ? filtered : options.defaultAccounts);
    }

    const handleSiteVisitChange = (val: string) => {
        const sitevisitId = val;
        const sitevisit = options.sitevisits.find((s: any) => String(s.id) === String(sitevisitId)) as any;

        setFormData((prev) => ({
            ...prev,
            sitevisit_id: sitevisitId,
        }));

        if (sitevisit) {
            setFormData((prev) => ({
                ...prev,
                amount: sitevisit.total,
            }));
        }
    };

    const handleBranchChange = (val: string) => {
        setFormData((prev) => ({ ...prev, branch_id: val }));
        filterAccounts(val);
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

            // Format to YYYY-MM-DD HH:mm:ss preserving local time
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
                return; // Handled explicitly below
            }
            data.append(key, value as string);
        });

        // Explicitly handle File
        if (formData.bill instanceof File) {
            data.append('bill', formData.bill);
        }

        // Explicitly handle Dates
        const paymentDateStr = formatDateForBackend(formData.payment_date);
        if (paymentDateStr) data.append('payment_date', paymentDateStr);

        const drawnOnStr = formatDateForBackend(formData.drawnon);
        if (drawnOnStr) data.append('drawnon', drawnOnStr);

        if (isEdit) {
            data.append('_method', 'PUT');
        }

        try {
            const url = isEdit
                ? `${ENDPOINTS.SITEVISIT_BILLS.BASE}/${initialData.id}`
                : ENDPOINTS.SITEVISIT_BILLS.BASE;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data
            });

            // Check HTTP status first
            if (response.ok) {
                const res = await response.json();
                // Double check the response body status if it exists
                if (res.status === true || res.status === 'true' || !('status' in res)) {
                    navigate('/expenses/site-visit');
                } else {
                    console.error(res.message);
                    alert('Error: ' + (res.message || 'Unknown error'));
                }
            } else {
                const res = await response.json();
                console.error(res.message);
                alert('Error: ' + (res.message || 'Failed to save bill'));
            }
        } catch (error) {
            console.error('Error saving bill:', error);
            alert('Failed to save bill');
        } finally {
            setLoading(false);
        }
    };

    const isChequeOrDD = formData.payment_method === 'CHEQUE' || formData.payment_method === 'DD';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label htmlFor="sitevisit_id">Site Visit *</Label>
                            <SearchableSelect
                                options={options.sitevisits.map((item: any) => ({
                                    value: String(item.id),
                                    label: `ID #${item.id} : Total Amount : ${item.total} - [${item.vehical?.ownedby} / ${item.vehical?.number}]`
                                }))}
                                value={formData.sitevisit_id}
                                onChange={handleSiteVisitChange}
                                placeholder="-- Select Site Visit --"
                                searchPlaceholder="Search site visit..."
                            />
                        </div>
                    )}

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
                        <Label htmlFor="vendor_id">Paid To *</Label>
                        <SearchableSelect
                            options={options.vendors.map((vendor: any) => ({
                                value: String(vendor.id),
                                label: `${vendor.code} : ${vendor.fullname} ${vendor.surname} ${vendor.organization ? `- ${vendor.organization}` : ''}`
                            }))}
                            value={formData.vendor_id}
                            onChange={handleVendorChange}
                            placeholder="-- Select Vehicle Owner / Company --"
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
                        <Label htmlFor="bill">Attachment Bill</Label>
                        <Input
                            type="file"
                            id="bill"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                        {isEdit && (initialData?.media_url || initialData?.bill_attachment) && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-gray-600 mb-2">Current Attachment:</p>
                                <a
                                    href={
                                        initialData.media_url ||
                                        (() => {
                                            try {
                                                const url = new URL(ENDPOINTS.SITEVISIT_BILLS.BASE);
                                                const origin = url.origin;
                                                const path = initialData.bill_attachment.startsWith('/') ? initialData.bill_attachment.substring(1) : initialData.bill_attachment;
                                                return `${origin}/${path}`;
                                            } catch (e) {
                                                return '';
                                            }
                                        })()
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View/Download Current Attachment
                                </a>
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
                <Button variant="outline" type="button" onClick={() => navigate('/expenses/site-visit')}>
                    Cancel
                </Button>
            </div>
        </form>
    );
};

export default SiteVisitBillForm;
