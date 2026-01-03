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
// Removed unused Select imports for branch selection
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'src/components/ui/select';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { ArrowUpDown, Copy, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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


interface Venture {
    id: number;
    location: string;
    code: string;
    title: string;
}

interface Receipt {
    id: number;
    branch_id: number;
    receipt_number: string;
    project_name: string;
    plot_no: string;
    property_code: string;
    whatsapp: string;
    customer_name: string;
    customer?: { whatsapp?: string };
    agent_code: string;
    purpose: string;
    paid_amount: string;
    payment_method: string;
    paidon: string;
    status: string;
    created_at: string;
}

const SortIcon = ({ column, sortConfig }: { column: keyof Receipt; sortConfig: { key: keyof Receipt; direction: 'asc' | 'desc' } | null }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />;
    return <ArrowUpDown className={`ml-2 h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-black' : 'text-gray-600'}`} />;
};

const SortableHeader = ({
    label,
    sortKey,
    align = 'left',
    sortConfig,
    onSort
}: {
    label: string,
    sortKey?: keyof Receipt,
    align?: string,
    sortConfig: { key: keyof Receipt; direction: 'asc' | 'desc' } | null,
    onSort: (key: keyof Receipt) => void
}) => (
    <th
        className={`px-2 py-2 border-b whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors ${align === 'right' ? 'text-right' : ''}`}
        onClick={() => sortKey && onSort(sortKey)}
    >
        <div className={`flex items-center ${align === 'right' ? 'justify-end' : ''}`}>
            {label}
            {sortKey && <SortIcon column={sortKey} sortConfig={sortConfig} />}
        </div>
    </th>
);

const FilterInput = ({
    column,
    filters,
    onFilterChange
}: {
    column: keyof Receipt,
    filters: Partial<Record<keyof Receipt, string>>,
    onFilterChange: (key: keyof Receipt, value: string) => void
}) => (
    <th className="px-2 py-1 border-b">
        <input
            type="text"
            className="w-full text-[10px] px-1 py-0.5 border rounded focus:outline-none focus:border-blue-500"
            placeholder={`Search...`}
            value={filters[column] || ''}
            onChange={(e) => onFilterChange(column, e.target.value)}
            onClick={(e) => e.stopPropagation()}
        />
    </th>
);

const Receipts = () => {
    const { token } = useAuth();
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [selectedVenture, setSelectedVenture] = useState<string>('');
    const [receipts, setReceipts] = useState<Receipt[]>([]);

    // Pagination & Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    // Venture Search State
    const [openVentureSelect, setOpenVentureSelect] = useState(false);

    // Parsed Branch Info for Display
    const [currentBranch, setCurrentBranch] = useState<{ id: number, location: string } | null>(null);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Receipt; direction: 'asc' | 'desc' } | null>(null);


    const [fetchingReceipts, setFetchingReceipts] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const fetchReceiptsData = async () => {
            try {
                const response = await fetch(ENDPOINTS.RECEIPTS_SELECT, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
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
                    if (actualData?.status && actualData?.data) {
                        setVentures(actualData.data.ventures || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching receipts data:', error);
            } finally {

            }
        };

        if (token) fetchReceiptsData();
    }, [token]);

    const handleGetReceipts = async () => {
        if (!selectedVenture) return;

        setFetchingReceipts(true);
        setHasSearched(true);
        setReceipts([]);
        setCurrentPage(1);

        try {
            const response = await fetch(`${ENDPOINTS.RECEIPTS_VENTURES}?venture_id=${selectedVenture}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        const fixedText = text.trim().substring(2);
                        try { result = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                    } else {
                        console.error('Error parsing JSON:', e);
                    }
                }

                const actualData = Array.isArray(result) ? result[0] : result;

                if (actualData && actualData.status && actualData.data) {
                    const receiptsData = actualData.data.receipts || actualData.data.venture_receipts || [];
                    setReceipts(receiptsData);

                    if (actualData.data.branch) {
                        setCurrentBranch(actualData.data.branch);
                    }
                }
            } else {
                console.error('Failed to fetch receipts');
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setFetchingReceipts(false);
        }
    };

    const calculateDaysAgo = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days ago`;
    };



    const handleSort = (key: keyof Receipt) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Column Filters State
    const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof Receipt, string>>>({});

    const handleColumnFilterChange = (key: keyof Receipt, value: string) => {
        setColumnFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    // Filter Logic
    const filteredReceipts = receipts.filter(receipt => {
        // Global Search
        let matchesGlobal = true;
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            matchesGlobal = (
                receipt.receipt_number?.toLowerCase().includes(lowerTerm) ||
                receipt.customer_name?.toLowerCase().includes(lowerTerm) ||
                receipt.plot_no?.toLowerCase().includes(lowerTerm) ||
                receipt.project_name?.toLowerCase().includes(lowerTerm) ||
                receipt.id.toString().includes(lowerTerm)
            );
        }

        // Column Search
        const matchesColumns = Object.entries(columnFilters).every(([key, value]) => {
            if (!value) return true;
            let itemValue = '';
            if (key === 'branch_id') {
                itemValue = String(currentBranch && currentBranch.id === receipt.branch_id ? currentBranch.location : receipt.branch_id);
            } else if (key === 'whatsapp') {
                itemValue = receipt.whatsapp || receipt.customer?.whatsapp || '';
            } else {
                itemValue = String(receipt[key as keyof Receipt] || '');
            }
            return itemValue.toLowerCase().includes(value.toLowerCase());
        });

        return matchesGlobal && matchesColumns;
    });

    // Sorting Logic
    const sortedReceipts = [...filteredReceipts].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const aValue = a[key];
        const bValue = b[key];

        if (aValue === bValue) return 0;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aString = String(aValue || '').toLowerCase();
        const bString = String(bValue || '').toLowerCase();

        if (aString < bString) return direction === 'asc' ? -1 : 1;
        if (aString > bString) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * pageSize;
    const indexOfFirstItem = indexOfLastItem - pageSize;
    const currentReceipts = sortedReceipts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedReceipts.length / pageSize);

    // Export Handlers
    const handleCopy = () => {
        const headers = [
            'ID', 'Receipt No#', 'Branch', 'Venture', 'Plot', 'Property',
            'Customer', 'Whatsapp', 'Agent Code', 'Purpose', 'Amount',
            'Payment', 'Paid On', 'Days Count'
        ];

        const csvContent = [
            headers.join('\t'),
            ...sortedReceipts.map(r => [
                r.id,
                r.receipt_number,
                currentBranch && currentBranch.id === r.branch_id ? currentBranch.location : r.branch_id,
                r.project_name,
                r.plot_no,
                r.property_code,
                r.customer_name,
                r.whatsapp || r.customer?.whatsapp || 'N/A',
                r.agent_code,
                r.purpose,
                r.paid_amount,
                r.payment_method,
                new Date(r.paidon).toLocaleDateString(),
                calculateDaysAgo(r.paidon)
            ].join('\t'))
        ].join('\n');

        navigator.clipboard.writeText(csvContent);
        // Toast can be added here
        alert('Data copied to clipboard');
    };

    const handleExportExcel = () => {
        const data = sortedReceipts.map(r => ({
            'ID': r.id,
            'Receipt No#': r.receipt_number,
            'Branch': currentBranch && currentBranch.id === r.branch_id ? currentBranch.location : r.branch_id,
            'Venture': r.project_name,
            'Plot': r.plot_no,
            'Property': r.property_code,
            'Customer': r.customer_name,
            'Whatsapp': r.whatsapp || r.customer?.whatsapp || 'N/A',
            'Agent Code': r.agent_code,
            'Purpose': r.purpose,
            'Amount': parseFloat(r.paid_amount),
            'Payment': r.payment_method,
            'Paid On': new Date(r.paidon).toLocaleDateString(),
            'Days Count': calculateDaysAgo(r.paidon)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Receipts");
        XLSX.writeFile(wb, "receipts_export.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.text("Receipts List", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = [
            'ID', 'Receipt No', 'Branch', 'Venture', 'Plot', 'Customer',
            'Purpose', 'Amount', 'Paid On'
        ];

        const tableRows = sortedReceipts.map(r => [
            r.id,
            r.receipt_number,
            currentBranch && currentBranch.id === r.branch_id ? currentBranch.location : r.branch_id,
            r.project_name,
            r.plot_no,
            r.customer_name,
            r.purpose,
            parseFloat(r.paid_amount).toLocaleString('en-IN'),
            new Date(r.paidon).toLocaleDateString(),
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

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-ld">Receipts</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Receipts Report Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-6">
                        <div className="w-1/2">
                            <Label htmlFor="venture" className="mb-2 block">Select Venture</Label>
                            <Popover open={openVentureSelect} onOpenChange={setOpenVentureSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openVentureSelect}
                                        className="w-full justify-between"
                                    >
                                        {selectedVenture
                                            ? ventures.find((venture) => venture.id.toString() === selectedVenture)?.title
                                            : "Select venture..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search venture..." />
                                        <CommandList>
                                            <CommandEmpty>No venture found.</CommandEmpty>
                                            <CommandGroup>
                                                {ventures.map((venture) => (
                                                    <CommandItem
                                                        key={venture.id}
                                                        value={`${venture.code} ${venture.title} ${venture.location}`}
                                                        onSelect={() => {
                                                            setSelectedVenture(venture.id.toString() === selectedVenture ? "" : venture.id.toString());
                                                            setOpenVentureSelect(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedVenture === venture.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {venture.code} - {venture.title} ({venture.location})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button onClick={handleGetReceipts} disabled={!selectedVenture} className="mb-0.5">
                            Get Receipts
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {hasSearched && (
                <Card className="mt-6">
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle>Receipts List</CardTitle>

                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            {/* Actions */}
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
                            </div>

                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Search receipts..."
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
                        {fetchingReceipts ? (
                            <div className="text-center py-4">Loading receipts...</div>
                        ) : receipts.length > 0 ? (
                            <div className="space-y-4 w-full">
                                <div className="border rounded-md overflow-hidden grid">
                                    <div className="overflow-x-auto w-full max-w-[85vw] md:max-w-[calc(100vw-260px)]">
                                        <table className="min-w-max w-full text-xs text-left">
                                            <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                                                <tr>
                                                    <SortableHeader
                                                        label="ID"
                                                        sortKey="id"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Receipt No#"
                                                        sortKey="receipt_number"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Branch"
                                                        sortKey="branch_id"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Venture"
                                                        sortKey="project_name"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Plot"
                                                        sortKey="plot_no"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Property"
                                                        sortKey="property_code"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Customer"
                                                        sortKey="customer_name"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Whatsapp"
                                                        sortKey="whatsapp"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Agent Code"
                                                        sortKey="agent_code"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Purpose"
                                                        sortKey="purpose"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Amount"
                                                        sortKey="paid_amount"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Payment"
                                                        sortKey="payment_method"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Paid On"
                                                        sortKey="paidon"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                    <SortableHeader
                                                        label="Days Count"
                                                        align="right"
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                    />
                                                </tr>
                                                {/* Filter Row */}
                                                <tr className="bg-gray-50 border-b">
                                                    <FilterInput column="id" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="receipt_number" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="branch_id" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="project_name" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="plot_no" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="property_code" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="customer_name" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="whatsapp" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="agent_code" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="purpose" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="paid_amount" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="payment_method" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <FilterInput column="paidon" filters={columnFilters} onFilterChange={handleColumnFilterChange} />
                                                    <th className="px-2 py-1 border-b"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {currentReceipts.map((receipt) => (
                                                    <tr key={receipt.id} className="hover:bg-gray-50/50">
                                                        <td className="px-2 py-2 font-medium whitespace-nowrap">{receipt.id}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{receipt.receipt_number}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{currentBranch && currentBranch.id === receipt.branch_id ? currentBranch.location : receipt.branch_id}</td>
                                                        <td className="px-2 py-2 max-w-[150px] truncate" title={receipt.project_name}>{receipt.project_name}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{receipt.plot_no}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{receipt.property_code}</td>
                                                        <td className="px-2 py-2 max-w-[150px] truncate" title={receipt.customer_name}>{receipt.customer_name}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">
                                                            {receipt.whatsapp || receipt.customer?.whatsapp || 'N/A'}
                                                        </td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{receipt.agent_code}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${receipt.purpose === 'Plot Booking' ? 'bg-blue-100 text-blue-700' :
                                                                receipt.purpose === 'Renewal' ? 'bg-green-100 text-green-700' :
                                                                    receipt.purpose === 'Document Value' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {receipt.purpose}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-2 font-semibold whitespace-nowrap">
                                                            {parseFloat(receipt.paid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-2 py-2 whitespace-nowrap">{receipt.payment_method}</td>
                                                        <td className="px-2 py-2 whitespace-nowrap">
                                                            {new Date(receipt.paidon).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-2 py-2 text-right whitespace-nowrap">
                                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">
                                                                {calculateDaysAgo(receipt.paidon)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination Controls */}
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
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No receipts found for this branch.
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default Receipts;
