import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Card, CardContent, CardHeader } from 'src/components/ui/card';
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
    MoreHorizontal,
    Plus,
    FileText,
    CheckCircle,
    XCircle,
    FileSpreadsheet,
    Download,
    ChevronLeft,
    ChevronRight,
    Share2
} from 'lucide-react';
import Spinner from 'src/views/spinner/Spinner';
import { Badge } from 'src/components/ui/badge';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ManageAgentApprovals = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/agent-approvals`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        result = JSON.parse(text.trim().substring(2));
                    } else { throw e; }
                }
                const list = result.data || [];
                setOriginalData(list);
                setFilteredData(list);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        if (!search.trim()) {
            setFilteredData(originalData);
        } else {
            const lower = search.toLowerCase();
            const filtered = originalData.filter(item =>
                item.agent_name?.toLowerCase().includes(lower) ||
                String(item.id).includes(lower) ||
                item.purpose?.toLowerCase().includes(lower) ||
                item.status?.toLowerCase().includes(lower) ||
                item.amount?.toString().includes(lower)
            );
            setFilteredData(filtered);
        }
        setCurrentPage(1); // Reset to first page on search
    }, [search, originalData]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

    const handleAction = async (id: number, action: 'approve' | 'reject') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/agent-approvals/${id}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                setSuccessMessage(`Request ${action}d successfully`);
                fetchData();
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePrint = async (id: number) => {
        try {
            window.open(`${API_BASE_URL}/agent-approvals/${id}/receipt?token=${token}`, '_blank');
        } catch (e) { console.error(e); }
    };

    // Export to Excel
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredData.map(item => ({
            ID: item.id,
            Agent: item.agent_name,
            Purpose: item.purpose,
            Amount: item.amount,
            Branch: item.branch_location,
            Status: item.status,
            Date: item.created_at,
            ApprovedBy: item.approved_by_name
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Agent Approvals");
        XLSX.writeFile(workbook, "Agent_Approvals.xlsx");
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Agent Approvals Report", 14, 16);

        const tableColumn = ["ID", "Agent", "Purpose", "Amount", "Branch", "Status", "Date"];
        const tableRows = filteredData.map(item => [
            item.id,
            item.agent_name,
            item.purpose,
            item.amount,
            item.branch_location,
            item.status,
            item.created_at
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });

        doc.save("Agent_Approvals.pdf");
    };

    return (
        <div className="md:px-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Manage Agent Approvals</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToExcel} title="Export to Excel">
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel
                    </Button>
                    <Button variant="outline" onClick={exportToPDF} title="Export to PDF">
                        <FileText className="mr-2 h-4 w-4 text-red-600" /> PDF
                    </Button>
                    <Link to="/agent-approvals/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Approval
                        </Button>
                    </Link>
                </div>
            </div>

            {successMessage && (
                <Alert className="text-green-600 border-green-200 bg-green-50">
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 whitespace-nowrap">Rows per page:</span>
                            <Select
                                value={String(rowsPerPage)}
                                onValueChange={(val) => {
                                    setRowsPerPage(Number(val));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            placeholder="Search approvals..."
                            className="max-w-xs"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <Spinner /> : (
                        <div className="space-y-4">
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Agent</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Branch</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-24">
                                                    No approvals found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedData.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.id}</TableCell>
                                                    <TableCell className="font-medium">{item.agent_name}</TableCell>
                                                    <TableCell>{item.purpose}</TableCell>
                                                    <TableCell>{item.amount}</TableCell>
                                                    <TableCell>{item.branch_location}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={item.status === 'APPROVED' ? 'default' : (item.status === 'REJECTED' ? 'destructive' : 'secondary')}>
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{item.created_at}</TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Open menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {item.status === 'PENDING' && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'approve')}>
                                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleAction(item.id, 'reject')}>
                                                                            <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}

                                                                {item.status === 'APPROVED' && (
                                                                    <DropdownMenuItem onClick={() => handlePrint(item.id)}>
                                                                        <Download className="mr-2 h-4 w-4" /> Print Receipt
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => navigate(`/agent-approvals/manage-chain/${item.profile_id}`)}>
                                                                    <Share2 className="mr-2 h-4 w-4" /> Manage Chain
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
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredData.length)} of {filteredData.length} records
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <div className="text-sm font-medium">
                                        Page {currentPage} of {Math.max(totalPages, 1)}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage >= totalPages}
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageAgentApprovals;
