import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
    Loader2,
    ArrowLeft,
    Phone,
    Mail,
    MessageCircle,
    MapPin,
    Calendar,
    Briefcase,
    Building2,
    User,
    CreditCard,
    Globe,
    Shield,
    CheckCircle2,
    AlertCircle,
    X,
    Pencil,
    Trash2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "src/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { cn } from 'src/lib/utils';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS, API_BASE_URL } from 'src/config';

// Define Interface matching DB columns
interface CustomerDetails {
    id: number;
    code: string;
    fullname: string;
    surname: string;
    mobile: string;
    email: string;
    photo: string | null;
    enabled: number;
    created_at: string;
    joined_on: string;
    dob: string;
    address: string;
    pincode: string;
    careof: string;
    careof_relationship: string;
    branch_id: number;
    branch?: number | any; // Allow object (with location) or number
    organization: string;
    occupation: number; // ID
    nationality: number; // ID
    pan: string;
    aadhar: string;
    taxid: string;
    nominee: string;
    nominee_relationship: string;
    nominee_dob: string;
    nominee_address: string;
    whatsapp: string;
    altmobile: string;
    phone: string;
    website: string;
    state: number | any; // Allow object or number
    district: number | any; // Allow object or number
    country: number | any; // Allow object or number
    login: number;
}



const calculateAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const ViewCustomer = () => {
    const { id } = useParams();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Delete & Toast State
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!id) return;
            try {
                // Determine URL: User said "show" is GET /{customer} inside prefix 'customers'
                // So it should be BASE/customers/{id}
                const response = await fetch(`${ENDPOINTS.CUSTOMERS.LIST}/${id}`, {
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
                        } else {
                            console.error("JSON Parse Error:", e);
                        }
                    }

                    // Handle potential array wrapping
                    const data = Array.isArray(rawData) ? rawData[0] : rawData;

                    if (data && data.data) {
                        setCustomer(data.data);
                    } else if (data) {
                        // Fallback if structure is flat
                        setCustomer(data);
                    }
                } else {
                    setError('Failed to load customer details');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [id, token]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 3000);
    };

    const confirmDelete = async () => {
        if (!id) return;
        try {
            const response = await fetch(ENDPOINTS.CUSTOMERS.DELETE(id), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });

            if (response.ok) {
                showAlert('success', 'Deleted', 'Customer deleted successfully');
                setTimeout(() => navigate('/customers/manage'), 1500);
            } else {
                const text = await response.text();
                showAlert('error', 'Error', 'Failed to delete customer: ' + text);
                setDeleteConfirmationOpen(false);
            }
        } catch (err) {
            console.error("Delete Error", err);
            showAlert('error', 'Error', 'An error occurred during deletion');
            setDeleteConfirmationOpen(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (error || !customer) return <div className="p-6 text-center text-red-500">{error || 'Customer not found'}</div>;

    const DetailItem = ({ icon: Icon, label, value }: { icon?: any, label: string, value: string | number | null | undefined }) => (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
            {Icon && <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-[-2px]"><Icon size={16} /></div>}
            <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{value || <span className="text-gray-300 italic">Not Provided</span>}</p>
            </div>
        </div>
    );

    const getStatusColor = (status: number) => status === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200';

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300">
                        <Alert className={cn("shadow-2xl border-0 p-4 flex items-start gap-4 text-white rounded-xl relative pr-10", alert.type === 'success' ? "bg-green-500" : "bg-red-500")}>
                            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-white" /> : <AlertCircle className="h-6 w-6 text-white" />}
                            <div><AlertTitle className="font-bold text-white">{alert.title}</AlertTitle><AlertDescription className="text-white/90">{alert.message}</AlertDescription></div>
                            <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-4 w-4" /></button>
                        </Alert>
                    </div>
                ))}
            </div>

            <Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this customer? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmationOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/customers/manage')} className="rounded-full">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Profile</h1>
                        <p className="text-gray-500 text-sm">View and manage customer details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDeleteConfirmationOpen(true)} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                        <Trash2 size={16} /> Delete
                    </Button>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => navigate(`/customers/edit/${id}`)}>
                        <Pencil size={16} /> Edit Profile
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Sidebar: ID Card Style */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-100">
                        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                            <div className="absolute top-4 right-4">
                                <Badge className={`${getStatusColor(customer.enabled)} border-0 px-3 py-1`}>
                                    {customer.enabled === 1 ? 'ACTIVE' : 'INACTIVE'}
                                </Badge>
                            </div>
                        </div>
                        <CardContent className="pt-0 relative px-6 pb-6">
                            <div className="flex justify-center -mt-16 mb-4">
                                <div className="h-32 w-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex items-center justify-center">
                                    {customer.photo ?
                                        <img src={customer.photo.startsWith('http') ? customer.photo : `${API_BASE_URL}/${customer.photo}`} alt={customer.fullname} className="h-full w-full object-cover" />
                                        : <User size={48} className="text-gray-300" />
                                    }
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">{customer.fullname}</h2>
                                <p className="text-sm text-gray-500 font-medium">{customer.code}</p>
                                <div className="flex justify-center gap-2 mt-2">
                                    {customer.login === 1 && <Badge variant="outline" className="border-blue-200 text-blue-600 bg-blue-50">Portal Access</Badge>}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => window.open(`tel:${customer.mobile}`)}>
                                    <Phone size={18} />
                                    <span className="text-[10px]">Call</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200" onClick={() => window.open(`https://wa.me/${customer.whatsapp || customer.mobile}`)}>
                                    <MessageCircle size={18} />
                                    <span className="text-[10px]">WhatsApp</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-auto py-3 gap-1 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200" onClick={() => window.open(`mailto:${customer.email}`)}>
                                    <Mail size={18} />
                                    <span className="text-[10px]">Email</span>
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <DetailItem icon={Calendar} label="Joined On" value={new Date(customer.joined_on).toLocaleDateString('en-GB')} />
                                <DetailItem icon={Building2} label="Branch" value={customer.branch ? (typeof customer.branch === 'object' ? (customer.branch.location || customer.branch.name) : customer.branch) : customer.branch_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Contact Info */}
                    <Card className="border-0 shadow-md ring-1 ring-gray-100">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-base">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-1">
                            <DetailItem icon={Phone} label="Mobile" value={customer.mobile} />
                            <DetailItem icon={Phone} label="Alt. Mobile" value={customer.altmobile} />
                            <DetailItem icon={Phone} label="Landline" value={customer.phone} />
                            <DetailItem icon={Mail} label="Email" value={customer.email} />
                            <DetailItem icon={Globe} label="Website" value={customer.website} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content: Tabs */}
                <div className="lg:col-span-8">
                    <Card className="border-0 shadow-md ring-1 ring-gray-100 h-full">
                        <CardHeader className="border-b px-6 py-4">
                            <Tabs defaultValue="personal" className="w-full">
                                <div className="flex justify-between items-center mb-0">
                                    <TabsList className="grid w-full max-w-md grid-cols-3">
                                        <TabsTrigger value="personal">Personal</TabsTrigger>
                                        <TabsTrigger value="official">Official & IDs</TabsTrigger>
                                        <TabsTrigger value="nominee">Nominee</TabsTrigger>
                                    </TabsList>
                                </div>
                                <div className="mt-6">
                                    <TabsContent value="personal" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="text-blue-600" size={20} /> Personal Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            <DetailItem label="Full Name" value={customer.fullname} />
                                            <DetailItem label="Surname" value={customer.surname} />
                                            <DetailItem label="Date of Birth" value={new Date(customer.dob).toLocaleDateString('en-GB')} />
                                            <DetailItem label="Age" value={`${calculateAge(customer.dob)} Years`} />
                                            <DetailItem label="Care Of" value={`${customer.careof} (${customer.careof_relationship})`} />
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                                <MapPin className="text-blue-600" size={20} /> Address Details
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                <DetailItem label="Address" value={customer.address} />
                                                <DetailItem label="Pincode" value={customer.pincode} />
                                                <DetailItem label="District" value={customer.district ? (typeof customer.district === 'object' ? (customer.district.name || customer.district.title) : customer.district) : 'Not Provided'} />
                                                <DetailItem label="State" value={customer.state ? (typeof customer.state === 'object' ? (customer.state.name || customer.state.title) : customer.state) : 'Not Provided'} />
                                                <DetailItem label="Country" value={customer.country ? (typeof customer.country === 'object' ? (customer.country.name || customer.country.title) : customer.country) : 'Not Provided'} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="official" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Briefcase className="text-blue-600" size={20} /> Professional Info
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            <DetailItem label="Organization" value={customer.organization} />
                                            <DetailItem label="Occupation" value={customer.occupation} />
                                            <DetailItem label="Nationality" value={customer.nationality} />
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                                <Shield className="text-blue-600" size={20} /> Identity Proofs
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                                <DetailItem icon={CreditCard} label="PAN Number" value={customer.pan} />
                                                <DetailItem icon={CreditCard} label="Aadhar Number" value={customer.aadhar} />
                                                <DetailItem icon={CreditCard} label="GST / Tax ID" value={customer.taxid} />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="nominee" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="text-blue-600" size={20} /> Nominee Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            <DetailItem label="Nominee Name" value={customer.nominee} />
                                            <DetailItem label="Relationship" value={customer.nominee_relationship} />
                                            <DetailItem label="Date of Birth" value={customer.nominee_dob ? new Date(customer.nominee_dob).toLocaleDateString('en-GB') : null} />
                                        </div>
                                        <div className="pt-4 border-t">
                                            <DetailItem label="Nominee Address" value={customer.nominee_address} />
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ViewCustomer;
