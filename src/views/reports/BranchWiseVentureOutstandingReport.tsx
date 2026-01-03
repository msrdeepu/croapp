import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Loader2, Check, ChevronsUpDown, Building2 } from 'lucide-react';
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

interface Branch {
    id: number;
    code: string;
    location: string;
}

interface VentureStat {
    id: number;
    title: string;
    location?: string;
    booked_count: number;
    agreement_count: number;
    outstanding_booked_sum: number;
    outstanding_agreement_sum: number;
}

interface ReportData {
    branch: Branch;
    ventures: VentureStat[];
    last_updated?: string;
}

interface APIResponse {
    branches: Branch[];
    report_data: ReportData | null;
}

const BranchWiseVentureOutstandingReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Filter states
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    // Combobox states
    const [openBranchSelect, setOpenBranchSelect] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');

    // Filtered lists for manual limiting
    const filteredBranches = useMemo(() => {
        if (!branches) return [];
        let result = branches;
        if (branchSearch) {
            const lower = branchSearch.toLowerCase();
            result = branches.filter(b =>
                (b.code || '').toLowerCase().includes(lower) ||
                (b.location || '').toLowerCase().includes(lower)
            );
        }
        return result.slice(0, 50);
    }, [branches, branchSearch]);

    const fetchFilters = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/branch-property-status`, {
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
                        setBranches(data.branches);
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching filters:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        if (!selectedBranchId) return;

        setLoading(true);
        try {
            const query = new URLSearchParams({
                'filter[branch_id]': selectedBranchId,
            });

            const response = await fetch(`${API_BASE_URL}/branch-property-status?${query}`, {
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
                        setReportData(data.report_data);
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
        if (token) {
            fetchFilters();
        }
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg font-semibold text-gray-800">Branch wise Venture Outstanding Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 flex flex-col md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Select Branch</label>
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
                                                ? branches.find((b) => b.id.toString() === selectedBranchId)?.code
                                                    ? `#${branches.find((b) => b.id.toString() === selectedBranchId)?.code} - ${branches.find((b) => b.id.toString() === selectedBranchId)?.location}`
                                                    : "Select Branch"
                                                : "Select Branch"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
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
                                                        #{b.code} - {b.location}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Submit
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {!reportData && !loading && (
                <div className="alert alert-warning mt-3 font-semibold text-amber-700 bg-amber-50 p-4 rounded-md border border-amber-200">
                    Please select a branch to view the report.
                </div>
            )}

            {reportData && (
                <>
                    <div className="flex justify-center mb-6">
                        <Card className="bg-cyan-600 text-white border-0 shadow-md w-full max-w-lg text-center">
                            <CardContent className="py-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white mb-3">
                                    <Building2 className="text-cyan-600 w-7 h-7" />
                                </div>
                                <h5 className="text-xl font-medium">
                                    Branch: <span className="font-semibold">{reportData.branch.code}</span> — {reportData.branch.location}
                                </h5>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-0 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-800 text-white font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Venture</th>
                                        <th className="px-6 py-3 text-right">Booked</th>
                                        <th className="px-6 py-3 text-right">Booked Outstanding (₹)</th>
                                        <th className="px-6 py-3 text-right">Agreement</th>
                                        <th className="px-6 py-3 text-right">Agreement Outstanding (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reportData.ventures.length > 0 ? (
                                        reportData.ventures.map((v) => (
                                            <tr key={v.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-3">
                                                    <div className="font-medium text-cyan-700">{v.title}</div>
                                                    {v.location && <div className="text-amber-600 text-xs mt-0.5">— {v.location}</div>}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-700">
                                                    {v.booked_count}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-red-600">
                                                    {formatCurrency(v.outstanding_booked_sum)}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-gray-700">
                                                    {v.agreement_count}
                                                </td>
                                                <td className="px-6 py-3 text-right font-medium text-red-600">
                                                    {formatCurrency(v.outstanding_agreement_sum)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No ventures found under this branch.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default BranchWiseVentureOutstandingReport;
