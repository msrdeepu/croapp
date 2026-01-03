import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Link, useNavigate } from 'react-router';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import { MoreHorizontal, UserPlus, Loader2, Eye, Pencil, Trash2, MessageCircle, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "src/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';

interface Customer {
    id: number;
    code: string;
    fullname: string;
    name: string; // Added name field from API
    mobile: string;
    email: string;
    enabled: number; // Assuming 1 or 0
    created_at: string;
    photo: string;
}

const ManageCustomers = () => {
    const { token } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Delete & Toast State
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const response = await fetch(ENDPOINTS.CUSTOMERS.LIST, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                if (response.ok) {
                    const text = await response.text();
                    let rawData: any;
                    try {
                        rawData = JSON.parse(text);
                        console.log("Raw API Response:", rawData);
                    } catch (e) {
                        // Parse Error Handling for "[]{...}" case
                        if (text.trim().startsWith('[]{')) {
                            console.warn("Detected malformed JSON prefix '[]', attempting to fix...");
                            try {
                                const fixedText = text.trim().substring(2);
                                rawData = JSON.parse(fixedText);
                                console.log("Fixed API Response:", rawData);
                            } catch (e2) {
                                console.error("Failed to parse fixed JSON", e2);
                            }
                        } else {
                            console.error("JSON Parse Error", e);
                        }
                    }

                    let dataToSet: Customer[] = [];

                    if (Array.isArray(rawData)) {
                        // Case 1: Root array of customers [ {id:1...}, {id:2...} ]
                        const firstItem = rawData[0];
                        if (firstItem && (firstItem.id || firstItem.code)) {
                            dataToSet = rawData;
                        }
                        // Case 2: Wrapped array [{ data: [...] }]
                        else if (firstItem && firstItem.data && Array.isArray(firstItem.data)) {
                            dataToSet = firstItem.data;
                        }
                    } else if (rawData && typeof rawData === 'object') {
                        // Case 3: Standard Object { data: [...] }
                        if (rawData.data && Array.isArray(rawData.data)) {
                            dataToSet = rawData.data;
                        }
                    }

                    setCustomers(dataToSet);
                } else {
                    console.error("Failed to fetch customers");
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, [token]);

    const filteredCustomers = customers.filter(customer =>
        (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || customer.fullname?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        customer.code?.includes(searchTerm) ||
        customer.mobile?.includes(searchTerm) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 3000);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(ENDPOINTS.CUSTOMERS.DELETE(deleteId), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });

            if (response.ok) {
                setCustomers(prev => prev.filter(c => c.id !== deleteId));
                showAlert('success', 'Deleted', 'Customer deleted successfully');
                setDeleteId(null);
            } else {
                const text = await response.text();
                showAlert('error', 'Error', 'Failed to delete customer: ' + text);
            }
        } catch (err) {
            console.error("Delete Error", err);
            showAlert('error', 'Error', 'An error occurred during deletion');
        }
    };

    if (loading) {
        return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-6">
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

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this customer? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none">
                    <DialogTitle className="sr-only">Photo Preview</DialogTitle>
                    <div className="relative">
                        <img
                            src={selectedPhoto || ''}
                            alt="Customer Preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <h2 className="text-xl font-semibold mb-4 text-ld">Manage Customers</h2>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>List Of Customers</CardTitle>
                    <Link to="/customers/create">
                        <Button className="bg-[#7367F0] hover:bg-[#685dd8] text-white">
                            <UserPlus className="mr-2 h-4 w-4" /> New Customer
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {/* Controls */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Show</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-gray-500">entries</span>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Label className="text-sm text-gray-500">Search:</Label>
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="h-8 w-full md:w-[200px]"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[80px]">No#</TableHead>
                                    <TableHead className="w-[60px]">Photo</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Active</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentCustomers.length > 0 ? (
                                    currentCustomers.map((customer, index) => (
                                        <TableRow key={customer.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-600">
                                                {indexOfFirstItem + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {customer.photo ? (
                                                    <img
                                                        src={customer.photo}
                                                        alt={customer.name}
                                                        className="h-10 w-10 rounded-md object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setSelectedPhoto(customer.photo)}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 ${customer.photo ? 'hidden' : ''}`}>
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-900">{customer.code}</TableCell>
                                            <TableCell className="font-medium text-gray-700">{customer.name || customer.fullname}</TableCell>
                                            <TableCell className="text-gray-600">{customer.mobile}</TableCell>
                                            <TableCell className="text-gray-600">{customer.email}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${Number(customer.enabled) === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {Number(customer.enabled) === 1 ? 'YES' : 'NO'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {new Date(customer.created_at).toLocaleDateString('en-GB')}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link to={`/customers/view/${customer.id}`} className="cursor-pointer flex items-center">
                                                                <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                                                <span>View</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/customers/edit/${customer.id}`)}>
                                                            <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                                                            <span>Edit Details</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            <span>WhatsApp verify</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteId(customer.id)} className="text-red-600 cursor-pointer">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-gray-500">
                            Showing {filteredCustomers.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
                        </div>
                        <div className="flex max-md:flex-col gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageCustomers;
