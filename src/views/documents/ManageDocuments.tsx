import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Plus, Search, Loader2, Edit, Trash2, Eye, MoreVertical, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
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
    DialogFooter,
    DialogDescription
} from "src/components/ui/dialog";
import { format } from 'date-fns';
import { SearchableSelect } from 'src/components/ui/searchable-select';

interface Document {
    id: number;
    venture_id: number;
    property_id?: number;
    document_type: string;
    notes: string;
    file_path: string;
    created_at: string;
    venture?: { title: string };
    property?: { code: string; plot_number?: string; name: string };
    added_by?: number;
}

const ManageDocuments = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Alert State
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => {
            const newAlert = { id, type, title, message };
            // Keep max 3, remove oldest (from start) if exceeded
            const updated = [...prev, newAlert];
            if (updated.length > 3) {
                return updated.slice(updated.length - 3);
            }
            return updated;
        });

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            removeAlert(id);
        }, 3000);
    };

    const removeAlert = (id: number) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    // Filters
    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [selectedDocType, setSelectedDocType] = useState<string>('');

    // Filter Options
    const [ventures, setVentures] = useState<{ value: string; label: string }[]>([]);
    const [doctypes, setDoctypes] = useState<{ value: string; label: string }[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    useEffect(() => {
        fetchFilterOptions();
    }, [token]);

    useEffect(() => {
        fetchDocuments();
    }, [token, currentPage, itemsPerPage, selectedVenture, selectedDocType]); // Add filter dependencies

    const fetchFilterOptions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else {
                        throw e;
                    }
                }
                setVentures(data.ventures?.map((v: any) => ({ ...v, value: String(v.value) })) || []);
                setDoctypes(data.doctypes || []);
            }
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: itemsPerPage.toString(),
            });
            if (searchTerm) params.append('search', searchTerm);
            if (selectedVenture) params.append('venture_id', selectedVenture);
            if (selectedDocType) params.append('document_type', selectedDocType);

            const response = await fetch(`${API_BASE_URL}/documents?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else {
                        throw e;
                    }
                }

                // Handle Laravel pagination safely
                if (data.data && Array.isArray(data.data)) {
                    setDocuments(data.data);
                    setTotalPages(data.last_page || 1);
                    setTotalRecords(data.total || 0);
                } else if (Array.isArray(data)) {
                    setDocuments(data);
                    setTotalPages(1);
                    setTotalRecords(data.length);
                }
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter triggering
    const handleSearch = () => {
        setCurrentPage(1);
        fetchDocuments();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/documents/${deleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchDocuments();
                setDeleteId(null);
                showAlert('success', 'Success', 'Document deleted successfully');
            } else {
                showAlert('error', 'Error', 'Failed to delete document');
            }
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    };

    const handleDownload = (path: string) => {
        // Construct full URL. Assume API_BASE_URL is .../api, we need .../path
        // The path stored is 'officedocs/filename.ext'. 
        // If API_BASE_URL is 'http://localhost/api', we probably want 'http://localhost/officedocs/...' or relative to root.
        // Usually, in Laravel, 'storage/' or 'public/' is used. The path 'officedocs/...' is inside public.
        // So we need base_url + '/' + path.
        const baseUrl = API_BASE_URL.replace('/api', '');
        const fileUrl = `${baseUrl}/${path}`;
        window.open(fileUrl, '_blank');
    };

    return (
        <div className="space-y-4 p-8 pt-6">
            {/* Toast Notification Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out"
                    >
                        <Alert
                            variant={alert.type}
                            className={cn(
                                "shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10",
                                alert.type === 'success' ? "bg-green-500" : "bg-red-500"
                            )}
                        >
                            {alert.type === 'success'
                                ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" />
                                : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                            }
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">
                                    {alert.message}
                                </AlertDescription>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Documents</h2>
                <Button onClick={() => navigate('/documents/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> New Document
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Documents List</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ventures, notes..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        <div className="z-20">
                            <SearchableSelect
                                options={ventures}
                                value={selectedVenture}
                                onChange={(val) => { setSelectedVenture(val); setCurrentPage(1); }}
                                placeholder="Filter by Venture"
                            />
                        </div>

                        <div>
                            <Select
                                value={selectedDocType}
                                onValueChange={(val) => { setSelectedDocType(val); setCurrentPage(1); }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Doc Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Doc Types</SelectItem>
                                    {/* Select component doesn't handle clearing well without a distinct 'all' or empty option value logic, 
                                        using "all" string might need handling in fetch or SelectValue display. 
                                        Actually `onValueChange` receives value. If I reset to '', it works. */}
                                    {doctypes.map(dt => (
                                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedDocType && <Button variant="ghost" size="sm" onClick={() => setSelectedDocType('')} className="h-4 text-xs mt-1">Clear Type</Button>}
                        </div>

                        <div className="flex items-center justify-end space-x-2 text-sm text-gray-500">
                            <span>Rows:</span>
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

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Venture</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No documents found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">{doc.venture?.title || '-'}</TableCell>
                                            <TableCell>{doc.property ? (doc.property.plot_number ? `${doc.property.name} (${doc.property.plot_number})` : doc.property.name) : '-'}</TableCell>
                                            <TableCell>{doc.document_type}</TableCell>
                                            <TableCell className="truncate max-w-[200px]" title={doc.notes}>{doc.notes}</TableCell>
                                            <TableCell className="text-xs">{doc.created_at ? format(new Date(doc.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleDownload(doc.file_path)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View/Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/documents/edit/${doc.id}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteId(doc.id)} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="text-sm text-gray-500 mr-4">
                            Total {totalRecords} records
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
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
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this document? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete Document</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageDocuments;
