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

import { Check, ChevronsUpDown, Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react';
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

import { Switch } from 'src/components/ui/switch';
import { Badge } from 'src/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import { Input } from 'src/components/ui/input';
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
    branch_id?: number;
}

interface Branch {
    id: number;
    code: string;
    location: string;
}

interface AvailableProperty {
    id: number;
    code: string;
    plot_no: string;
    price: string | number;
    agent_block: string | number | null;
}

const AvailablePropertiesReport = () => {
    const { token, user } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);


    const [selectedVenture, setSelectedVenture] = useState<string>('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedBranch, setSelectedBranch] = useState<string>('');


    const [openVentureSelect, setOpenVentureSelect] = useState(false);
    const [openBranchSelect, setOpenBranchSelect] = useState(false);

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<AvailableProperty[] | null>(null);

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

    const handleShowAvailableProperties = async () => {
        if (!selectedVenture) return;
        setLoading(true);
        setReportData(null); // Clear previous data
        try {
            // Updated API call structure based on user request: /properties/available/{id}
            const response = await fetch(`${ENDPOINTS.AVAILABLE_PROPERTIES}/${selectedVenture}`, {
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
                    console.error("JSON Parse Error", e);
                    // Fallback for double-encoded or malformed JSON (common in this app)
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { result = JSON.parse(fixedText); } catch (e2) { console.error("Fallback Parse Error", e2); }
                    }
                }

                // Handle potential array wrapping from backend
                const actualResponse = Array.isArray(result) ? result[0] : result;

                if (actualResponse && actualResponse.status && actualResponse.data) {
                    setReportData(actualResponse.data);
                } else {
                    console.error("API returned status false or no data", actualResponse);
                    setReportData([]);
                }
            } else {
                console.error("API Error", response.status);
            }

        } catch (error) {
            console.error("Error generating report", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePropertyBlock = async (id: number, currentStatus: string | number | null) => {
        // Toggle logic: If 1 (Blocked), switch to 0 (Available), and vice versa
        // Ensure currentStatus is treated as number 
        const numericStatus = Number(currentStatus);
        const newStatus = numericStatus === 1 ? 0 : 1;

        // Optimistic UI Update
        const previousData = reportData;
        setReportData(prevData =>
            prevData ? prevData.map(prop =>
                prop.id === id ? { ...prop, agent_block: newStatus } : prop
            ) : null
        );

        try {
            const response = await fetch(`${ENDPOINTS.PROPERTY_BASE}/${id}/toggle-block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Revert on failure
                console.error("Failed to toggle block status");
                setReportData(previousData);
                showAlert('error', 'Error', "Failed to update status. Please try again.");
            } else {
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    // Fallback for double-encoded or malformed JSON (common in this app)
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { result = JSON.parse(fixedText); } catch (e2) { console.error("Fallback Parse Error", e2); }
                    }
                }

                // Handle potential array wrapping
                const actualResult = Array.isArray(result) ? result[0] : result;

                if (!actualResult || !actualResult.status) {
                    console.error("API returned false status", actualResult);
                    setReportData(previousData);
                    showAlert('error', 'Error', (actualResult && actualResult.message) || "Failed to update status.");
                } else {
                    // Success
                    const statusText = newStatus === 1 ? "Blocked" : "Unblocked";
                    showAlert('success', 'Success', `Property successfully ${statusText}.`);
                }
            }
        } catch (error: any) {
            console.error("Error toggling block status", error);
            setReportData(previousData);
            showAlert('error', 'Error', `An error occurred: ${error.message || error}`);
        }
    };

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Alert State
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => {
            const newAlert = { id, type, title, message };
            // Keep max 3, remove oldest (from start) if exceeded
            const updated = [...prev, newAlert];
            if (updated.length > 3) {
                return updated.slice(updated.length - 3);
            }
            return updated;
        });

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            removeAlert(id);
        }, 3000);
    };

    const removeAlert = (id: number) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    // Filter Logic
    const filteredProperties = reportData?.filter(prop => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();
        return (
            prop.code?.toLowerCase().includes(lowerTerm) ||
            prop.plot_no?.toLowerCase().includes(lowerTerm) ||
            String(prop.price).toLowerCase().includes(lowerTerm) ||
            (prop.agent_block === 0 ? 'available' : prop.agent_block === 1 ? 'blocked' : '').includes(lowerTerm)
        );
    }) || [];

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentProperties = filteredProperties.slice(indexOfFirstItem, indexOfLastItem);



    // Export Handlers
    const handleCopy = () => {
        if (!reportData) return;
        const headers = ['Code', 'Plot No', 'Price', 'Agent Block'];
        const csvContent = [
            headers.join('\t'),
            ...filteredProperties.map(r => [
                r.code,
                r.plot_no,
                r.price,
                r.agent_block || '-'
            ].join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(csvContent);
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        const data = filteredProperties.map(r => ({
            'Code': r.code,
            'Plot No': r.plot_no,
            'Price': r.price,
            'Status': r.agent_block === 0 ? 'Available' : 'Blocked'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AvailableProperties");
        XLSX.writeFile(wb, "available_properties.xlsx");
    };

    const handleExportPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();
        doc.text("Available Properties List", 14, 15);
        doc.setFontSize(10);
        const ventureName = ventures.find(v => v.id.toString() === selectedVenture)?.title;
        doc.text(`Venture: ${ventureName || '-'}`, 14, 22);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        const tableColumn = ['Code', 'Plot No', 'Price', 'Status'];
        const tableRows = filteredProperties.map(r => [
            r.code,
            r.plot_no,
            r.price,
            r.agent_block === 0 ? 'Available' : 'Blocked'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
        });
        doc.save("available_properties.pdf");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Available Properties Report</h2>

            {/* Toast Notification */}
            {/* Toast Notification Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out"
                    >
                        <Alert
                            variant={alert.type}
                            className={cn(
                                "shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10",
                                alert.type === 'success' ? "bg-green-500" : "bg-red-500"
                            )}
                        >
                            {alert.type === 'success'
                                ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" />
                                : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                            }
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">
                                    {alert.message}
                                </AlertDescription>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    </div>
                ))}
            </div>

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

                        {/* Branch Select - Optional/Hidden if not needed for this specific report */}
                        {((user as any)?.user_type === 'admin' || (user as any)?.is_manager) && (
                            <div className="hidden">
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


                        <Button onClick={handleShowAvailableProperties} disabled={loading || !selectedVenture}>
                            {loading ? "Loading..." : "Show Available Properties"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle>Available Properties ({filteredProperties.length})</CardTitle>
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
                                        <TableHead>Code</TableHead>
                                        <TableHead>Plot No</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Block</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentProperties.length > 0 ? (
                                        currentProperties.map((prop) => (
                                            <TableRow key={prop.id}>
                                                <TableCell className="font-medium">{prop.code}</TableCell>
                                                <TableCell>{prop.plot_no}</TableCell>
                                                <TableCell>₹ {prop.price}</TableCell>
                                                <TableCell>
                                                    {prop.agent_block === 0 ? (
                                                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                            Available
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">
                                                            Blocked
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={prop.agent_block === 1}
                                                        onCheckedChange={() => handlePropertyBlock(prop.id, prop.agent_block)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                No results found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {filteredProperties.length > 0 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProperties.length)} of {filteredProperties.length} entries
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
                                        Page {currentPage} of {Math.ceil(filteredProperties.length / pageSize)}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProperties.length / pageSize)))}
                                        disabled={currentPage === Math.ceil(filteredProperties.length / pageSize)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AvailablePropertiesReport;
