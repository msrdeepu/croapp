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

import { Check, ChevronsUpDown } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import { Input } from 'src/components/ui/input';
import { Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from 'src/components/ui/accordion';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import { DatePicker } from 'src/components/ui/date-picker';
import { format } from 'date-fns';


interface Venture {
    id: number;
    title: string;
    location: string;
    code: string;
    branch_id?: number;
}

interface Branch {
    id: number;
    code: string;
    location: string;
}



interface BusinessStats {
    available_worth: string;
    total: string;
    pending: string;
    paid: string;
}

interface Expenses {
    total: string;
    land: string;
    dips: string;
    dev: string;
    reg: string;
    [key: string]: string;
}


interface Receipt {
    id: number;
    paidon: string;
    paid_amount: string;
    payment_method: string;
    customer_name: string;
    receipt_number: string;
    project_name?: string;
    property_title?: string;
    agent_code?: string;
    property_code?: string;
    purpose?: string;
    status: string;
}

interface VentureDetails {
    id: number;
    title: string;
    location: string;
    code: string;
    status: string;
    body: string | null;
    access?: string;
    [key: string]: any;
}

interface OutstandingProperty {
    id: number;
    code: string;
    plot_no: string;
    outstanding: string | number;
    customer?: {
        id: number;
        name: string;
        fullname?: string;
        surname?: string;
        phone?: string;
        mobile_number?: string;
        whatsapp_number?: string;
    };
    agent?: {
        id: number;
        agent_code: string;
        fullname: string;
        surname: string;
        cc: string;
    }
}

interface PlotItem {
    id: number;
    code: string;
    plot_no: string;
}

interface ReportData {
    pageTitle: string;
    receipts_count: number;
    total_project_value: string;
    total_sale: string;
    outstanding: string;
    area: { ankanams: number; sqft: number };
    business: BusinessStats;

    expenses: Expenses;

    regplots_count?: number;
    registeredPaidAmount?: string;
    regplots?: Record<string, number> | string[] | PlotItem[]; // Handling potential object or array

    paidRegPendingplots_count?: number;
    paidRegPendingplots?: Record<string, number> | string[] | PlotItem[];
    paidRegPendingPaidAmount?: string;

    onAgreementplots_count?: number;
    onAgreementplots?: Record<string, number> | string[] | PlotItem[];
    onAgreementPaidAmount?: string;

    bookedplots_count?: number;
    bookedplots?: Record<string, number> | string[] | PlotItem[];
    bookedPaidAmount?: string;

    holdplots_count?: number;
    holdplots?: Record<string, number> | string[] | PlotItem[];
    holdPaidAmount?: string;

    nfsplots_count?: number;
    nfsplots?: Record<string, number> | string[] | PlotItem[];
    nfsPaidAmount?: string;

    availableplots_count?: number;
    availableplots?: Record<string, number> | string[] | PlotItem[];
    availableWorth?: string;

    mortgageplots_count?: number;
    mortgageplots?: Record<string, number> | string[] | PlotItem[];
    mortgagePaidAmount?: string;

    ownerplots_count?: number;
    ownerplots?: Record<string, number> | string[] | PlotItem[];
    ownerPaidAmount?: string;

    investorplots_count?: number;
    investorplots?: Record<string, number> | string[] | PlotItem[];
    investorPaidAmount?: string;

    redzoneplots_count?: number;
    redzoneplots?: Record<string, number> | string[] | PlotItem[];
    redzonePaidAmount?: string;

    // Outstanding Data
    agreementOutstanding?: string | number;
    agreementOutstandingProps?: OutstandingProperty[];

    bookedOutstanding?: string | number;
    bookedOutstandingProps?: OutstandingProperty[];

    receipts: Receipt[];
    venture?: VentureDetails;
}

const ProjectBusinessReport = () => {
    const { token, user } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);


    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');


    const [openVentureSelect, setOpenVentureSelect] = useState(false);
    const [openBranchSelect, setOpenBranchSelect] = useState(false);


    // Filters
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    const [reportData, setReportData] = useState<ReportData | null>(null);

    const [loading, setLoading] = useState(false);

    // Initial load for dropdowns
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch using RECEIPTS_SELECT as it is the proven working endpoint for ventures list
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
                    const data = actualData?.data || actualData; // Handle wrapped data

                    if (data) {
                        setVentures(data.ventures || []);
                        setBranches(data.branches || []);

                    }
                }
            } catch (error) {
                console.error("Error fetching initial report data", error);
            }
        };
        if (token) fetchInitialData();
    }, [token]);

    const handleGenerateReport = async () => {
        if (!selectedVenture) return;
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                'filter[venture_id]': selectedVenture,
                ...(selectedBranch && { 'filter[branch_id]': selectedBranch }),

                ...(startDate && { 'filter[starts_on]': format(startDate, 'yyyy-MM-dd') }),
                ...(endDate && { 'filter[ends_on]': format(endDate, 'yyyy-MM-dd') }),
            });

            const response = await fetch(`${ENDPOINTS.REPORTS_CURRENT_BUSINESS}?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

            console.log("Current Business Report API Response:", result);
            setReportData(result);
            console.log("Booked Outstanding Props:", result?.bookedOutstandingProps);
            console.log("Agreement Outstanding Props:", result?.agreementOutstandingProps);
            console.log("Expenses:", result?.expenses);

        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Logic
    const filteredReceipts = reportData?.receipts?.filter(receipt => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            receipt.receipt_number?.toLowerCase().includes(lowerTerm) ||
            receipt.customer_name?.toLowerCase().includes(lowerTerm) ||
            receipt.property_title?.toLowerCase().includes(lowerTerm) ||
            receipt.status?.toLowerCase().includes(lowerTerm) ||
            receipt.agent_code?.toLowerCase().includes(lowerTerm) ||
            receipt.purpose?.toLowerCase().includes(lowerTerm) ||
            receipt.property_code?.toLowerCase().includes(lowerTerm)
        );
    }) || [];

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentReceipts = filteredReceipts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReceipts.length / pageSize);

    // Booked Outstanding Pagination & Search
    const [pageBooked, setPageBooked] = useState(1);
    const [pageSizeBooked, setPageSizeBooked] = useState(10);
    const [searchBooked, setSearchBooked] = useState('');

    const filteredBookedProps = reportData?.bookedOutstandingProps?.filter(item => {
        if (!searchBooked) return true;
        const lowerTerm = searchBooked.toLowerCase();
        return (
            item.code?.toLowerCase().includes(lowerTerm) ||
            item.plot_no?.toLowerCase().includes(lowerTerm) ||
            item.customer?.name?.toLowerCase().includes(lowerTerm) ||
            item.customer?.fullname?.toLowerCase().includes(lowerTerm) ||
            item.customer?.mobile_number?.includes(lowerTerm) ||
            item.agent?.fullname?.toLowerCase().includes(lowerTerm) ||
            item.agent?.agent_code?.toLowerCase().includes(lowerTerm)
        );
    }) || [];

    const indexOfLastBooked = pageBooked * pageSizeBooked;
    const indexOfFirstBooked = indexOfLastBooked - pageSizeBooked;
    const currentBookedItems = filteredBookedProps.slice(indexOfFirstBooked, indexOfLastBooked);
    const totalBookedPages = Math.ceil(filteredBookedProps.length / pageSizeBooked);


    // Agreement Outstanding Pagination & Search
    const [pageAgreement, setPageAgreement] = useState(1);
    const [pageSizeAgreement, setPageSizeAgreement] = useState(10);
    const [searchAgreement, setSearchAgreement] = useState('');

    const filteredAgreementProps = reportData?.agreementOutstandingProps?.filter(item => {
        if (!searchAgreement) return true;
        const lowerTerm = searchAgreement.toLowerCase();
        return (
            item.code?.toLowerCase().includes(lowerTerm) ||
            item.plot_no?.toLowerCase().includes(lowerTerm) ||
            item.customer?.name?.toLowerCase().includes(lowerTerm) ||
            item.customer?.fullname?.toLowerCase().includes(lowerTerm) ||
            item.customer?.mobile_number?.includes(lowerTerm) ||
            item.agent?.fullname?.toLowerCase().includes(lowerTerm) ||
            item.agent?.agent_code?.toLowerCase().includes(lowerTerm)
        );
    }) || [];

    const indexOfLastAgreement = pageAgreement * pageSizeAgreement;
    const indexOfFirstAgreement = indexOfLastAgreement - pageSizeAgreement;
    const currentAgreementItems = filteredAgreementProps.slice(indexOfFirstAgreement, indexOfLastAgreement);
    const totalAgreementPages = Math.ceil(filteredAgreementProps.length / pageSizeAgreement);

    // Export Handlers
    const handleCopy = () => {
        if (!reportData?.receipts) return;
        const headers = ['Receipt No', 'Date', 'Name', 'Property', 'Prty Code', 'Agent', 'Purpose', 'Mode', 'Status', 'Amount'];
        const csvContent = [
            headers.join('\t'),
            ...filteredReceipts.map(r => [
                r.receipt_number,
                r.paidon.split(' ')[0],
                r.customer_name,
                r.property_title || '-',
                r.property_code || '-',
                r.agent_code || '-',
                r.purpose || '-',
                r.payment_method,
                r.status,
                r.paid_amount
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        if (!reportData?.receipts) return;
        const data = filteredReceipts.map(r => ({
            'Receipt No': r.receipt_number,
            'Date': r.paidon.split(' ')[0],
            'Name': r.customer_name,
            'Property': r.property_title || '-',
            'Property Code': r.property_code || '-',
            'Agent Code': r.agent_code || '-',
            'Purpose': r.purpose || '-',
            'Mode': r.payment_method,
            'Status': r.status,
            'Amount': r.paid_amount
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Receipts");
        XLSX.writeFile(wb, "receipts_export.xlsx");
    };

    const handleExportPDF = () => {
        if (!reportData?.receipts) return;
        const doc = new jsPDF();
        doc.text("Receipts List", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = ['Receipt No', 'Date', 'Name', 'Property', 'Prty Code', 'Agent', 'Purpose', 'Mode', 'Status', 'Amount'];
        const tableRows = filteredReceipts.map(r => [
            r.receipt_number,
            r.paidon.split(' ')[0],
            r.customer_name,
            r.property_title || '-',
            r.property_code || '-',
            r.agent_code || '-',
            r.purpose || '-',
            r.payment_method,
            r.status,
            r.paid_amount
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("receipts_export.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Current Business Report</h2>
            <Card className="mb-6">
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

                        {/* Branch Select */}
                        {((user as any)?.user_type === 'admin' || (user as any)?.is_manager) && (
                            <div>
                                <Label className="mb-2 block">Select Branch</Label>
                                <Popover open={openBranchSelect} onOpenChange={setOpenBranchSelect}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openBranchSelect}
                                            className="w-full justify-between"
                                        >
                                            <span className="truncate">
                                                {selectedBranch
                                                    ? branches.find((b) => b.id.toString() === selectedBranch)?.location
                                                    : "Select Branch"}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch..." />
                                            <CommandList>
                                                <CommandEmpty>No branch found.</CommandEmpty>
                                                <CommandGroup>
                                                    {branches.map((b) => (
                                                        <CommandItem
                                                            key={b.id}
                                                            value={`${b.code} - ${b.location}`}
                                                            onSelect={() => {
                                                                setSelectedBranch(b.id.toString() === selectedBranch ? "" : b.id.toString());
                                                                setOpenBranchSelect(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedBranch === b.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {b.code} - {b.location}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}



                        {/* Date Range */}
                        <div>
                            <Label className="mb-2 block">Start Date</Label>
                            <DatePicker date={startDate} setDate={setStartDate} />
                        </div>
                        <div>
                            <Label className="mb-2 block">End Date</Label>
                            <DatePicker date={endDate} setDate={setEndDate} />
                        </div>

                        <Button onClick={handleGenerateReport} disabled={loading || !selectedVenture}>
                            {loading ? "Generating..." : "Submit"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <div className="space-y-6">
                    {reportData.venture && (
                        <Card className="overflow-hidden border-none shadow-md bg-white dark:bg-gray-800">
                            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                            {reportData.venture.title}
                                        </h2>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm ${reportData.venture.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {reportData.venture.status}
                                        </span>
                                        {(startDate || endDate) && (
                                            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded border">
                                                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Start'} - {endDate ? format(endDate, 'dd/MM/yyyy') : 'End'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            Code: {reportData.venture.code}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            Location: {reportData.venture.location}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="text-center mb-6">
                        <h3 className="text-lg font-bold">{reportData.pageTitle}</h3>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Project Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {reportData.total_project_value}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Sale</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {reportData.total_sale}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹ {reportData.outstanding}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Receipts Count</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.receipts_count}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Registration Details Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="registration-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Registration Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Registered Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.regplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-emerald-600">₹ {reportData?.registeredPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Registered Plot Nos</h4>
                                    {reportData?.regplots && (Object.keys(reportData.regplots).length > 0 || (Array.isArray(reportData.regplots) && reportData.regplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.regplots)
                                                ? reportData.regplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.regplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No registered plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Paid Registration Pending Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="paid-registration-pending" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Paid Registration Pending Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.paidRegPendingplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-orange-600">₹ {reportData?.paidRegPendingPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Pending Plot Nos</h4>
                                    {reportData?.paidRegPendingplots && (Object.keys(reportData.paidRegPendingplots).length > 0 || (Array.isArray(reportData.paidRegPendingplots) && reportData.paidRegPendingplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.paidRegPendingplots)
                                                ? reportData.paidRegPendingplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded border border-orange-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.paidRegPendingplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded border border-orange-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No paid registration pending plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* On Agreement Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="on-agreement" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">On Agreement Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Agreement Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.onAgreementplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-purple-600">₹ {reportData?.onAgreementPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Agreement Plot Nos</h4>
                                    {reportData?.onAgreementplots && (Object.keys(reportData.onAgreementplots).length > 0 || (Array.isArray(reportData.onAgreementplots) && reportData.onAgreementplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.onAgreementplots)
                                                ? reportData.onAgreementplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded border border-purple-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.onAgreementplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded border border-purple-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No plots on agreement found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Booked Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="booked" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Booked Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Booked Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.bookedplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-green-600">₹ {reportData?.bookedPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Booked Plot Nos</h4>
                                    {reportData?.bookedplots && (Object.keys(reportData.bookedplots).length > 0 || (Array.isArray(reportData.bookedplots) && reportData.bookedplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.bookedplots)
                                                ? reportData.bookedplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.bookedplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded border border-green-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No booked plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Available Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="available-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Available Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.availableplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Worth</span>
                                            <span className="text-xl font-bold text-sky-600">₹ {reportData?.availableWorth || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Available Plot Nos</h4>
                                    {reportData?.availableplots && (Object.keys(reportData.availableplots).length > 0 || (Array.isArray(reportData.availableplots) && reportData.availableplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.availableplots)
                                                ? reportData.availableplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded border border-sky-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.availableplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded border border-sky-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No available plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Hold Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="hold-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Hold Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hold Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.holdplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-orange-600">₹ {reportData?.holdPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Hold Plot Nos</h4>
                                    {reportData?.holdplots && (Object.keys(reportData.holdplots).length > 0 || (Array.isArray(reportData.holdplots) && reportData.holdplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.holdplots)
                                                ? reportData.holdplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded border border-orange-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.holdplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded border border-orange-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hold plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Mortgage Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="mortgage-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Mortgage Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Mortgage Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.mortgageplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-indigo-600">₹ {reportData?.mortgagePaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Mortgage Plot Nos</h4>
                                    {reportData?.mortgageplots && (Object.keys(reportData.mortgageplots).length > 0 || (Array.isArray(reportData.mortgageplots) && reportData.mortgageplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.mortgageplots)
                                                ? reportData.mortgageplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded border border-indigo-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.mortgageplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded border border-indigo-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No mortgage plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Owner Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="owner-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Owner Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Owner Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.ownerplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-amber-600">₹ {reportData?.ownerPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Owner Plot Nos</h4>
                                    {reportData?.ownerplots && (Object.keys(reportData.ownerplots).length > 0 || (Array.isArray(reportData.ownerplots) && reportData.ownerplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.ownerplots)
                                                ? reportData.ownerplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded border border-amber-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.ownerplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded border border-amber-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No owner plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Investor Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="investor-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Investor Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Investor Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.investorplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-teal-600">₹ {reportData?.investorPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Investor Plot Nos</h4>
                                    {reportData?.investorplots && (Object.keys(reportData.investorplots).length > 0 || (Array.isArray(reportData.investorplots) && reportData.investorplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.investorplots)
                                                ? reportData.investorplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded border border-teal-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.investorplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded border border-teal-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No investor plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Red Zone Plots Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="redzone-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Red Zone Plots Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Red Zone Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.redzoneplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-red-600">₹ {reportData?.redzonePaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">Red Zone Plot Nos</h4>
                                    {reportData?.redzoneplots && (Object.keys(reportData.redzoneplots).length > 0 || (Array.isArray(reportData.redzoneplots) && reportData.redzoneplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.redzoneplots)
                                                ? reportData.redzoneplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.redzoneplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded border border-red-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No red zone plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Not For Sale (NFS) Accordion */}
                    <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4 mb-4">
                        <AccordionItem value="nfs-details" className="border-b-0">
                            <AccordionTrigger className="hover:no-underline py-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Not For Sale (NFS) Details</span>
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">NFS Plots</span>
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">{reportData?.nfsplots_count || 0}</span>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Paid Amount</span>
                                            <span className="text-xl font-bold text-rose-600">₹ {reportData?.nfsPaidAmount || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pt-2 pb-4 border-t">
                                    <h4 className="text-sm font-semibold mb-3 text-gray-500">NFS Plot Nos</h4>
                                    {reportData?.nfsplots && (Object.keys(reportData.nfsplots).length > 0 || (Array.isArray(reportData.nfsplots) && reportData.nfsplots.length > 0)) ? (
                                        <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                                            {Array.isArray(reportData.nfsplots)
                                                ? reportData.nfsplots.map((item, index) => {
                                                    const displayValue = typeof item === 'object' && item !== null && 'plot_no' in item ? (item as PlotItem).plot_no : String(item);
                                                    return (
                                                        <span key={index} className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded border border-rose-100">
                                                            {displayValue}
                                                        </span>
                                                    );
                                                })
                                                : Object.entries(reportData.nfsplots).map(([code, plot_no]) => (
                                                    <span key={code} className="px-2 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded border border-rose-100">
                                                        {String(plot_no)}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No NFS plots found.</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    {/* Outstanding Overview */}
                    <div className="space-y-4 mb-6">
                        <h3 className="text-lg font-bold">Outstanding Payments Overview</h3>

                        {/* Booked Outstanding */}
                        <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4">
                            <AccordionItem value="booked-outstanding" className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Booked Outstanding</span>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Outstanding</span>
                                            <span className="text-xl font-bold text-red-600">₹ {reportData?.bookedOutstanding || '0'}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-2 pb-4 border-t">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Search Booked..."
                                                    value={searchBooked}
                                                    onChange={(e) => { setSearchBooked(e.target.value); setPageBooked(1); }}
                                                    className="h-8 w-40"
                                                />
                                                <Select
                                                    value={pageSizeBooked.toString()}
                                                    onValueChange={(val) => { setPageSizeBooked(Number(val)); setPageBooked(1); }}
                                                >
                                                    <SelectTrigger className="w-[70px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5</SelectItem>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="25">25</SelectItem>
                                                        <SelectItem value="50">50</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Code</TableHead>
                                                    <TableHead>Plot No</TableHead>
                                                    <TableHead>Customer Name</TableHead>
                                                    <TableHead>Mobile</TableHead>
                                                    <TableHead>Whatsapp</TableHead>
                                                    <TableHead>Ag. Code</TableHead>
                                                    <TableHead>Agent Name</TableHead>
                                                    <TableHead>Cadre</TableHead>
                                                    <TableHead className="text-right">Outstanding</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentBookedItems.length > 0 ? (
                                                    currentBookedItems.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">{item.code}</TableCell>
                                                            <TableCell>{item.plot_no}</TableCell>
                                                            <TableCell>
                                                                {item.customer ? `${item.customer.fullname || item.customer.name} ${item.customer.surname || ''}` : '-'}
                                                            </TableCell>
                                                            <TableCell>{item.customer?.mobile_number || item.customer?.phone || '-'}</TableCell>
                                                            <TableCell>{item.customer?.whatsapp_number || '-'}</TableCell>
                                                            <TableCell className="font-medium">{item.agent?.agent_code || '-'}</TableCell>
                                                            <TableCell>
                                                                {item.agent ? `${item.agent.fullname} ${item.agent.surname}` : '-'}
                                                            </TableCell>
                                                            <TableCell>{item.agent?.cc || '-'}</TableCell>
                                                            <TableCell className="text-right font-bold text-red-600">
                                                                ₹ {item.outstanding}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center italic text-gray-500">
                                                            No booked outstanding records found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination Controls */}
                                        {filteredBookedProps.length > 0 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-sm text-gray-500">
                                                    Showing {indexOfFirstBooked + 1} to {Math.min(indexOfLastBooked, filteredBookedProps.length)} of {filteredBookedProps.length} entries
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPageBooked(prev => Math.max(prev - 1, 1))}
                                                        disabled={pageBooked === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="text-sm font-medium">
                                                        Page {pageBooked} of {totalBookedPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPageBooked(prev => Math.min(prev + 1, totalBookedPages))}
                                                        disabled={pageBooked === totalBookedPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Agreement Outstanding */}
                        <Accordion type="single" collapsible className="w-full bg-white dark:bg-gray-800 rounded-lg border shadow-sm px-4">
                            <AccordionItem value="agreement-outstanding" className="border-b-0">
                                <AccordionTrigger className="hover:no-underline py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 pr-4">
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Agreement Outstanding</span>
                                        <div className="flex flex-col items-start sm:items-end">
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Outstanding</span>
                                            <span className="text-xl font-bold text-red-600">₹ {reportData?.agreementOutstanding || '0'}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="pt-2 pb-4 border-t">
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Search Agreement..."
                                                    value={searchAgreement}
                                                    onChange={(e) => { setSearchAgreement(e.target.value); setPageAgreement(1); }}
                                                    className="h-8 w-40"
                                                />
                                                <Select
                                                    value={pageSizeAgreement.toString()}
                                                    onValueChange={(val) => { setPageSizeAgreement(Number(val)); setPageAgreement(1); }}
                                                >
                                                    <SelectTrigger className="w-[70px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="5">5</SelectItem>
                                                        <SelectItem value="10">10</SelectItem>
                                                        <SelectItem value="25">25</SelectItem>
                                                        <SelectItem value="50">50</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Code</TableHead>
                                                    <TableHead>Plot No</TableHead>
                                                    <TableHead>Customer Name</TableHead>
                                                    <TableHead>Mobile</TableHead>
                                                    <TableHead>Whatsapp</TableHead>
                                                    <TableHead>Ag. Code</TableHead>
                                                    <TableHead>Agent Name</TableHead>
                                                    <TableHead>Cadre</TableHead>
                                                    <TableHead className="text-right">Outstanding</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentAgreementItems.length > 0 ? (
                                                    currentAgreementItems.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell className="font-medium">{item.code}</TableCell>
                                                            <TableCell>{item.plot_no}</TableCell>
                                                            <TableCell>
                                                                {item.customer ? `${item.customer.fullname || item.customer.name} ${item.customer.surname || ''}` : '-'}
                                                            </TableCell>
                                                            <TableCell>{item.customer?.mobile_number || item.customer?.phone || '-'}</TableCell>
                                                            <TableCell>{item.customer?.whatsapp_number || '-'}</TableCell>
                                                            <TableCell className="font-medium">{item.agent?.agent_code || '-'}</TableCell>
                                                            <TableCell>
                                                                {item.agent ? `${item.agent.fullname} ${item.agent.surname}` : '-'}
                                                            </TableCell>
                                                            <TableCell>{item.agent?.cc || '-'}</TableCell>
                                                            <TableCell className="text-right font-bold text-red-600">
                                                                ₹ {item.outstanding}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={9} className="text-center italic text-gray-500">
                                                            No agreement outstanding records found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination Controls */}
                                        {filteredAgreementProps.length > 0 && (
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="text-sm text-gray-500">
                                                    Showing {indexOfFirstAgreement + 1} to {Math.min(indexOfLastAgreement, filteredAgreementProps.length)} of {filteredAgreementProps.length} entries
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPageAgreement(prev => Math.max(prev - 1, 1))}
                                                        disabled={pageAgreement === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="text-sm font-medium">
                                                        Page {pageAgreement} of {totalAgreementPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPageAgreement(prev => Math.min(prev + 1, totalAgreementPages))}
                                                        disabled={pageAgreement === totalAgreementPages}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Area Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Area (Ankanams)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.area?.ankanams?.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Area (Sqft)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.area?.sqft?.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Business Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-900/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Business</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">₹ {reportData.business?.total}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-900/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">₹ {reportData.business?.paid}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">₹ {reportData.business?.pending}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-50 dark:bg-purple-900/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Available Worth</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">₹ {reportData.business?.available_worth}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Expenses */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Expenses Breakdown (Total: ₹ {reportData.expenses?.total || 0})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(reportData.expenses || {}).map(([key, value]) => {
                                    if (key === 'total') return null;

                                    const EXPENSE_LABELS: Record<string, string> = {
                                        'land': 'Land Payments',
                                        'reg': 'Registration Expenses',
                                        'dev': 'Development Expenses',
                                        'cancel': 'Cancelled',
                                        'excess': 'Excess',
                                        'dips': 'DIPS',
                                        'reward': 'Rewards'
                                    };

                                    const label = EXPENSE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);

                                    return (
                                        <div key={key} className="flex flex-col border p-3 rounded-md">
                                            <span className="text-xs uppercase text-muted-foreground font-semibold">{label}</span>
                                            <span className="text-lg font-bold">₹ {String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>



                    {/* Receipts Table */}
                    <Card>
                        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <CardTitle>Receipts ({reportData.receipts?.length || 0})</CardTitle>
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                                        <Copy className="h-4 w-4 mr-1" /> Copy
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleExportExcel} title="Export to Excel">
                                        <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleExportPDF} title="Export to PDF">
                                        <FileText className="h-4 w-4 mr-1" /> PDF
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handlePrint} title="Print">
                                        <Printer className="h-4 w-4 mr-1" /> Print
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="h-8 w-40"
                                    />
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
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Receipt No</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Property</TableHead>
                                            <TableHead>Prty Code</TableHead>
                                            <TableHead>Agent</TableHead>
                                            <TableHead>Purpose</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentReceipts.length > 0 ? (
                                            currentReceipts.map((receipt) => (
                                                <TableRow key={receipt.id}>
                                                    <TableCell>{receipt.receipt_number}</TableCell>
                                                    <TableCell>{receipt.paidon.split(' ')[0]}</TableCell>
                                                    <TableCell>{receipt.customer_name}</TableCell>
                                                    <TableCell>{receipt.property_title}</TableCell>
                                                    <TableCell>{receipt.property_code || '-'}</TableCell>
                                                    <TableCell>{receipt.agent_code || '-'}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${receipt.purpose === 'Plot Booking' ? 'bg-blue-100 text-blue-700' :
                                                            receipt.purpose === 'Renewal' ? 'bg-green-100 text-green-700' :
                                                                receipt.purpose === 'Document Value' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {receipt.purpose || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{receipt.payment_method}</TableCell>
                                                    <TableCell>{receipt.status}</TableCell>
                                                    <TableCell className="text-right font-medium">₹ {receipt.paid_amount}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="text-center h-24">
                                                    No receipts found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {filteredReceipts.length > 0 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-500">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReceipts.length)} of {filteredReceipts.length} entries
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
                            )}
                        </CardContent>
                    </Card>
                </div>
            )
            }


        </div >
    );
};

export default ProjectBusinessReport;
