
import { useState, useEffect } from 'react';
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
import { Input } from 'src/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import { Check, ChevronsUpDown, FileSpreadsheet, Copy, FileText } from 'lucide-react';
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

import { DatePicker } from 'src/components/ui/date-picker';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import * as XLSX from 'xlsx';

// Types based on backend response
interface Venture {
    id: number;
    title: string;
    branch_id?: number;
}

interface Branch {
    id: number;
    code: string;
    location: string;
}

interface Agent {
    agent_code: string;
    fullname: string;
    surname: string;
    cc: string;
}

interface Property {
    id: number;
    code: string;
    title: string;
    location: string;
}

interface Receipt {
    id: number;
    receipt_number: string;
    paid_amount: string; // or number
    paidon: string;
    agent_code: string;
    project_name: string;
    plot_no: string;
    property_code: string;
    customer_name: string;
    cmobile?: string;
    caltmobile?: string;
    cphone?: string;
    cwhatsapp?: string;
    purpose: string;
    details: string;
    payment_method: string;
    created: string;
    status: string; // To check if canceled?
}

interface Stats {
    receipts_count: number;
    total_sale: string | number; // JSON might return string "1000.00"
    total_canceled: string | number;
    cancel_receipt_count: number;
    actual_amount: number;
    net_amount: number;
}

interface ApiResponse {
    status: string;
    data: Receipt[];
    filters: {
        branches: Branch[];
        agents: Agent[];
        ventures: Venture[];
        properties: Property[];
    };
    stats: Stats;
    meta: {
        page_title: string;
        date: string;
        selected_venture: Venture | null;
        selected_branch: Branch | null;
    };
}

const SalesReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Filters State
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);

    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedAgent, setSelectedAgent] = useState<string>('');
    const [selectedProperty, setSelectedProperty] = useState<string>('');

    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Filter Dropdown Open States (for Popovers)
    const [openVentureSelect, setOpenVentureSelect] = useState(false);
    const [openBranchSelect, setOpenBranchSelect] = useState(false);
    const [openAgentSelect, setOpenAgentSelect] = useState(false);
    const [openPropertySelect, setOpenPropertySelect] = useState(false);

    // Data State
    const [reportData, setReportData] = useState<ApiResponse | null>(null);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (token) {
            fetchReportData(); // Fetch initial data
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const fetchReportData = async (isFilter = false) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (isFilter) {
                if (selectedVenture) queryParams.append('filter[venture_id]', selectedVenture);
                if (selectedBranch) queryParams.append('filter[branch_id]', selectedBranch);
                if (selectedAgent) queryParams.append('filter[agent_code]', selectedAgent);
                if (selectedProperty) queryParams.append('filter[property_code]', selectedProperty);
                if (startDate) queryParams.append('filter[starts_on]', format(startDate, 'yyyy-MM-dd'));
                if (endDate) queryParams.append('filter[ends_on]', format(endDate, 'yyyy-MM-dd'));
            }

            const endpoint = ENDPOINTS.SALES_REPORT;

            const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const text = await response.text();
                let result: ApiResponse;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    // Fallback for double-encoded or malformed JSON (common issue with some backend responses)
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { result = JSON.parse(fixedText); } catch (e2) { console.error("Double parse failed", e2); throw e; }
                    } else { throw e; }
                }

                setReportData(result);
                // Update lists if empty (initial load)
                if (!isFilter || ventures.length === 0) {
                    setVentures(result.filters?.ventures || []);
                    setBranches(result.filters?.branches || []);
                    setAgents(result.filters?.agents || []);
                    setProperties(result.filters?.properties || []);
                }
            } else {
                console.error("Failed to fetch sales report");
            }

        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        setSearchTerm(''); // Reset search on new report
        setCurrentPage(1);
        fetchReportData(true);
    };

    // Helper to format currency
    const formatCurrency = (val: string | number) => {
        const num = Number(val);
        if (isNaN(num)) return '₹ 0.00';
        return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Filter Logic for Client-Side Search
    const filteredData = reportData?.data?.filter(item => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            item.receipt_number?.toLowerCase().includes(lowerTerm) ||
            item.customer_name?.toLowerCase().includes(lowerTerm) ||
            item.plot_no?.toLowerCase().includes(lowerTerm) ||
            item.project_name?.toLowerCase().includes(lowerTerm) ||
            item.agent_code?.toLowerCase().includes(lowerTerm)
        );
    }) || [];

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / pageSize);

    const handleCopy = () => {
        if (!filteredData.length) return;
        const headers = [
            'Receipt #', 'Amount', 'Paid On', 'Agent', 'Project', 'Plot',
            'Property', 'Customer', 'Purpose', 'Details', 'Payment', 'Created By'
        ];
        const csvContent = [
            headers.join('\t'),
            ...filteredData.map(r => [
                r.receipt_number,
                r.paid_amount,
                r.paidon,
                r.agent_code,
                r.project_name,
                r.plot_no,
                r.property_code,
                r.customer_name,
                r.purpose,
                r.details,
                r.payment_method,
                r.created
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        // Toast could go here
    };

    const handleExportExcel = () => {
        if (!filteredData.length) return;
        const dataToExport = filteredData.map(r => ({
            'Receipt #': r.receipt_number,
            'Amount': Number(r.paid_amount),
            'Paid On': r.paidon,
            'Agent': r.agent_code,
            'Project': r.project_name,
            'Plot': r.plot_no,
            'Property': r.property_code,
            'Customer': r.customer_name,
            'Purpose': r.purpose,
            'Details': r.details,
            'Payment': r.payment_method,
            'Created By': r.created
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        XLSX.writeFile(wb, "Sales_Report.xlsx");
    };

    const handleExportPDF = () => {
        // Placeholder for PDF export if needed, logic similar to Receipts.tsx
        // For now user just asked for button options layout
    };

    return (
        <div className="p-6">


            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 items-end">

                        {/* Venture */}
                        <div className="flex flex-col gap-2">
                            <Label>Venture</Label>
                            <Popover open={openVentureSelect} onOpenChange={setOpenVentureSelect}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedVenture ? ventures.find(v => v.id.toString() === selectedVenture)?.title : "Select Venture"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search venture..." />
                                        <CommandList>
                                            <CommandEmpty>No venture found.</CommandEmpty>
                                            <CommandGroup>
                                                {ventures.map((v) => (
                                                    <CommandItem key={v.id} value={v.title} onSelect={() => { setSelectedVenture(v.id.toString()); setOpenVentureSelect(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedVenture === v.id.toString() ? "opacity-100" : "opacity-0")} />
                                                        {v.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Branch */}
                        {branches.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <Label>Branch</Label>
                                <Popover open={openBranchSelect} onOpenChange={setOpenBranchSelect}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedBranch ? branches.find(b => b.id.toString() === selectedBranch)?.code : "Select Branch"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search branch..." />
                                            <CommandList>
                                                <CommandEmpty>No branch found.</CommandEmpty>
                                                <CommandGroup>
                                                    {branches.map((b) => (
                                                        <CommandItem key={b.id} value={b.code} onSelect={() => { setSelectedBranch(b.id.toString()); setOpenBranchSelect(false); }}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedBranch === b.id.toString() ? "opacity-100" : "opacity-0")} />
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

                        {/* Agent */}
                        <div className="flex flex-col gap-2">
                            <Label>Agent</Label>
                            <Popover open={openAgentSelect} onOpenChange={setOpenAgentSelect}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedAgent ? agents.find(a => a.agent_code === selectedAgent)?.agent_code : "Select Agent"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search agent..." />
                                        <CommandList>
                                            <CommandEmpty>No agent found.</CommandEmpty>
                                            <CommandGroup>
                                                {agents.map((a) => (
                                                    <CommandItem key={a.agent_code} value={`${a.agent_code} ${a.fullname}`} onSelect={() => { setSelectedAgent(a.agent_code); setOpenAgentSelect(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedAgent === a.agent_code ? "opacity-100" : "opacity-0")} />
                                                        {a.agent_code} - {a.fullname}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Property */}
                        <div className="flex flex-col gap-2">
                            <Label>Property</Label>
                            <Popover open={openPropertySelect} onOpenChange={setOpenPropertySelect}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {selectedProperty ? properties.find(p => p.code === selectedProperty)?.code : "Select Property"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search property..." />
                                        <CommandList>
                                            <CommandEmpty>No property found.</CommandEmpty>
                                            <CommandGroup>
                                                {properties.map((p) => (
                                                    <CommandItem key={p.id} value={`${p.code} ${p.title}`} onSelect={() => { setSelectedProperty(p.code); setOpenPropertySelect(false); }}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedProperty === p.code ? "opacity-100" : "opacity-0")} />
                                                        {p.code} - {p.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Dates */}
                        <div className="flex flex-col gap-2">
                            <Label>Start Date</Label>
                            <DatePicker date={startDate} setDate={setStartDate} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>End Date</Label>
                            <DatePicker date={endDate} setDate={setEndDate} />
                        </div>

                        <Button onClick={handleGenerateReport} disabled={loading} className="md:col-span-1 lg:col-span-1">
                            {loading ? "Loading..." : "Submit"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            {reportData && reportData.stats && (
                <div className="flex justify-center my-4">
                    <div className="w-full max-w-3xl border rounded-xl overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-center text-sm">
                            <tbody>
                                {reportData.meta.selected_branch && (
                                    <tr className="border-b">
                                        <td colSpan={3} className="py-2 font-bold bg-gray-50">
                                            Branch: {reportData.meta.selected_branch.code} ({reportData.meta.selected_branch.location})
                                        </td>
                                    </tr>
                                )}
                                <tr className="border-b">
                                    <td className="py-2 px-4">
                                        <strong className="text-purple-700 block">Total Receipts</strong>
                                        {reportData.stats.receipts_count + (reportData.stats.cancel_receipt_count || 0)}
                                    </td>
                                    <td className="py-2 px-4 text-red-600">
                                        <strong className="block">Cancelled</strong>
                                        {reportData.stats.cancel_receipt_count || 0}
                                    </td>
                                    <td className="py-2 px-4 text-emerald-600">
                                        <strong className="block">Active</strong>
                                        {reportData.stats.receipts_count}
                                    </td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 px-4">
                                        <strong className="text-purple-700 block">Actual Amount</strong>
                                        {formatCurrency(reportData.stats.actual_amount)}
                                    </td>
                                    <td className="py-2 px-4 text-red-600">
                                        <strong className="block">Canceled Amount</strong>
                                        {formatCurrency(reportData.stats.total_canceled)}
                                    </td>
                                    <td className="py-2 px-4 text-emerald-600">
                                        <strong className="block">Net Amount</strong>
                                        {formatCurrency(reportData.stats.net_amount)}
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan={3} className="py-2 text-xs text-gray-500">
                                        (Actual - Canceled) = Net → ({formatCurrency(reportData.stats.actual_amount)} - {formatCurrency(reportData.stats.total_canceled)}) = <strong className="text-emerald-600">{formatCurrency(reportData.stats.net_amount)}</strong>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Data Card */}
            {/* Data Card with Receipts-like Layout */}
            <Card>
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle>Sales List</CardTitle>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">
                                <Copy className="h-4 w-4 mr-1" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportExcel} title="Export to Excel">
                                <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportPDF} title="Export to PDF" disabled>
                                <FileText className="h-4 w-4 mr-1" /> PDF
                            </Button>
                        </div>

                        {/* Search and Rows */}
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="h-8 w-48"
                            />
                            <Label htmlFor="pageSize" className="text-sm whitespace-nowrap">Rows:</Label>
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
                    <div className="border rounded-md overflow-hidden grid">
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-max w-full text-xs text-left">
                                <TableHeader className="bg-gray-100 text-gray-700 uppercase font-semibold">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Receipt #</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Amount</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Paid On</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Agent</TableHead>
                                        <TableHead className="min-w-[150px] px-2 py-2">Project</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Plot</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Property</TableHead>
                                        <TableHead className="min-w-[150px] px-2 py-2">Customer</TableHead>
                                        <TableHead className="min-w-[150px] px-2 py-2">Contact</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Purpose</TableHead>
                                        <TableHead className="min-w-[150px] px-2 py-2">Details</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Payment</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {currentItems.length > 0 ? (
                                        currentItems.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-gray-50/50">
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.receipt_number}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap px-2 py-2">{formatCurrency(item.paid_amount)}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.paidon ? format(new Date(item.paidon), 'dd-MM-yyyy') : '-'}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.agent_code}</TableCell>
                                                <TableCell className="px-2 py-2 truncate max-w-[200px]" title={item.project_name}>{item.project_name}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.plot_no}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.property_code}</TableCell>
                                                <TableCell className="px-2 py-2 truncate max-w-[200px]" title={item.customer_name}>{item.customer_name}</TableCell>
                                                <TableCell className="text-xs px-2 py-2">
                                                    {[item.cphone, item.cmobile, item.caltmobile].filter(Boolean).join(', ')}
                                                    {item.cwhatsapp && <div><span className="text-green-600">WA:</span> {item.cwhatsapp}</div>}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.purpose}</TableCell>
                                                <TableCell className="truncate max-w-[200px] px-2 py-2" title={item.details}>{item.details}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.payment_method}</TableCell>
                                                <TableCell className="whitespace-nowrap px-2 py-2">{item.created}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={13} className="text-center py-6 text-gray-500">
                                                No Results Found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
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
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default SalesReport;
