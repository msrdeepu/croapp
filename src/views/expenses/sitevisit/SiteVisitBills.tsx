import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, MoreVertical, Printer, Pencil, Plus, Copy, FileSpreadsheet, FileText, Eye } from 'lucide-react';
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

const SiteVisitBills = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.SITEVISIT_BILLS.BASE, {
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

    const handlePrint = (id: string) => {
        window.open(ENDPOINTS.SITEVISIT_BILLS.PRINT(id), '_blank');
    }

    const filteredData = data.filter(item =>
        item.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount?.toString().includes(searchTerm) ||
        item.branch?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.billingcategory?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentBills = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleCopy = () => {
        const headers = [
            'Bill No', 'Paid On', 'Amount', 'Branch', 'Payment Type', 'Paid To', 'Created On'
        ];

        const csvContent = [
            headers.join('\t'),
            ...filteredData.map(r => [
                r.bill_number,
                new Date(r.payment_date).toLocaleDateString(),
                r.amount,
                r.branch?.location || '',
                r.billingcategory?.name || '',
                r.vendor || '',
                new Date(r.created_at).toLocaleDateString()
            ].join('\t'))
        ].join('\n');

        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        const exportData = filteredData.map(r => ({
            'Bill No': r.bill_number,
            'Paid On': new Date(r.payment_date).toLocaleDateString(),
            'Amount': r.amount,
            'Branch': r.branch?.location || '',
            'Payment Type': r.billingcategory?.name || '',
            'Paid To': r.vendor || '',
            'Created On': new Date(r.created_at).toLocaleDateString()
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SiteVisitBills");
        XLSX.writeFile(wb, "site_visit_bills_export.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Site Visit Bills List", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = [
            'Bill No', 'Paid On', 'Amount', 'Branch', 'Payment Type', 'Paid To', 'Created On'
        ];

        const tableRows = filteredData.map(r => [
            r.bill_number,
            new Date(r.payment_date).toLocaleDateString(),
            r.amount,
            r.branch?.location || '',
            r.billingcategory?.name || '',
            r.vendor || '',
            new Date(r.created_at).toLocaleDateString()
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save("site_visit_bills_export.pdf");
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
                            <BreadcrumbPage>Site Visit Expenses</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <CardTitle>Site Visit Expenses</CardTitle>
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
                        <Button onClick={() => navigate('/expenses/site-visit/create')} size="sm">
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
                                    <TableHead>Paid To</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                                        </TableCell>
                                    </TableRow>
                                ) : currentBills.length > 0 ? (
                                    currentBills.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="font-medium">{row.bill_number}</TableCell>
                                            <TableCell>{new Date(row.payment_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{row.amount}</TableCell>
                                            <TableCell>{row.branch?.location}</TableCell>
                                            <TableCell>{row.billingcategory?.name}</TableCell>
                                            <TableCell>{row.vendor}</TableCell>
                                            <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handlePrint(row.id)}>
                                                            <Printer className="mr-2 h-4 w-4" /> Print
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/expenses/site-visit/view/${row.id}`)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/expenses/site-visit/edit/${row.id}`)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
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
        </div>
    );
};

export default SiteVisitBills;
