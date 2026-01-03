import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Plus, Search, Loader2, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
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

interface CallLog {
    id: number;
    code: string;
    date: string;
    from_number: string;
    person_name: string;
    purpose: string;
    type: string;
    status: string;
    employee?: { fullname: string; surname: string };
    created_at: string;
    person_from?: string;
    notes?: string;
    employee_id?: number;
}

const ManageCallLogs = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Delete State
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // View State
    const [viewLog, setViewLog] = useState<CallLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [token, currentPage, itemsPerPage]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs?page=${currentPage}&limit=${itemsPerPage}`, {
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
                        console.error("JSON Parse Error:", e);
                        return;
                    }
                }

                // Handle Laravel pagination
                if (data.data && Array.isArray(data.data)) {
                    setLogs(data.data);
                    setTotalPages(data.last_page || 1);
                    setTotalRecords(data.total || 0);
                } else if (Array.isArray(data)) {
                    setLogs(data);
                    setTotalPages(1);
                    setTotalRecords(data.length);
                }
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/call-logs/${deleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchLogs();
                setDeleteId(null);
            } else {
                alert("Failed to delete log");
            }
        } catch (error) {
            console.error("Error deleting log:", error);
        }
    };

    // Client-side filter for now
    const filteredLogs = logs.filter(log =>
        log.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.from_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Call Logs</h2>
                <Button onClick={() => navigate('/call-logs/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> New Call Log
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Call Logs List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
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

                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>From Number</TableHead>
                                    <TableHead>Person Name</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.code}</TableCell>
                                            <TableCell className="text-xs">{log.date ? format(new Date(log.date), 'dd MMM yyyy') : '-'}</TableCell>
                                            <TableCell>{log.from_number}</TableCell>
                                            <TableCell className="truncate max-w-[150px]" title={log.person_name}>{log.person_name}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{log.purpose}</TableCell>
                                            <TableCell>{log.type}</TableCell>
                                            <TableCell>{log.status}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{log.employee ? `${log.employee.fullname} ${log.employee.surname || ''}` : '-'}</TableCell>
                                            <TableCell className="text-xs">{log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setViewLog(log)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/call-logs/edit/${log.id}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteId(log.id)} className="text-red-600">
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
                            Are you sure you want to delete this call log? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete Log</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Log Dialog */}
            <Dialog open={!!viewLog} onOpenChange={(open) => !open && setViewLog(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Call Log Details #{viewLog?.code}</DialogTitle>
                    </DialogHeader>
                    {viewLog && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">From Number</div>
                                <div className="text-lg">{viewLog.from_number}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Date</div>
                                <div className="text-lg">{viewLog.date ? format(new Date(viewLog.date), 'dd MMM yyyy') : '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Person Name</div>
                                <div>{viewLog.person_name || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Person From</div>
                                <div>{viewLog.person_from || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Type</div>
                                <div>{viewLog.type || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Status</div>
                                <div>{viewLog.status || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Assigned Employee</div>
                                <div>{viewLog.employee ? `${viewLog.employee.fullname} ${viewLog.employee.surname || ''}` : '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Created On</div>
                                <div>{viewLog.created_at ? format(new Date(viewLog.created_at), 'dd MMM yyyy') : '-'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-500">Purpose</div>
                                <div className="bg-gray-50 p-2 rounded mt-1">{viewLog.purpose || '-'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-500">Notes</div>
                                <div className="bg-gray-50 p-2 rounded mt-1">{viewLog.notes || '-'}</div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewLog(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageCallLogs;
