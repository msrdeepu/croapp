import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Plus, Search, Loader2, MoreVertical, Edit, FileText, FileSpreadsheet, Eye, User } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "src/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "src/components/ui/dialog";
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface VehicleOwner {
    id: number;
    code: string;
    fullname: string;
    surname: string;
    organization: string;
    mobile: string;
    email: string;
    enabled: number;
    created_at: string;
    photo?: string;
    // Add other fields as necessary for View modal
    branch_id?: number;
    dob?: string;
    phone?: string;
    altmobile?: string;
    whatsapp?: string;
    website?: string;
    pan?: string;
    aadhar?: string;
    taxid?: string;
    joined_on?: string;
    address?: string;
    country?: any;
    state?: any;
    district?: any;
    pincode?: string;
    login?: number;
}

const ManageVehicleOwners = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [owners, setOwners] = useState<VehicleOwner[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOwnerData, setSelectedOwnerData] = useState<any>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    useEffect(() => {
        fetchOwners();
    }, [token]);

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/vehicle-owners`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                if (text.startsWith('[]') && text.length > 2) {
                    text = text.substring(2);
                }
                try {
                    const data = JSON.parse(text);
                    setOwners(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.error("JSON Parse Error in fetchOwners:", e, "Raw Text:", text);
                }
            }
        } catch (error) {
            console.error("Error fetching owners:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOwner = () => {
        navigate('/crm/vehicle-owners/create');
    };

    const handleEditOwner = (owner: VehicleOwner) => {
        navigate(`/crm/vehicle-owners/edit/${owner.id}`);
    };

    const handleViewOwner = (owner: VehicleOwner) => {
        setSelectedOwnerData(owner);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredOwners = owners.filter(o =>
        o.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOwners.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);


    const exportToCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(owners);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "VehicleOwners");
        XLSX.writeFile(workbook, "VehicleOwners.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['ID', 'Code', 'Name', 'Organization', 'Mobile', 'Email', 'Active', 'Created At']],
            body: owners.map(o => [
                o.id,
                o.code,
                `${o.fullname} ${o.surname || ''}`,
                o.organization,
                o.mobile,
                o.email,
                o.enabled === 1 ? 'Yes' : 'No',
                new Date(o.created_at).toLocaleDateString()
            ]),
        });
        doc.save("VehicleOwners.pdf");
    };

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Vehicle Owners</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={handleAddOwner} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Vehicle Owner
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Vehicle Owners List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search owners..."
                                    className="pl-8 w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Rows per page</span>
                            <Select
                                value={`${itemsPerPage}`}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={itemsPerPage} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Photo</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : currentItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            No vehicle owners found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((owner) => (
                                        <TableRow key={owner.id}>
                                            <TableCell>{owner.id}</TableCell>
                                            <TableCell>
                                                {owner.photo ? (
                                                    <img
                                                        src={owner.photo}
                                                        alt={owner.fullname}
                                                        className="h-10 w-10 rounded-md object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setSelectedPhoto(owner.photo!)}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 ${owner.photo ? 'hidden' : ''}`}>
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </TableCell>
                                            <TableCell>{owner.code}</TableCell>
                                            <TableCell className="font-medium">{owner.fullname} {owner.surname}</TableCell>
                                            <TableCell>{owner.organization}</TableCell>
                                            <TableCell>{owner.mobile}</TableCell>
                                            <TableCell>{owner.email}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${owner.enabled === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {owner.enabled === 1 ? 'YES' : 'NO'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(owner.created_at), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleViewOwner(owner)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditOwner(owner)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm text-gray-500">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Photo Preview Dialog */}
            <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-0 shadow-none">
                    <DialogTitle className="sr-only">Photo Preview</DialogTitle>
                    <div className="relative">
                        <img
                            src={selectedPhoto || ''}
                            alt="Preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vehicle Owner Details - #{selectedOwnerData?.code}</DialogTitle>
                    </DialogHeader>
                    {selectedOwnerData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500">Full Name</div>
                                    <div className="font-medium">{selectedOwnerData.fullname} {selectedOwnerData.surname}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Organization</div>
                                    <div className="font-medium">{selectedOwnerData.organization || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Mobile</div>
                                    <div className="font-medium">{selectedOwnerData.mobile}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Email</div>
                                    <div className="font-medium">{selectedOwnerData.email || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Branch</div>
                                    <div className="font-medium">{selectedOwnerData.branch_id}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Status</div>
                                    <div className={`font-medium ${selectedOwnerData.enabled === 1 ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedOwnerData.enabled === 1 ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default ManageVehicleOwners;
