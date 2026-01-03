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
import { Check, ChevronsUpDown, Copy, FileSpreadsheet, FileText, Printer, Search } from 'lucide-react';
import { cn } from 'src/lib/utils';
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
import { Input } from 'src/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Venture {
    id: number;
    title: string;
    location: string;
    code: string;
}

interface MonitorRecord {
    property_code: string;
    plot_number: string;
    total_cost: string | number;
    paid: string | number;
    outstanding: string | number;
    first_date: string;
    last_date: string;
    total_paid: string | number;
    days_span: number;
    status: string;
    eligible: boolean;
}

const FreeRegistrationMonitor = () => {
    const { token } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [openVentureSelect, setOpenVentureSelect] = useState(false);

    const [records, setRecords] = useState<MonitorRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatedVenture, setGeneratedVenture] = useState<Venture | null>(null);

    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Initial load for dropdowns
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch initial data (ventures list) from RECEIPTS_SELECT to get access-controlled list
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
                        // Fallback for double-encoded or malformed JSON
                        if (text.trim().startsWith('[]')) {
                            const fixedText = text.trim().substring(2);
                            try { result = JSON.parse(fixedText); } catch (e2) { console.error(e2); }
                        } else { console.error(e); }
                    }

                    const actualData = Array.isArray(result) ? result[0] : result;
                    // Handle potential wrapped data structure from RECEIPTS_SELECT
                    if (actualData?.data?.ventures) {
                        setVentures(actualData.data.ventures);
                    } else if (actualData?.ventures) {
                        setVentures(actualData.ventures);
                    }
                } else {
                    console.error("Failed to fetch initial data", response.status);
                }
            } catch (error) {
                console.error("Error fetching initial venture data", error);
            }
        };
        if (token) fetchInitialData();
    }, [token]);

    const handleGenerateReport = async () => {
        if (!selectedVenture) return;
        setLoading(true);
        setRecords([]);
        setGeneratedVenture(null);

        try {
            const queryParams = new URLSearchParams({
                'filter[venture_id]': selectedVenture,
            });

            const response = await fetch(`${ENDPOINTS.REPORTS_FREE_REGISTRATION}?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

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

            console.log("Free Registration Report Data:", result);

            if (result && result.status && result.data) {
                setRecords(result.data.records || []);
                setGeneratedVenture(result.data.venture || null);
            } else {
                console.error("Failed to fetch report data", result);
            }

        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredRecords = records.filter(r => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            r.property_code?.toLowerCase().includes(lowerTerm) ||
            r.plot_number?.toLowerCase().includes(lowerTerm) ||
            r.status?.toLowerCase().includes(lowerTerm)
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentRecords = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRecords.length / pageSize);

    // Helper to format number (simple)
    const formatNumber = (val: string | number) => {
        if (!val && val !== 0) return '0';
        return Number(val).toLocaleString('en-IN');
    };

    // Status Color Helper
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'registered': return 'bg-green-100 text-green-700 hover:bg-green-200';
            case 'hold': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
            case 'booked': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Export Handlers
    const handleCopy = () => {
        if (filteredRecords.length === 0) return;
        const headers = ['#', 'Property Code', 'Plot Number', 'Plot Price', 'Paid Amount', 'Outstanding', 'First Receipt', 'Last Receipt', 'Duration (Days)', 'Eligibility', 'Status'];
        const csvContent = [
            headers.join('\t'),
            ...filteredRecords.map((r, i) => [
                i + 1,
                r.property_code,
                r.plot_number,
                formatNumber(r.total_cost),
                formatNumber(r.paid),
                formatNumber(r.outstanding),
                r.first_date,
                r.last_date,
                r.days_span,
                r.eligible ? 'Yes' : 'No',
                r.status
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        if (filteredRecords.length === 0) return;
        const data = filteredRecords.map((r, i) => ({
            '#': i + 1,
            'Property Code': r.property_code,
            'Plot Number': r.plot_number,
            'Plot Price': Number(r.total_cost),
            'Paid Amount': Number(r.paid),
            'Outstanding': Number(r.outstanding),
            'First Receipt': r.first_date,
            'Last Receipt': r.last_date,
            'Duration (Days)': r.days_span,
            'Eligibility': r.eligible ? 'Yes' : 'No',
            'Status': r.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "FreeRegistrationReport");
        XLSX.writeFile(wb, "FreeRegistrationReport.xlsx");
    };

    const handleExportPDF = () => {
        if (filteredRecords.length === 0) return;
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Free Registration Eligibility Monitor", 14, 15);
        if (generatedVenture) {
            doc.setFontSize(10);
            doc.text(`Venture: ${generatedVenture.title} (${generatedVenture.code})`, 14, 22);
        }

        const tableColumn = ['#', 'Code', 'Plot', 'Price', 'Paid', 'Outstanding', 'First', 'Last', 'Days', 'Eligible', 'Status'];
        const tableRows = filteredRecords.map((r, i) => [
            i + 1,
            r.property_code,
            r.plot_number,
            formatNumber(r.total_cost),
            formatNumber(r.paid),
            formatNumber(r.outstanding),
            r.first_date,
            r.last_date,
            r.days_span,
            r.eligible ? 'Yes' : 'No',
            r.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("FreeRegistrationReport.pdf");
    };

    const handlePrint = () => {
        window.print();
    };


    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Free Registration Monitor</h2>
            <Card className="mb-6 hide-print">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* Venture Select */}
                        <div>
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
                                                        value={`${v.title}`}
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

                        <Button onClick={handleGenerateReport} disabled={loading || !selectedVenture}>
                            {loading ? "Generating..." : "Get Report"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {generatedVenture && (
                <div className="space-y-6">
                    {/* Header for Report */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{generatedVenture.title}</h3>
                            <p className="text-sm text-gray-500">Location: {generatedVenture.location} | Code: {generatedVenture.code}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 hide-print">
                            <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                                <Copy className="h-4 w-4 mr-2" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportExcel} title="Export to Excel">
                                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportPDF} title="Export to PDF">
                                <FileText className="h-4 w-4 mr-2" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint} title="Print">
                                <Printer className="h-4 w-4 mr-2" /> Print
                            </Button>
                        </div>
                    </div>

                    {/* Search and Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-md border shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center hide-print">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm whitespace-nowrap">Rows:</Label>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}
                                >
                                    <SelectTrigger className="w-[70px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                        <SelectItem value="500">500</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-sm text-gray-500">
                                Total Records: {filteredRecords.length}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-orange-50 dark:bg-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700">
                                        <TableHead className="w-[60px] font-bold text-gray-700 dark:text-gray-200">#</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Property Code</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Plot Number</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Plot Price</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Paid Amount</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Outstanding</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">First Receipt</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">Last Receipt</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">Duration (Days)</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">Eligibility</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentRecords.length > 0 ? (
                                        currentRecords.map((record, index) => (
                                            <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                                                <TableCell className="font-medium">{indexOfFirstItem + index + 1}</TableCell>
                                                <TableCell className="text-indigo-600 dark:text-indigo-400">{record.property_code}</TableCell>
                                                <TableCell>{record.plot_number}</TableCell>
                                                <TableCell className="text-right">{formatNumber(record.total_cost)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(record.paid)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(record.outstanding)}</TableCell>
                                                <TableCell className="text-center">{record.first_date}</TableCell>
                                                <TableCell className="text-center">{record.last_date}</TableCell>
                                                <TableCell className="text-center">{record.days_span}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-bold text-white rounded-sm ${record.eligible ? 'bg-green-500' : 'bg-red-500'}`}>
                                                        {record.eligible ? 'Yes' : 'No'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                                                        {record.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-24 text-center">
                                                No records found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {filteredRecords.length > pageSize && (
                            <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t hide-print">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <div className="text-xs text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style>{`
                @media print {
                    .hide-print {
                        display: none !important;
                    }
                    .p-6 {
                        padding: 0 !important;
                    }
                    body {
                        background: white;
                    }
                }
            `}</style>
        </div>
    );
};

export default FreeRegistrationMonitor;
