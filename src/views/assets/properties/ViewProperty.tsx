
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';

const ViewProperty = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [venture, setVenture] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
                const res = await fetch(`${API_BASE_URL}/properties/${id}`, { headers });

                // Robust JSON parsing
                const text = await res.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    const first = text.indexOf('{');
                    const last = text.lastIndexOf('}');
                    if (first !== -1 && last !== -1) {
                        result = JSON.parse(text.substring(first, last + 1));
                    }
                }

                let propData = result;
                if (result) {
                    if (result.data && result.data.property) {
                        propData = result.data.property;
                    } else if (result.data) {
                        propData = result.data;
                    } else if (result.media) {
                        propData = result.media;
                    }
                }

                if (propData && propData.id) {
                    setData(propData);

                    // Fetch Venture details if we have ID
                    if (propData.venture_id) {
                        const vRes = await fetch(`${API_BASE_URL}/ventures/${propData.venture_id}`, { headers });
                        const vText = await vRes.text();
                        let vResult;
                        try {
                            vResult = JSON.parse(vText);
                        } catch (e) {
                            const first = vText.indexOf('{');
                            const last = vText.lastIndexOf('}');
                            if (first !== -1 && last !== -1) vResult = JSON.parse(vText.substring(first, last + 1));
                        }
                        let ventureData = vResult;
                        if (vResult) {
                            if (vResult.data && vResult.data.venture) {
                                ventureData = vResult.data.venture;
                            } else if (vResult.data) {
                                ventureData = vResult.data;
                            } else if (vResult.media) {
                                ventureData = vResult.media;
                            }
                        }
                        if (ventureData) setVenture(ventureData);
                    }
                }
            } catch (error) {
                console.error("Error fetching property details", error);
            } finally {
                setLoading(false);
            }
        };

        if (id && token) fetchData();
    }, [id, token]);


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="text-center py-10">Property not found.</div>;
    }

    // Helper for displaying fields
    const InfoField = ({ label, value, className = "" }: { label: string, value: any, className?: string }) => (
        <div className={`space-y-1 ${className}`}>
            <Label className="text-xs text-muted-foreground uppercase font-semibold">{label}</Label>
            <div className="font-medium text-sm break-words">{value || '-'}</div>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <BreadcrumbComp title={`View Property: ${data.code}`} />

            <div className="flex justify-end">
                <Link to="/assets/properties">
                    <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
                </Link>
            </div>

            {/* Core Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Property Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <InfoField label="Code" value={data.code} />
                    <InfoField label="Title" value={data.title} />
                    <InfoField label="Venture" value={venture?.title} />
                    <InfoField label="Location" value={`${data.location}, ${data.village}`} />
                    <InfoField label="Plot No" value={data.plot_no} />
                    <InfoField label="Facing" value={data.facing} />
                    <InfoField label="Road Size" value={data.roadsize ? `${data.roadsize} Ft` : '-'} />
                    <InfoField label="Status" value={<Badge variant="outline">{data.status}</Badge>} />
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dimensions */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Dimensions & Area</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <InfoField label="Dimensions" value={data.dimensions} />
                        <InfoField label="Length x Width" value={`${data.length} x ${data.width}`} />
                        <InfoField label="Total Sq. Ft" value={data.srq_feets} />
                        <InfoField label="Total Sq. Yards" value={data.srq_yards} />
                        <InfoField label="Total Ankanams" value={data.ankanams} />
                    </CardContent>
                </Card>

                {/* Pricing - Displaying all financial data even if hid in CRO Form */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Pricing & Valuation</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <InfoField label="Plot Price" value={`₹${data.price}`} />
                        <InfoField label="Ankanam Cost" value={`₹${data.ankanam_cost}`} />
                        <InfoField label="Discount" value={`₹${data.discount}`} />
                        <InfoField label="Total Cost" value={<span className="text-green-600 font-bold">₹{data.total_cost}</span>} />
                        <InfoField label="Market Cost" value={data.market_cost ? `₹${data.market_cost}` : '-'} />
                        <InfoField label="Registration Amount" value={data.registration_amount ? `₹${data.registration_amount}` : '-'} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment & Status */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Customer & Agent Assignment</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <InfoField label="Assigned Customer ID" value={data.customer_id} />
                        <InfoField label="Customer Name" value={data.customer_name} />
                        <div className="border-t pt-4 mt-2">
                            <InfoField label="Assigned Agent ID" value={data.profile_id} />
                            <InfoField label="Agent Code" value={data.agent_code} />
                        </div>
                    </CardContent>
                </Card>

                {/* Other Info */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Additional Information</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <InfoField label="Boundaries (N/S/E/W)" value={`${data.boundry_north || '-'} / ${data.boundry_south || '-'} / ${data.boundry_east || '-'} / ${data.boundry_west || '-'}`} className="col-span-2" />
                        <InfoField label="Authority" value={data.authority} />
                        <InfoField label="Booking Date" value={data.booking ? data.booking.split(' ')[0] : '-'} />
                        <InfoField label="Installment Amount" value={data.installment} />
                        <InfoField label="Total Installments" value={data.installments} />
                        <InfoField label="Remarks" value={data.status_remarks} className="col-span-2" />
                        <InfoField label="Address" value={data.address} className="col-span-2" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ViewProperty;
