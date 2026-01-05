import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "src/components/ui/select"
import { Label } from 'src/components/ui/label';
import { Loader2, MoreVertical, Printer, Pencil, Plus, Copy, FileSpreadsheet, FileText, Eye, Trash, CheckCircle2, X } from 'lucide-react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb"
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "src/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";

const TransportBills = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Check for success parameter
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setShowSuccess(true);
            // Clear the success param from URL
            searchParams.delete('success');
            setSearchParams(searchParams, { replace: true });
            // Auto hide after 5 seconds
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [searchParams, setSearchParams]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.TRANSPORT_BILLS.BASE, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            const text = await response.text();
            let res;
            try {
                res = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('[]')) {
                    const fixedText = text.trim().substring(2);
                    try { res = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                } else {
                    console.error('Error parsing JSON:', e);
                }
            }

            if (res && res.status) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${ENDPOINTS.TRANSPORT_BILLS.BASE}/${deleteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                fetchData();
                setDeleteId(null);
            } else {
                alert('Failed to delete bill');
            }
        } catch (error) {
            console.error('Error deleting bill:', error);
        }
    };

    const handlePrint = (id: string | number) => {
        window.open(ENDPOINTS.TRANSPORT_BILLS.PRINT(id), '_blank');
    }

    const filteredData = data.filter(item =>
        item.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor?.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount?.toString().includes(searchTerm) ||
        item.branch?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.billingcategory?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentBills = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleCopy = () => {
        const headers = [
            'Bill No', 'Paid On', 'Amount', 'Branch', 'Payment Type', 'Purpose', 'Paid To', 'Details', 'Created On'
        ];

        const csvContent = [
            headers.join('\t'),
            ...filteredData.map(r => [
                r.bill_number,
                r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-',
                r.amount,
                r.branch?.location || '',
                r.billingcategory?.name || '',
                r.purpose || '',
                `${r.vendor?.fullname || ''} ${r.vendor?.surname || ''}`,
                r.notes || '',
                r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'
            ].join('\t'))
        ].join('\n');

        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        const exportData = filteredData.map(r => ({
            'Bill No': r.bill_number,
            'Paid On': r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-',
            'Amount': r.amount,
            'Branch': r.branch?.location || '',
            'Payment Type': r.billingcategory?.name || '',
            'Purpose': r.purpose || '',
            'Paid To': `${r.vendor?.fullname || ''} ${r.vendor?.surname || ''}`,
            'Details': r.notes || '',
            'Created On': r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "TransportBills");
        XLSX.writeFile(wb, "transport_bills_export.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Transport Bills List", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = [
            'Bill No', 'Paid On', 'Amount', 'Branch', 'Purpose', 'Paid To', 'Created On'
        ]; // Reduced columns for PDF to fit

        const tableRows = filteredData.map(r => [
            r.bill_number,
            r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-',
            r.amount,
            r.branch?.location || '',
            r.purpose || '',
            `${r.vendor?.fullname || ''} ${r.vendor?.surname || ''}`,
            r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save("transport_bills_export.pdf");
    };

    return (
        <div className="p-6">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Transport Expenses</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* Success Flash Message */}
            {showSuccess && (
                <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out">
                    <Alert className="shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] bg-green-500 text-white rounded-xl relative pr-10">
                        <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                            <AlertTitle className="mb-0 text-base font-bold text-white">Success!</AlertTitle>
                            <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">
                                Transport bill saved successfully!
                            </AlertDescription>
                        </div>
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </Alert>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <CardTitle>Transport Expenses</CardTitle>
                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                            <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportExcel} title="Export to Excel">
                            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportPDF} title="Export to PDF">
                            <FileText className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        <Button onClick={() => navigate('/expenses/transport/create')} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> New Expense
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="rows" className="text-sm whitespace-nowrap">Rows per page:</Label>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                            >
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            placeholder="Search bills..."
                            value={searchTerm}
                            onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }}
                            className="max-w-sm"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bill No</TableHead>
                                    <TableHead>Paid On</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Payment Type</TableHead>
                                    <TableHead>Purpose</TableHead>
                                    <TableHead>Paid To</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                        </TableCell>
                                    </TableRow>
                                ) : currentBills.length > 0 ? (
                                    currentBills.map((bill: any) => (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium text-blue-600">{bill.bill_number}</TableCell>
                                            <TableCell>
                                                {bill.payment_date ? new Date(bill.payment_date).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell><span className="font-bold">₹ {bill.amount}</span></TableCell>
                                            <TableCell>{bill.branch?.location || '-'}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={bill.billingcategory?.name}>{bill.billingcategory?.name || '-'}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={bill.purpose}>{bill.purpose || '-'}</TableCell>
                                            <TableCell className="max-w-[200px]">
                                                <div className="flex flex-col truncate">
                                                    <span className="font-medium truncate" title={bill.vendor?.fullname}>{bill.vendor?.fullname} {bill.vendor?.surname}</span>
                                                    <span className="text-xs text-gray-500 truncate" title={bill.vendor?.organization}>{bill.vendor?.organization}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={bill.notes || ''}>
                                                {bill.notes || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {bill.created_at ? new Date(bill.created_at).toLocaleDateString() : '-'}
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
                                                        <DropdownMenuItem onClick={() => navigate(`/expenses/transport/edit/${bill.id}`)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/expenses/transport/view/${bill.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePrint(bill.id)}>
                                                            <Printer className="mr-2 h-4 w-4" /> Print
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setDeleteId(bill.id)} className="text-red-600">
                                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {currentPage} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this bill? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TransportBills;
