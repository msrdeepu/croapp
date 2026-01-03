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

interface TransportBillDetails {
    id: number;
    bill_number: string;
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
    media_url: string | null;
    bill_attachment?: string;
    vendor: any;
    branch: any;
    billingcategory: any;
    company: any;
    account: any;
    vehicle: any;
    purpose: string;
    created_at: string;
    vendor_name?: string;
}

const ViewTransportBill = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [bill, setBill] = useState<TransportBillDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBill = async () => {
            if (!id) return;
            try {
                const response = await fetch(`${ENDPOINTS.TRANSPORT_BILLS.BASE}/${id}`, {
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
            window.open(ENDPOINTS.TRANSPORT_BILLS.PRINT(id), '_blank');
        }
    }

    const getAttachmentUrl = (bill: TransportBillDetails) => {
        if (bill.media_url) return bill.media_url;
        if (bill.bill_attachment) {
            try {
                const url = new URL(ENDPOINTS.TRANSPORT_BILLS.BASE);
                const origin = url.origin;
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

    const getVendorName = (bill: TransportBillDetails) => {
        if (typeof bill.vendor === 'string') return bill.vendor;
        if (bill.vendor?.fullname) return `${bill.vendor.fullname} ${bill.vendor.surname || ''} ${bill.vendor.organization ? `- ${bill.vendor.organization}` : ''}`.trim();
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
                            <BreadcrumbLink href="/expenses/transport">Transport Expenses</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>View Bill #{bill.bill_number}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/expenses/transport')} className="rounded-full">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bill Details</h1>
                        <p className="text-sm text-gray-500">View transport expense information</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer size={16} /> Print
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/expenses/transport/edit/${id}`)}>
                        Edit Bill
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="border-b bg-gray-50/40 pb-3 py-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Details Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
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
                                <DetailItem label="Vehicle" value={bill.vehicle ? `${bill.vehicle.number} (${bill.vehicle.ownedby})` : '-'} />
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
                            </div>
                        </div>

                        {/* Additional Info Section */}
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3 border-b pb-2 uppercase tracking-tight">
                                Additional Information
                            </h3>
                            <div className="flex flex-col gap-1">
                                <DetailItem label="Payment Type" value={bill.billingcategory?.name} />
                                <DetailItem label="Purpose" value={bill.purpose} />
                                <DetailItem label="Notes" value={bill.notes} />
                                <DetailItem label="Created On" value={bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '-'} />
                            </div>
                        </div>

                    </div>

                    {/* Attachment Section */}
                    {attachmentUrl && (
                        <div className="border rounded-lg overflow-hidden mt-4">
                            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    Attachment
                                </h3>
                            </div>
                            <div className="bg-gray-100/50 p-4 flex justify-center">
                                <img src={attachmentUrl} alt="Bill Attachment" className="max-h-[400px] object-contain rounded shadow-sm" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ViewTransportBill;
