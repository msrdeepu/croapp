
import { useEffect, useState } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Check, ChevronsUpDown, Copy, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Input } from 'src/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from 'src/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'src/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Venture {
    id: number;
    title: string;
    location: string;
    code: string;
    branch_id?: number;
}

interface AgentProfile {
    id: number;
    agent_code: string;
    fullname: string;
    surname: string;
}

interface Customer {
    id: number;
    fullname?: string;
    name?: string;
    surname?: string;
    phone?: string;
    mobile?: string;
    code: string;
}

interface Property {
    id: number;
    code: string;
    title: string;
    status: string;
    paid: number | string;
    outstanding: number | string;
    last_paidon?: string;
    customer?: Customer;
    profile?: AgentProfile;
}

interface ReportStats {
    totalOutstanding: number;
    totalPaid: number;
    bookedOutstanding: number;
    agreementOutstanding: number;
}

interface ReportResponse {
    status: string;
    pageTitle: string;
    venture?: {
        title: string;
        location: string;
    };
    stats: ReportStats;
    properties: Property[];
    lastUpdated?: string;
}

const VentureLevelOutstandingReport = () => {
    const { token } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [openVentureSelect, setOpenVentureSelect] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportResponse | null>(null);

    // Search & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter Logic
    const filteredProperties = reportData?.properties.filter(p => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            p.code.toLowerCase().includes(lowerTerm) ||
            p.title.toLowerCase().includes(lowerTerm) ||
            p.status.toLowerCase().includes(lowerTerm) ||
            p.profile?.fullname.toLowerCase().includes(lowerTerm) ||
            p.profile?.agent_code.toLowerCase().includes(lowerTerm) ||
            p.customer?.fullname?.toLowerCase().includes(lowerTerm) ||
            p.customer?.name?.toLowerCase().includes(lowerTerm) ||
            p.customer?.phone?.includes(lowerTerm) ||
            p.customer?.mobile?.includes(lowerTerm)
        );
    }) || [];

    // Pagination Logic
    const totalPages = Math.ceil(filteredProperties.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentProperties = filteredProperties.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pageSize, selectedVenture]);

    // Initial load for dropdowns
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await fetch(ENDPOINTS.RECEIPTS_SELECT, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const text = await response.text();
                    let result;
                    try {
                        result = JSON.parse(text);
                    } catch (e) {
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try { result = JSON.parse(fixedText); } catch (e2) { console.error(e2); }
                        } else { console.error(e); }
                    }

                    const actualData = Array.isArray(result) ? result[0] : result;
                    const data = actualData?.data || actualData;

                    if (data && data.ventures) {
                        setVentures(data.ventures);
                    } else if (actualData && actualData.ventures) {
                        setVentures(actualData.ventures);
                    }
                }
            } catch (error) {
                console.error("Error fetching initial report data", error);
            }
        };
        if (token) fetchInitialData();
    }, [token]);

    const handleGetReport = async () => {
        if (!selectedVenture) return;
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                'filter[venture_id]': selectedVenture,
            });

            const response = await fetch(`${ENDPOINTS.VENTURE_OUTSTANDING_REPORT}?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Fallback for double-encoded or malformed JSON (similar to fetchInitialData)
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { data = JSON.parse(fixedText); } catch (e2) { console.error("JSON Parse Retry Failed", e2); }
                    } else {
                        console.error("JSON Parse Failed", e);
                    }
                }
                if (data) setReportData(data);
            } else {
                console.error("Failed to fetch report");
            }
        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for display
    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(num);
    };

    const getStatusBadgeClass = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'booked') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (lowerStatus === 'on agreement' || lowerStatus === 'agreement') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-gray-100 text-gray-700 border-gray-200';
    };

    // Export Functions
    const handleCopy = () => {
        if (!reportData?.properties) return;
        const headers = ['S.No', 'Property', 'Status', 'Agent', 'Customer', 'Last Paid', 'Paid', 'Outstanding'];
        const csvContent = [
            headers.join('\t'),
            ...reportData.properties.map((p, idx) => [
                idx + 1,
                `${p.code} | ${p.title}`,
                p.status,
                p.profile ? `${p.profile.fullname} ${p.profile.surname} (#${p.profile.agent_code})` : '-',
                p.customer ? `${p.customer.fullname || p.customer.name} (${p.customer.phone || p.customer.mobile})` : '-',
                p.last_paidon ? format(parseISO(p.last_paidon), 'dd-MM-yyyy') : '-',
                p.paid,
                p.outstanding
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        if (!reportData?.properties) return;
        const data = reportData.properties.map((p, idx) => ({
            'S.No': idx + 1,
            'Property': `${p.code} | ${p.title}`,
            'Status': p.status,
            'Agent': p.profile ? `${p.profile.fullname} ${p.profile.surname} (#${p.profile.agent_code})` : '-',
            'Customer': p.customer ? `${p.customer.fullname || p.customer.name} (${p.customer.phone || p.customer.mobile})` : '-',
            'Last Paid': p.last_paidon ? format(parseISO(p.last_paidon), 'dd-MM-yyyy') : '-',
            'Paid': parseFloat(String(p.paid || 0)),
            'Outstanding': parseFloat(String(p.outstanding || 0))
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Outstanding Report");
        XLSX.writeFile(wb, "venture_outstanding_report.xlsx");
    };

    const handleExportPDF = () => {
        if (!reportData?.properties) return;
        const doc = new jsPDF();
        doc.text("Venture Outstanding Report", 14, 15);
        if (reportData.venture) {
            doc.setFontSize(10);
            doc.text(`${reportData.venture.title} - ${reportData.venture.location}`, 14, 22);
        }

        const tableColumn = ['S.No', 'Property', 'Status', 'Agent', 'Customer', 'Outstanding'];
        const tableRows = reportData.properties.map((p, idx) => [
            idx + 1,
            `${p.code}`,
            p.status,
            p.profile ? `${p.profile.fullname}` : '-',
            p.customer ? `${p.customer.fullname || p.customer.name}` : '-',
            // p.last_paidon ? format(parseISO(p.last_paidon), 'dd-MM-yy') : '-',
            // parseFloat(String(p.paid || 0)).toFixed(2),
            parseFloat(String(p.outstanding || 0)).toFixed(2)
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("venture_outstanding_report.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6 w-full max-w-[85vw] md:max-w-[calc(100vw-300px)]">
            <h2 className="text-xl font-semibold mb-4 text-ld">Venture Level Outstanding Report</h2>
            <Card className="mb-6 print:hidden">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="w-full md:w-1/3">
                            <Label className="mb-2 block">Select Venture</Label>
                            <Popover open={openVentureSelect} onOpenChange={setOpenVentureSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openVentureSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedVenture
                                                ? ventures.find((v) => v.id.toString() === selectedVenture)?.title
                                                : "Select Venture"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search venture..." />
                                        <CommandList>
                                            <CommandEmpty>No venture found.</CommandEmpty>
                                            <CommandGroup>
                                                {ventures.map((v) => (
                                                    <CommandItem
                                                        key={v.id}
                                                        value={v.title}
                                                        onSelect={() => {
                                                            setSelectedVenture(v.id.toString() === selectedVenture ? "" : v.id.toString());
                                                            setOpenVentureSelect(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedVenture === v.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {v.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button onClick={handleGetReport} disabled={!selectedVenture || loading}>
                            {loading ? "Loading..." : "Get Report"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <div className="space-y-6">
                    {/* Venture Header */}
                    {reportData.venture && (
                        <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800">
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-sky-900 dark:text-sky-100">
                                        {reportData.venture.title} <span className="text-sm font-normal text-sky-700 dark:text-sky-300 ml-2">{reportData.venture.location}</span>
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Booked — Total Outstanding</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(reportData.stats.bookedOutstanding)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardContent className="p-6">
                                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">On Agreement — Total Outstanding</div>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(reportData.stats.agreementOutstanding)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Buttons & Search */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 print:hidden">
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search properties..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                <Copy className="h-4 w-4 mr-2" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportExcel}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportPDF}>
                                <FileText className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>

                    {/* Data Table with Scroll */}
                    <Card className="overflow-hidden border shadow-sm">
                        <div className="rounded-md border max-h-[600px] overflow-auto max-w-[85vw] md:max-w-[calc(100vw-300px)]">
                            <Table id="dataTable" className="relative w-full">
                                <TableHeader className="bg-gray-800 sticky top-0 z-10">
                                    <TableRow className="hover:bg-gray-800">
                                        <TableHead className="w-[60px] text-white whitespace-nowrap">S.No</TableHead>
                                        <TableHead className="text-white whitespace-nowrap">Property</TableHead>
                                        <TableHead className="text-white whitespace-nowrap">Status</TableHead>
                                        <TableHead className="text-white whitespace-nowrap">Agent</TableHead>
                                        <TableHead className="text-white whitespace-nowrap">Customer</TableHead>
                                        <TableHead className="text-white whitespace-nowrap">Last Paid</TableHead>
                                        <TableHead className="text-right text-white whitespace-nowrap">Paid (₹)</TableHead>
                                        <TableHead className="text-right text-white whitespace-nowrap">Outstanding (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentProperties.length > 0 ? (
                                        currentProperties.map((p, idx) => (
                                            <TableRow key={p.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{startIndex + idx + 1}</TableCell>
                                                <TableCell className="font-semibold text-primary whitespace-nowrap">
                                                    {p.code} | {p.title}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <span className={`px - 3 py - 1 rounded - full text - xs font - semibold border ${getStatusBadgeClass(p.status)} `}>
                                                        {p.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {p.profile ? (
                                                        <div>
                                                            <div className="font-medium">{p.profile.fullname} {p.profile.surname}</div>
                                                            <div className="text-xs text-gray-500">#{p.profile.agent_code}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {p.customer ? (
                                                        <div>
                                                            <div className="font-medium">{p.customer.fullname || p.customer.name} {p.customer.surname}</div>
                                                            {(p.customer.phone || p.customer.mobile) && (
                                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                    {p.customer.phone || p.customer.mobile}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {p.last_paidon ? (
                                                        <div>
                                                            <div className="font-medium">{format(parseISO(p.last_paidon), 'dd-MM-yyyy')}</div>
                                                            <div className="text-xs text-gray-500">{formatDistanceToNow(parseISO(p.last_paidon))} ago</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-emerald-600 whitespace-nowrap">
                                                    {formatCurrency(p.paid || 0)}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-red-600 whitespace-nowrap">
                                                    {formatCurrency(p.outstanding || 0)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                                                No properties found for the selected venture.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                {/* Footer Only Show on Last Page or implement grand total separately */}
                                {reportData.properties.length > 0 && (
                                    <TableBody className="bg-gray-50 dark:bg-gray-900 border-t-2 border-gray-200 sticky bottom-0 z-10 shadow-inner">
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-right font-bold text-gray-700 dark:text-gray-300">
                                                Total Paid (₹)
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 text-lg">
                                                {formatCurrency(reportData.stats.totalPaid)}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-right font-bold text-gray-700 dark:text-gray-300">
                                                Total Outstanding (₹)
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-red-600 text-lg">
                                                {formatCurrency(reportData.stats.totalOutstanding)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                )}
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between px-4 py-4 border-t print:hidden">
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-700">
                                    Rows per page
                                </p>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(val) => setPageSize(Number(val))}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={pageSize.toString()} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 30, 40, 50].map((size) => (
                                            <SelectItem key={size} value={size.toString()}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">
                                    Page {currentPage} of {totalPages || 1}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default VentureLevelOutstandingReport;
