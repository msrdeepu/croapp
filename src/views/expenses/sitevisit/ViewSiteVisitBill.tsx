import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Loader2, ArrowLeft, Printer, FileText, Calendar, Building2, User, Banknote } from 'lucide-react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb"

interface SiteVisitBillDetails {
    id: number;
    bill_number: string;
    sitevisit_id: number;
    billingcategory_id: number;
    company_id: number;
    branch_id: number;
    vendor_id: number;
    account_id: number;
    payment_method: string;
    payment_date: string;
    amount: string;
    notes: string;
    details: string;
    cheque_number: string;
    dd_number: string;
    drawnon: string;
    file_path: string;
    media_url: string | null;
    vendor: any;
    branch: any;
    billingcategory: any;
    sitevisit: any;
    company: any;
    account: any; // Assuming these relations might be included or id references
    created_at: string;
    // Add other fields as necessary from the API response
    vendor_name?: string;
    bill_attachment?: string;
}

const ViewSiteVisitBill = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [bill, setBill] = useState<SiteVisitBillDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBill = async () => {
            if (!id) return;
            try {
                const response = await fetch(`${ENDPOINTS.SITEVISIT_BILLS.BASE}/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const text = await response.text();
                    let res;
                    try {
                        res = JSON.parse(text);
                    } catch (e) {
                        // Robust JSON parsing as used elsewhere
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try { res = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                        } else {
                            console.error('Error parsing JSON:', e);
                        }
                    }

                    if (res && res.status) {
                        setBill(res.data);
                    } else {
                        setError(res?.message || 'Failed to load bill details');
                    }
                } else {
                    setError('Failed to load bill details');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchBill();
    }, [id, token]);

    const handlePrint = () => {
        if (id) {
            window.open(ENDPOINTS.SITEVISIT_BILLS.PRINT(id), '_blank');
        }
    }

    const getAttachmentUrl = (bill: SiteVisitBillDetails) => {
        if (bill.media_url) return bill.media_url;
        if (bill.bill_attachment) {
            // Construct URL assuming API_BASE_URL is something like domain/api
            // and we want domain/path_from_db
            try {
                const url = new URL(ENDPOINTS.SITEVISIT_BILLS.BASE);
                const origin = url.origin;
                // The path in DB is 'core/public/sitevisitbills/...'
                // We probably need to append it to origin.
                // Check if there are duplicate slashes
                const cleanPath = bill.bill_attachment.startsWith('/') ? bill.bill_attachment.substring(1) : bill.bill_attachment;
                return `${origin}/${cleanPath}`;
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    if (loading) return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (error || !bill) return <div className="p-6 text-center text-red-500">{error || 'Bill not found'}</div>;

    const attachmentUrl = getAttachmentUrl(bill);

    const DetailItem = ({ icon: Icon, label, value }: { icon?: any, label: string, value: string | number | null | undefined | React.ReactNode }) => (
        <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
            {Icon && <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 mt-[-2px]"><Icon size={14} /></div>}
            <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <div className="text-sm font-medium text-gray-800 leading-tight break-words">{value || <span className="text-gray-300 italic">--</span>}</div>
            </div>
        </div>
    );

    // Helper to get vendor name safely
    const getVendorName = (bill: SiteVisitBillDetails) => {
        if (typeof bill.vendor === 'string') return bill.vendor;
        if (bill.vendor?.fullname) return `${bill.vendor.fullname} ${bill.vendor.surname || ''}`.trim();
        if (bill.vendor_name) return bill.vendor_name;
        return 'Unknown';
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/expenses/site-visit">Site Visit Expenses</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>View Bill #{bill.bill_number}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/expenses/site-visit')} className="rounded-full">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bill Details</h1>
                        <p className="text-sm text-gray-500">View site visit expense information</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer size={16} /> Print
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/expenses/site-visit/edit/${id}`)}>
                        Edit Bill
                    </Button>
                </div>
            </div>

            {/* Single Unified Card */}
            <Card className="shadow-sm">
                <CardHeader className="border-b bg-gray-50/40 pb-3 py-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Details Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">

                    {/* Main Grid Layout for Data */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                        {/* Generic Info Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2 uppercase tracking-tight">
                                <FileText className="text-blue-600" size={16} />
                                Generic Information
                            </h3>
                            <div className="flex flex-col gap-1">
                                <DetailItem label="Bill Number" value={bill.bill_number} />
                                <DetailItem icon={Building2} label="Branch" value={bill.branch?.location} />
                                <DetailItem icon={User} label="Paid To" value={getVendorName(bill)} />
                                <DetailItem label="Company" value={bill.company?.name} />
                                <DetailItem label="Paid Account" value={bill.account?.name} />
                            </div>
                        </div>

                        {/* Payment Info Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2 uppercase tracking-tight">
                                <Banknote className="text-green-600" size={16} />
                                Payment Details
                            </h3>
                            <div className="flex flex-col gap-1">
                                <DetailItem icon={Calendar} label="Payment Date" value={bill.payment_date ? new Date(bill.payment_date).toLocaleDateString() : '-'} />
                                <DetailItem label="Amount" value={<span className="font-bold text-green-700">₹ {bill.amount}</span>} />
                                <DetailItem label="Payment Method" value={bill.payment_method} />
                                {(bill.payment_method === 'CHEQUE' || bill.payment_method === 'DD') && (
                                    <>
                                        <DetailItem label="Instrument Number" value={bill.payment_method === 'CHEQUE' ? bill.cheque_number : bill.dd_number} />
                                        <DetailItem label="Drawn On" value={bill.drawnon ? new Date(bill.drawnon).toLocaleDateString() : '-'} />
                                    </>
                                )}
                                {bill.payment_method !== 'CHEQUE' && bill.payment_method !== 'DD' && (
                                    <DetailItem label="Transaction Details" value={bill.details} />
                                )}
                                <DetailItem label="Notes" value={bill.notes} />
                            </div>
                        </div>

                        {/* Site Visit Info Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2 uppercase tracking-tight">
                                Site Visit Reference
                            </h3>
                            {bill.sitevisit ? (
                                <div className="flex flex-col gap-1">
                                    <DetailItem label="Site Visit ID" value={`#${bill.sitevisit.id}`} />
                                    <DetailItem label="Status" value={bill.sitevisit.status} />
                                    <DetailItem label="Date" value={new Date(bill.sitevisit.date || bill.sitevisit.created_at).toLocaleDateString()} />
                                    <DetailItem label="Vehicle" value={bill.sitevisit.vehical ? `${bill.sitevisit.vehical.number} (${bill.sitevisit.vehical.ownedby})` : 'N/A'} />
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic">No linked site visit details found.</p>
                            )}
                        </div>
                    </div>

                    {/* Attachment Section */}
                    {attachmentUrl && (
                        <div className="border rounded-lg overflow-hidden mt-4">
                            <div className="bg-gray-50 px-4 py-3 border-b">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    Attachment
                                </h3>
                            </div>
                            <div className="bg-white p-4">
                                <a
                                    href={attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    View/Download Attachment
                                </a>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export default ViewSiteVisitBill;
