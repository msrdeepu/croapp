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

interface VisitorLog {
    id: number;
    name: string;
    contact: string;
    person_to_meet: string;
    purpose: string;
    date: string;
    time: string;
    visitor_type: string;
    last_visit?: string;
    branch?: { location: string };
    user?: { name: string };
}

const ManageVisitorLogs = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<VisitorLog[]>([]);
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
    const [viewLog, setViewLog] = useState<VisitorLog | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [token, currentPage, itemsPerPage]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/visitor-logs?page=${currentPage}&limit=${itemsPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Handle [] prefix issue
                    if (text.trim().startsWith('[]')) {
                        try {
                            data = JSON.parse(text.substring(2));
                        } catch (e2) {
                            console.error("Failed to parse fixed JSON:", e2);
                            return;
                        }
                    } else {
                        console.error("JSON Parse Error:", e);
                        return;
                    }
                }

                // Handle different response structures
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
            const response = await fetch(`${API_BASE_URL}/visitor-logs/${deleteId}`, {
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

    // Client-side filter for simplicity if API doesn't support search yet
    const filteredLogs = logs.filter(log =>
        log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Visitor Logs</h2>
                <Button onClick={() => navigate('/visitor-logs/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> New Log
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Visitor Logs List</CardTitle>
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

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>To Meet</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Date / Time</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Last Visit</TableHead>
                                    <TableHead>Created By</TableHead>
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
                                            <TableCell className="font-medium">{log.name}</TableCell>
                                            <TableCell>{log.contact}</TableCell>
                                            <TableCell>{log.person_to_meet}</TableCell>
                                            <TableCell className="truncate max-w-[150px]">{log.purpose}</TableCell>
                                            <TableCell>{log.branch?.location || '-'}</TableCell>
                                            <TableCell>
                                                <div className="text-xs">
                                                    <div>{format(new Date(log.date), 'dd MMM yyyy')}</div>
                                                    <div className="text-gray-500">{log.time}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{log.visitor_type}</TableCell>
                                            <TableCell>{log.last_visit ? format(new Date(log.last_visit), 'dd MMM yyyy') : '-'}</TableCell>
                                            <TableCell>{log.user?.name || '-'}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => navigate(`/visitor-logs/edit/${log.id}`)}>
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
                            Are you sure you want to delete this visitor log? This action cannot be undone.
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
                        <DialogTitle>Visitor Log Details</DialogTitle>
                    </DialogHeader>
                    {viewLog && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Visitor Name</div>
                                <div className="text-lg">{viewLog.name}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Contact</div>
                                <div className="text-lg">{viewLog.contact}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Visitor Type</div>
                                <div>{viewLog.visitor_type}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Branch</div>
                                <div>{viewLog.branch?.location || '-'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">To Meet</div>
                                <div>{viewLog.person_to_meet}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Visit Date & Time</div>
                                <div>{format(new Date(viewLog.date), 'dd MMM yyyy')} at {viewLog.time}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Last Visit</div>
                                <div>{viewLog.last_visit ? format(new Date(viewLog.last_visit), 'dd MMM yyyy') : 'N/A'}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-500">Purpose</div>
                                <div className="bg-gray-50 p-2 rounded mt-1">{viewLog.purpose}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-500">Created By</div>
                                <div>{viewLog.user?.name || '-'}</div>
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

export default ManageVisitorLogs;
