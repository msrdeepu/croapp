import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Plus, Search, Loader2, MoreVertical, Edit, FileText, FileSpreadsheet, Eye } from 'lucide-react';
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
import VehicleForm from './VehicleForm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Vehicle {
    id: number;
    vehical: string;
    number: string;
    owner: string;
    ownercontact: string;
    driver: string;
    drivercontact: string;
    created_at: string;
    // ... other fields
}

const ManageVehicles = () => {
    const { token } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination (Client-side for now as per index example fetching all and using datatables, but we'll try to stick to server-side if API supports, but let's assume simple list for now as index controller example returned all or paginated)
    // Actually the Laravel Controller index method returns `Vehical::all()` for `Datatables::of($data)`. 
    // The API controller I wrote returns `Vehical::latest()->get()`. So it's all data.
    // Client-side pagination/sorting/searching is fine for moderate datasets.

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);
    const [selectedVehicleData, setSelectedVehicleData] = useState<any>(null);

    useEffect(() => {
        fetchVehicles();
    }, [token]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/vehicals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                let text = await response.text();
                if (text.startsWith('[]') && text.length > 2) {
                    text = text.substring(2);
                }
                try {
                    const data = JSON.parse(text);
                    setVehicles(Array.isArray(data) ? data : []);
                } catch (e) {
                    console.error("JSON Parse Error in fetchVehicles:", e, "Raw Text:", text);
                }
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = () => {
        setSelectedVehicleId(undefined);
        setSelectedVehicleData(null);
        setIsModalOpen(true);
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setSelectedVehicleId(vehicle.id);
        setSelectedVehicleData(vehicle);
        setIsModalOpen(true);
    };

    const handleViewVehicle = (vehicle: Vehicle) => {
        setSelectedVehicleData(vehicle);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredVehicles = vehicles.filter(v =>
        v.vehical.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);


    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchVehicles();
    };

    const exportToCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(vehicles);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicles");
        XLSX.writeFile(workbook, "Vehicles.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['ID', 'Vehicle', 'Number', 'Owner', 'Driver', 'Created At']],
            body: vehicles.map(v => [
                v.id,
                v.vehical,
                v.number,
                v.owner,
                v.driver,
                new Date(v.created_at).toLocaleDateString()
            ]),
        });
        doc.save("Vehicles.pdf");
    };

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Vehicles</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={handleAddVehicle} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Vehicles List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search vehicles..."
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
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : currentItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No vehicles found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell>{vehicle.id}</TableCell>
                                            <TableCell>{vehicle.vehical}</TableCell>
                                            <TableCell className="font-medium">{vehicle.number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{vehicle.owner}</span>
                                                    <span className="text-xs text-muted-foreground">{vehicle.ownercontact}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{vehicle.driver}</span>
                                                    <span className="text-xs text-muted-foreground">{vehicle.drivercontact}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(vehicle.created_at), 'dd/MM/yyyy')}
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
                                                        <DropdownMenuItem onClick={() => handleViewVehicle(vehicle)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
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

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedVehicleId ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                    </DialogHeader>
                    <VehicleForm
                        vehicleId={selectedVehicleId}
                        initialData={selectedVehicleData}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Vehicle Details - #{selectedVehicleData?.id}</DialogTitle>
                    </DialogHeader>
                    {selectedVehicleData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500">Vehicle Type</Label>
                                    <div className="font-medium">{selectedVehicleData.vehical}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Vehicle Number</Label>
                                    <div className="font-medium">{selectedVehicleData.number}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Driver Name</Label>
                                    <div className="font-medium">{selectedVehicleData.driver}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Driver Contact</Label>
                                    <div className="font-medium">{selectedVehicleData.drivercontact}</div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Ownership Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-gray-500">Owned By</Label>
                                        <div className="font-medium">{selectedVehicleData.ownedby}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Owner Name</Label>
                                        <div className="font-medium">{selectedVehicleData.owner}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Owner Contact</Label>
                                        <div className="font-medium">{selectedVehicleData.ownercontact}</div>
                                    </div>
                                </div>
                            </div>

                            {selectedVehicleData.details && (
                                <div className="border-t pt-4">
                                    <Label className="text-xs text-gray-500">Additional Details</Label>
                                    <div className="mt-1 text-sm bg-gray-50 p-3 rounded-md">
                                        {selectedVehicleData.details}
                                    </div>
                                </div>
                            )}

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

export default ManageVehicles;
