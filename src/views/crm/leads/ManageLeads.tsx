import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Plus, Search, Loader2, ArrowUpDown, FileText, FileSpreadsheet, MoreVertical, Edit, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "src/components/ui/dialog";
import LeadForm from './LeadForm';
import { Label } from 'src/components/ui/label';
import { format } from 'date-fns';

interface Lead {
    id: number;
    name: string;
    mobile: string;
    project?: string; // or oneventure
    property?: string; // or oneproperty
    sitevisiton?: string;
    budget?: string;
    created_at: string;
    user?: {
        name: string;
    };
    oneventure?: string;
    oneproperty?: string;
    status: string;
    email?: string;
    source?: string;
    notes?: string;
    twoventure?: string;
    twoproperty?: string;
    threeventure?: string;
    threeproperty?: string;
    fourventure?: string;
    fourproperty?: string;
}

const ManageLeads = () => {
    const { token } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(undefined);
    const [selectedLeadData, setSelectedLeadData] = useState<any>(null);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchLeads();
    }, [token, currentPage, itemsPerPage, sortConfig, searchTerm]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('per_page', itemsPerPage.toString());
            if (searchTerm) params.append('search', searchTerm);
            if (sortConfig) {
                params.append('sort_by', sortConfig.key);
                params.append('sort_direction', sortConfig.direction);
            }

            const response = await fetch(`${API_BASE_URL}/leads?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                let text = await response.text();
                // Verify if response starts with [] and strip it if it's a prefix to actual data
                // The error 'Unexpected non-whitespace character after JSON at position 2' suggests
                // the response might be '[]...' or similar. 
                // However, strictly '[]' is valid JSON. The error implies something AFTER the first valid JSON unit.
                // If the backend returns '[]{...}' or '[][...]', we need to handle it.
                // Based on previous fixes, we strip '[]' if it appears at the start and the rest looks like json.
                if (text.startsWith('[]') && text.length > 2) {
                    text = text.substring(2);
                }

                try {
                    const data = JSON.parse(text);
                    if (data.data) {
                        setLeads(data.data);
                        setTotalItems(data.total);
                    } else if (Array.isArray(data)) {
                        // Fallback if API returns array directly
                        setLeads(data);
                        setTotalItems(data.length);
                    }
                } catch (e) {
                    console.error("JSON Parse Error in fetchLeads:", e, "Raw Text:", text);
                }
            } else {
                console.error("Failed to fetch leads");
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof Lead) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleAddLead = () => {
        setSelectedLeadId(undefined);
        setSelectedLeadData(null);
        setIsModalOpen(true);
    };

    const handleEditLead = (lead: Lead) => {
        setSelectedLeadId(lead.id);
        setSelectedLeadData(lead);
        setIsModalOpen(true);
    };

    const handleViewLead = (lead: Lead) => {
        setSelectedLeadData(lead);
        setIsViewModalOpen(true);
    };



    const handleFormSuccess = () => {
        setIsModalOpen(false);
        fetchLeads();
    };

    const exportToCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(leads);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, "Leads.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['ID', 'Name', 'Mobile', 'Venture', 'Status', 'Date']],
            body: leads.map(lead => [
                lead.id,
                lead.name,
                lead.mobile,
                lead.project || lead.oneventure || '-',
                lead.status,
                new Date(lead.created_at).toLocaleDateString()
            ]),
        });
        doc.save("Leads.pdf");
    };

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Leads</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={handleAddLead} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Lead
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Leads List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search leads..."
                                    className="pl-8 w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>ID <ArrowUpDown className="ml-2 h-4 w-4 inline" /></TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>Name <ArrowUpDown className="ml-2 h-4 w-4 inline" /></TableHead>
                                    <TableHead>Mobile</TableHead>
                                    <TableHead>Venture</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>Created At <ArrowUpDown className="ml-2 h-4 w-4 inline" /></TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No leads found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>{lead.id}</TableCell>
                                            <TableCell className="font-medium">{lead.name}</TableCell>
                                            <TableCell>{lead.mobile}</TableCell>
                                            <TableCell>{lead.project || lead.oneventure || '-'}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${lead.status === 'Site Visit Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    lead.status === 'Interested' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        'bg-gray-100 text-gray-700 border-gray-200'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(lead.created_at), 'dd/MM/yyyy')}
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
                                                        <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEditLead(lead)}>
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
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent >
            </Card >

            {/* View Details Dialog */}
            < Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen} >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Lead Details</DialogTitle>
                    </DialogHeader>
                    {selectedLeadData && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-500">Lead ID</Label>
                                    <div className="font-medium">{selectedLeadData.id}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Name</Label>
                                    <div className="font-medium">{selectedLeadData.name}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Mobile</Label>
                                    <div className="font-medium">{selectedLeadData.mobile}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Email</Label>
                                    <div className="font-medium">{selectedLeadData.email || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Primary Venture</Label>
                                    <div className="font-medium">{selectedLeadData.project || selectedLeadData.oneventure || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Primary Property</Label>
                                    <div className="font-medium">{selectedLeadData.property || selectedLeadData.oneproperty || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Budget</Label>
                                    <div className="font-medium">{selectedLeadData.budget || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Status</Label>
                                    <div className="font-medium">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${selectedLeadData.status === 'Site Visit Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                            selectedLeadData.status === 'Interested' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {selectedLeadData.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Site Visit On</Label>
                                    <div className="font-medium">
                                        {selectedLeadData.sitevisiton ? format(new Date(selectedLeadData.sitevisiton), 'dd/MM/yyyy h:mm a') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Source</Label>
                                    <div className="font-medium">{selectedLeadData.source || '-'}</div>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-sm text-gray-500">Notes</Label>
                                    <div className="p-2 bg-gray-50 rounded-md text-sm whitespace-pre-wrap h-24 overflow-y-auto border">
                                        {selectedLeadData.notes || 'No notes available.'}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Ventures Info if available */}
                            {(selectedLeadData.twoventure || selectedLeadData.twoventure_id) && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Additional Venture 2</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-xs text-gray-500">Venture</Label> <div>{selectedLeadData.twoventure || '-'}</div></div>
                                        <div><Label className="text-xs text-gray-500">Property</Label> <div>{selectedLeadData.twoproperty || '-'}</div></div>
                                    </div>
                                </div>
                            )}
                            {(selectedLeadData.threeventure || selectedLeadData.threeventure_id) && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Additional Venture 3</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-xs text-gray-500">Venture</Label> <div>{selectedLeadData.threeventure || '-'}</div></div>
                                        <div><Label className="text-xs text-gray-500">Property</Label> <div>{selectedLeadData.threeproperty || '-'}</div></div>
                                    </div>
                                </div>
                            )}
                            {(selectedLeadData.fourventure || selectedLeadData.fourventure_id) && (
                                <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Additional Venture 4</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label className="text-xs text-gray-500">Venture</Label> <div>{selectedLeadData.fourventure || '-'}</div></div>
                                        <div><Label className="text-xs text-gray-500">Property</Label> <div>{selectedLeadData.fourproperty || '-'}</div></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog >

            {/* Add/Edit Modal */}
            < Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedLeadId ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                    </DialogHeader>
                    <LeadForm
                        leadId={selectedLeadId}
                        initialData={selectedLeadData}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </DialogContent>
            </Dialog >
        </div >
    );
};

export default ManageLeads;
