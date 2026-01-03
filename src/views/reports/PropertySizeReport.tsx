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

interface Property {
    id: number;
    code: string;
    title: string;
    status: string;
    length: string | number;
    width: string | number;
    srq_feets: string | number;
    facing: string;
    ankanam_cost: string | number;
    ankanams: string | number;
    price: string | number;
    venture_id: number;
}

const PropertySizeReport = () => {
    const { token } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [openVentureSelect, setOpenVentureSelect] = useState(false);

    const [properties, setProperties] = useState<Property[]>([]);
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

                    console.log("Property Size Report Initial Load (Receipts Select):", result);

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
        setProperties([]);
        setGeneratedVenture(null);

        try {
            const queryParams = new URLSearchParams({
                'filter[venture_id]': selectedVenture,
            });

            const response = await fetch(`${ENDPOINTS.REPORTS_PROPERTY_SIZE}?${queryParams}`, {
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

            console.log("Property Size Report Data:", result);

            if (result && result.status && result.data) {
                setProperties(result.data.properties || []);
                setGeneratedVenture(result.data.venture || null);
            } else {
                // If API returns success: false or no data
                console.error("Failed to fetch report data", result);
            }

        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredProperties = properties.filter(p => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            p.code?.toLowerCase().includes(lowerTerm) ||
            p.title?.toLowerCase().includes(lowerTerm) ||
            p.facing?.toLowerCase().includes(lowerTerm) ||
            p.status?.toLowerCase().includes(lowerTerm)
        );
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentProperties = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProperties.length / pageSize);

    // Helper to format currency
    const formatCurrency = (amount: string | number) => {
        if (!amount) return '0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(Number(amount));
    };

    // Helper to format number (e.g. sqft)
    const formatNumber = (val: string | number) => {
        if (!val) return '0.00';
        return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    };

    // Status Color Helper
    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'available': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
            case 'booked': return 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200';
            case 'on offer': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
            case 'on agreement': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
            case 'registered': return 'bg-green-100 text-green-700 hover:bg-green-200';
            case 'hold': return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
            case 'not for sale': return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
            case 'mortgage': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Export Handlers
    const handleCopy = () => {
        if (filteredProperties.length === 0) return;
        const headers = ['S.No', 'Code', 'Title', 'Facing', 'Length X Width', 'Sq. Ft', 'Ankanams', 'Ankanam Cost', 'Price', 'Status'];
        const csvContent = [
            headers.join('\t'),
            ...filteredProperties.map((p, i) => [
                i + 1,
                p.code,
                p.title,
                p.facing || '-',
                `${p.length} X ${p.width}`,
                formatNumber(p.srq_feets),
                formatNumber(p.ankanams),
                formatCurrency(p.ankanam_cost),
                formatCurrency(p.price),
                p.status
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        if (filteredProperties.length === 0) return;
        const data = filteredProperties.map((p, i) => ({
            'S.No': i + 1,
            'Code': p.code,
            'Title': p.title,
            'Facing': p.facing || '-',
            'Length X Width': `${p.length} X ${p.width}`,
            'Sq. Ft': Number(p.srq_feets),
            'Ankanams': Number(p.ankanams),
            'Ankanam Cost': Number(p.ankanam_cost),
            'Price': Number(p.price),
            'Status': p.status
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PropertySizeReport");
        XLSX.writeFile(wb, "PropertySizeReport.xlsx");
    };

    const handleExportPDF = () => {
        if (filteredProperties.length === 0) return;
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
        doc.text("Property Size Report", 14, 15);
        if (generatedVenture) {
            doc.setFontSize(10);
            doc.text(`Venture: ${generatedVenture.title} (${generatedVenture.code})`, 14, 22);
        }

        const tableColumn = ['S.No', 'Code', 'Title', 'Facing', 'L X W', 'Sq.Ft', 'Ank', 'Ank Cost', 'Price', 'Status'];
        const tableRows = filteredProperties.map((p, i) => [
            i + 1,
            p.code,
            p.title,
            p.facing || '-',
            `${p.length}X${p.width}`, // Compact for PDF
            formatNumber(p.srq_feets),
            formatNumber(p.ankanams),
            formatCurrency(p.ankanam_cost),
            formatCurrency(p.price),
            p.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("PropertySizeReport.pdf");
    };

    const handlePrint = () => {
        window.print();
    };


    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Property Size Report</h2>
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
                                Total Properties: {filteredProperties.length}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <TableHead className="w-[60px] font-bold text-gray-700 dark:text-gray-200">S.No</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Code</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Title</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Facing</TableHead>
                                        <TableHead className="font-bold text-gray-700 dark:text-gray-200">Length X Width</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Sq. Ft</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Ankanams</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Ankanam Cost (₹)</TableHead>
                                        <TableHead className="text-right font-bold text-gray-700 dark:text-gray-200">Price (₹)</TableHead>
                                        <TableHead className="text-center font-bold text-gray-700 dark:text-gray-200">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentProperties.length > 0 ? (
                                        currentProperties.map((property, index) => (
                                            <TableRow key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <TableCell className="font-medium">{indexOfFirstItem + index + 1}</TableCell>
                                                <TableCell className="text-indigo-600 dark:text-indigo-400">{property.code}</TableCell>
                                                <TableCell>{property.title}</TableCell>
                                                <TableCell className="uppercase text-xs font-semibold text-gray-500">{property.facing || '-'}</TableCell>
                                                <TableCell>{property.length} X {property.width}</TableCell>
                                                <TableCell className="text-right text-xs">{formatNumber(property.srq_feets)}</TableCell>
                                                <TableCell className="text-right text-xs">{formatNumber(property.ankanams)}</TableCell>
                                                <TableCell className="text-right text-xs text-gray-600">{formatNumber(property.ankanam_cost)}</TableCell>
                                                <TableCell className="text-right font-medium text-xs">{formatNumber(property.price)}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(property.status)}`}>
                                                        {property.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                No properties found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {filteredProperties.length > pageSize && (
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

export default PropertySizeReport;
