import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Loader2, Check, ChevronsUpDown, Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { cn } from 'src/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

interface Branch {
    id: number;
    code: string;
    location: string;
}

interface Cadre {
    cadre_code: string;
    cadre_title: string;
}

interface AgentData {
    id: number;
    cc: string;
    created_at: string;
    joined_on: string;
    branch: string;
    name: string;
    mobile: string;
    cash_advance: number;
    agent_code: string;
    introducer_code: string;
    registration_fee_paid: number;
    aadhar: string;
}

interface SummaryData {
    total_agents: number;
    apms: number;
    pms: number;
    spms: number;
    dos: number;
    sdos: number;
    mds: number;
}

interface APIResponse {
    filters: {
        branches: Branch[];
        caders: Cadre[];
    };
    data: AgentData[];
    summary: SummaryData;
}

const RecentAgentsReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Data States
    const [branches, setBranches] = useState<Branch[]>([]);
    const [caders, setCaders] = useState<Cadre[]>([]);
    const [agents, setAgents] = useState<AgentData[]>([]);
    const [summary, setSummary] = useState<SummaryData | null>(null);

    // Filter States
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedCc, setSelectedCc] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Combobox States
    const [openBranchSelect, setOpenBranchSelect] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Logic
    const filteredAgents = useMemo(() => {
        if (!agents) return [];
        let result = agents;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(agent =>
                agent.name.toLowerCase().includes(lowerTerm) ||
                agent.agent_code.toLowerCase().includes(lowerTerm) ||
                agent.branch.toLowerCase().includes(lowerTerm) ||
                agent.mobile.toLowerCase().includes(lowerTerm) ||
                agent.aadhar.toLowerCase().includes(lowerTerm)
            );
        }
        return result;
    }, [agents, searchTerm]);

    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentAgents = filteredAgents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAgents.length / pageSize);

    // Export Handlers
    const handleCopy = () => {
        if (!filteredAgents.length) return;
        const headers = ['ID', 'Code', 'Name', 'Cadre', 'Created', 'Joined', 'Branch', 'Advance', 'Introducer', 'Reg Fee Paid', 'Mobile', 'Aadhar'];
        const csvContent = [
            headers.join('\t'),
            ...filteredAgents.map(a => [
                a.id,
                a.agent_code,
                a.name,
                a.cc,
                formatDate(a.created_at),
                formatDate(a.joined_on),
                a.branch,
                a.cash_advance,
                a.introducer_code,
                a.registration_fee_paid > 0 ? 'YES' : 'NO',
                a.mobile,
                a.aadhar
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        // alert('Data copied to clipboard'); // Removed alert as per refined UI preference
    };

    const handleExportExcel = () => {
        if (!filteredAgents.length) return;
        const data = filteredAgents.map(a => ({
            'ID': a.id,
            'Agent Code': a.agent_code,
            'Name': a.name,
            'Cadre': a.cc,
            'Created': formatDate(a.created_at),
            'Joined': formatDate(a.joined_on),
            'Branch': a.branch,
            'Advance': a.cash_advance,
            'Introducer': a.introducer_code,
            'Reg Fee Paid': a.registration_fee_paid > 0 ? 'YES' : 'NO',
            'Mobile': a.mobile,
            'Aadhar': a.aadhar
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Agents");
        XLSX.writeFile(wb, "recent_agents_export.xlsx");
    };

    const handleExportPDF = () => {
        if (!filteredAgents.length) return;
        const doc = new jsPDF();
        doc.text("Recent Agents Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = ['Code', 'Name', 'Cadre', 'Joined', 'Branch', 'Mobile', 'Aadhar'];
        const tableRows = filteredAgents.map(a => [
            a.agent_code,
            a.name,
            a.cc,
            formatDate(a.joined_on),
            a.branch,
            a.mobile,
            a.aadhar
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 25,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("recent_agents_export.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    // Initialization
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/recent-agents-report`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                const text = await response.text();
                // Clean response in case of prefix garbage
                const jsonStart = text.indexOf('{');
                if (jsonStart !== -1) {
                    const cleanText = text.substring(jsonStart);
                    try {
                        const data: APIResponse = JSON.parse(cleanText);
                        setBranches(data.filters?.branches || []);
                        setCaders(data.filters?.caders || []);
                        setAgents(data.data || []);
                        // Note: Initial load limits to 300, summary might be empty
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredReport = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams();
            if (selectedBranchId) query.append('filter[branch_id]', selectedBranchId);
            if (selectedCc) query.append('filter[cc]', selectedCc);
            if (startDate) query.append('filter[starts_on]', format(startDate, 'yyyy-MM-dd'));
            if (endDate) query.append('filter[ends_on]', format(endDate, 'yyyy-MM-dd'));

            const response = await fetch(`${API_BASE_URL}/recent-agents-report?${query.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const text = await response.text();
                const jsonStart = text.indexOf('{');
                if (jsonStart !== -1) {
                    const cleanText = text.substring(jsonStart);
                    try {
                        const data: APIResponse = JSON.parse(cleanText);
                        setAgents(data.data || []);
                        setSummary(data.summary || null);
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchInitialData();
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFilteredReport();
    };

    // Filtered branches for combobox
    const filteredBranches = useMemo(() => {
        if (!branches) return [];
        let result = branches;
        if (branchSearch) {
            const lower = branchSearch.toLowerCase();
            result = branches.filter(b =>
                b.location.toLowerCase().includes(lower) ||
                b.code.toLowerCase().includes(lower)
            );
        }
        return result.slice(0, 50);
    }, [branches, branchSearch]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    // Find selected branch object for display
    const currentBranch = branches.find(b => b.id.toString() === selectedBranchId);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Recent Agents Report</h2>
            <Card className="shadow-sm mb-6">
                <CardHeader className="pb-2">
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                        {/* Branch Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Branch</label>
                            <Popover open={openBranchSelect} onOpenChange={setOpenBranchSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openBranchSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedBranchId
                                                ? currentBranch
                                                    ? `${currentBranch.code} - ${currentBranch.location}`
                                                    : "Select Branch"
                                                : "Select Branch"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search branch..."
                                            value={branchSearch}
                                            onValueChange={setBranchSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No branch found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredBranches.map((b) => (
                                                    <CommandItem
                                                        key={b.id}
                                                        value={b.id.toString()}
                                                        onSelect={() => {
                                                            setSelectedBranchId(b.id.toString() === selectedBranchId ? "" : b.id.toString());
                                                            setOpenBranchSelect(false);
                                                            setBranchSearch('');
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedBranchId === b.id.toString() ? "opacity-100" : "opacity-0"
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

                        {/* Cadre Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cadre</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedCc}
                                onChange={(e) => setSelectedCc(e.target.value)}
                            >
                                <option value="">-- Select Cadre --</option>
                                {caders.map((c, i) => (
                                    <option key={`${c.cadre_code}-${i}`} value={c.cadre_code}>
                                        {c.cadre_title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
                            <DatePicker date={startDate} setDate={setStartDate} />
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                            <DatePicker date={endDate} setDate={setEndDate} />
                        </div>

                        <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Summary Section */}
            {summary && currentBranch && (
                <Card className="border-l-4 border-l-cyan-600 shadow-sm mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-800 text-lg">Branch: {currentBranch.code} | {currentBranch.location}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center w-full md:w-auto">
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Total Agents</div>
                                    <div className="text-lg font-bold text-blue-700">{summary.total_agents}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">APMs</div>
                                    <div className="font-bold text-gray-800">{summary.apms}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">PMs</div>
                                    <div className="font-bold text-gray-800">{summary.pms}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">SPMs</div>
                                    <div className="font-bold text-gray-800">{summary.spms}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">DOs</div>
                                    <div className="font-bold text-gray-800">{summary.dos}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">SDOs</div>
                                    <div className="font-bold text-gray-800">{summary.sdos}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                    <div className="text-xs text-gray-500 uppercase font-semibold">MDs</div>
                                    <div className="font-bold text-gray-800">{summary.mds}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm w-full max-w-full">
                <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2">
                    <CardTitle>Agents List ({filteredAgents.length})</CardTitle>
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
                    <div className="border rounded-md overflow-hidden grid">
                        <div className="overflow-x-auto w-full">
                            <Table className="min-w-max w-full text-xs text-left">
                                <TableHeader className="bg-gray-100 text-gray-700 uppercase font-semibold">
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap px-2 py-2">#</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Agent Code</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Name</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Cadre</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Created</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Joined</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Branch</TableHead>
                                        <TableHead className="text-right whitespace-nowrap px-2 py-2">Advance</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Introducer</TableHead>
                                        <TableHead className="text-center whitespace-nowrap px-2 py-2">Reg Fee</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Mobile</TableHead>
                                        <TableHead className="whitespace-nowrap px-2 py-2">Aadhar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {currentAgents.length > 0 ? (
                                        currentAgents.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-gray-50/50">
                                                <TableCell className="font-medium text-gray-900 border-r px-2 py-2 whitespace-nowrap">{item.id}</TableCell>
                                                <TableCell className="font-medium text-cyan-600 border-r px-2 py-2 whitespace-nowrap">{item.agent_code}</TableCell>
                                                <TableCell className="font-medium text-gray-800 border-r px-2 py-2 whitespace-nowrap">{item.name}</TableCell>
                                                <TableCell className="text-center border-r px-2 py-2 whitespace-nowrap">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                        {item.cc}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="border-r px-2 py-2 whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
                                                <TableCell className="border-r px-2 py-2 whitespace-nowrap">{formatDate(item.joined_on)}</TableCell>
                                                <TableCell className="border-r px-2 py-2 whitespace-nowrap">{item.branch}</TableCell>
                                                <TableCell className="text-right border-r font-mono px-2 py-2 whitespace-nowrap">{item.cash_advance > 0 ? formatCurrency(item.cash_advance) : '-'}</TableCell>
                                                <TableCell className="border-r px-2 py-2 whitespace-nowrap">{item.introducer_code}</TableCell>
                                                <TableCell className="text-center border-r px-2 py-2 whitespace-nowrap">
                                                    {item.registration_fee_paid > 0 ? (
                                                        <span className="text-green-600 font-bold text-xs"><Check className="w-4 h-4 inline" /> YES</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold text-xs">NO</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="border-r px-2 py-2 whitespace-nowrap">{item.mobile}</TableCell>
                                                <TableCell className="px-2 py-2 whitespace-nowrap">{item.aadhar}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={12} className="h-24 text-center text-gray-500">
                                                No agents found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {filteredAgents.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAgents.length)} of {filteredAgents.length} entries
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
    );
};

export default RecentAgentsReport;
