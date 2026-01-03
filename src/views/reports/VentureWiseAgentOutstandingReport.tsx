import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';

import { Loader2, User, Phone, Check, ChevronsUpDown } from 'lucide-react';
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

interface Profile {
    id: number;
    agent_code: string;
    fullname: string;
    surname: string;
    cc: string;
}

interface Venture {
    id: number;
    code: string;
    title: string;
    location?: string;
}

interface Property {
    id: number;
    code: string;
    title: string;
    status: string;
    outstanding: number;
    paid: number;
    customer?: {
        id: number;
        code: string;
        fullname: string;
        surname: string;
        phone?: string;
        mobile?: string;
    };
}

interface ReportData {
    agent: Profile;
    venture: Venture;
    properties: Property[];
    totals: {
        outstanding: number;
        paid: number;
    };
    filters: {
        duration_months: number;
        window: [string, string];
    };
    last_updated?: string;
}

interface APIResponse {
    profiles: Profile[];
    ventures: Venture[];
    report_data: ReportData | null;
}

const VentureWiseAgentOutstandingReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [ventures, setVentures] = useState<Venture[]>([]);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Filter states
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [selectedVentureId, setSelectedVentureId] = useState<string>('');
    const [selectedDuration, setSelectedDuration] = useState<string>('');

    // Combobox states
    const [openAgentSelect, setOpenAgentSelect] = useState(false);
    const [openVentureSelect, setOpenVentureSelect] = useState(false);
    const [openDurationSelect, setOpenDurationSelect] = useState(false);
    const [agentSearch, setAgentSearch] = useState('');
    const [ventureSearch, setVentureSearch] = useState('');

    const durationOptions = [
        { value: "3", label: "3 Months" },
        { value: "6", label: "6 Months" },
        { value: "12", label: "12 Months" }
    ];


    // Filtered lists for manual limiting (Performance Optimization)
    const filteredAgents = useMemo(() => {
        if (!profiles) return [];
        let result = profiles;
        if (agentSearch) {
            const lower = agentSearch.toLowerCase();
            result = profiles.filter(p =>
                (p.fullname || '').toLowerCase().includes(lower) ||
                (p.surname || '').toLowerCase().includes(lower) ||
                String(p.agent_code || '').toLowerCase().includes(lower)
            );
        }
        return result.slice(0, 50); // Limit to top 50 to prevent freezing
    }, [profiles, agentSearch]);

    const filteredVentures = useMemo(() => {
        if (!ventures) return [];
        let result = ventures;
        if (ventureSearch) {
            const lower = ventureSearch.toLowerCase();
            result = ventures.filter(v =>
                (v.title || '').toLowerCase().includes(lower) ||
                String(v.code || '').toLowerCase().includes(lower)
            );
        }
        // Also limit ventures just in case, though usually list is smaller
        return result.slice(0, 50);
    }, [ventures, ventureSearch]);



    const fetchFilters = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/agent-property-overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                const text = await response.text();
                // Handle mixed content/garbage responses by finding the first JSON object
                const jsonStart = text.indexOf('{');
                if (jsonStart !== -1) {
                    const cleanText = text.substring(jsonStart);
                    try {
                        const data: APIResponse = JSON.parse(cleanText);
                        setProfiles(data.profiles);
                        setVentures(data.ventures);
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                } else {
                    console.error("No JSON object found in response", text);
                }
            }
        } catch (error) {
            console.error("Error fetching filters:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        if (!selectedProfileId || !selectedVentureId || !selectedDuration) return;

        setLoading(true);
        try {
            const query = new URLSearchParams({
                'filter[profile_id]': selectedProfileId,
                'filter[venture_id]': selectedVentureId,
                'filter[duration]': selectedDuration,
            });

            const response = await fetch(`${API_BASE_URL}/agent-property-overview?${query}`, {
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
                    <CardTitle className="text-lg font-semibold text-gray-800">Agent wise Venture Outstanding Report</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Select Agent</label>
                            {/* Replaced Select with Popover+Command for searchability & partial virtualization via limiting */}
                            <Popover open={openAgentSelect} onOpenChange={setOpenAgentSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openAgentSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedProfileId
                                                ? profiles.find((p) => p.id.toString() === selectedProfileId)?.fullname
                                                    ? `#${profiles.find((p) => p.id.toString() === selectedProfileId)?.agent_code} - ${profiles.find((p) => p.id.toString() === selectedProfileId)?.fullname}`
                                                    : "Select Agent"
                                                : "Select Agent"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search agent..."
                                            value={agentSearch}
                                            onValueChange={setAgentSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No agent found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredAgents.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={p.id.toString()}
                                                        onSelect={() => {
                                                            setSelectedProfileId(p.id.toString() === selectedProfileId ? "" : p.id.toString());
                                                            setOpenAgentSelect(false);
                                                            setAgentSearch('');
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedProfileId === p.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        #{p.agent_code} - {p.fullname} {p.surname}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Select Venture</label>
                            {/* Replaced Select with Popover+Command */}
                            <Popover open={openVentureSelect} onOpenChange={setOpenVentureSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openVentureSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedVentureId
                                                ? ventures.find((v) => v.id.toString() === selectedVentureId)?.title
                                                    ? `#${ventures.find((v) => v.id.toString() === selectedVentureId)?.code} - ${ventures.find((v) => v.id.toString() === selectedVentureId)?.title}`
                                                    : "Select Venture"
                                                : "Select Venture"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search venture..."
                                            value={ventureSearch}
                                            onValueChange={setVentureSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No venture found.</CommandEmpty>
                                            <CommandGroup>
                                                {filteredVentures.map((v) => (
                                                    <CommandItem
                                                        key={v.id}
                                                        value={v.id.toString()}
                                                        onSelect={() => {
                                                            setSelectedVentureId(v.id.toString() === selectedVentureId ? "" : v.id.toString());
                                                            setOpenVentureSelect(false);
                                                            setVentureSearch('');
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedVentureId === v.id.toString() ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        #{v.code} - {v.title}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Select Duration</label>
                            <Popover open={openDurationSelect} onOpenChange={setOpenDurationSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openDurationSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedDuration
                                                ? durationOptions.find((d) => d.value === selectedDuration)?.label
                                                : "Select Duration"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search duration..." />
                                        <CommandList>
                                            <CommandEmpty>No duration found.</CommandEmpty>
                                            <CommandGroup>
                                                {durationOptions.map((d) => (
                                                    <CommandItem
                                                        key={d.value}
                                                        value={d.label}
                                                        onSelect={() => {
                                                            setSelectedDuration(d.value === selectedDuration ? "" : d.value);
                                                            setOpenDurationSelect(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedDuration === d.value ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {d.label}
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
                    Please select a Agent, Venture and Duration to view the report.
                </div>
            )}

            {reportData && (
                <Card className="border-0 shadow-sm mt-6">
                    <CardHeader className="bg-cyan-50 border-b border-cyan-100 p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md">
                                <strong>Venture:</strong> {reportData.venture.title} {reportData.venture.location}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="bg-cyan-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                                    <User size={16} />
                                    #{reportData.agent.agent_code} {reportData.agent.fullname} {reportData.agent.surname}
                                </span>
                                {reportData.filters && (
                                    <small className="text-gray-500 mt-1">
                                        Duration: {reportData.filters.duration_months} months
                                        {reportData.filters.window && ` | ${reportData.filters.window[0]} → ${reportData.filters.window[1]}`}
                                    </small>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-3">S.No</th>
                                    <th className="px-6 py-3">Property</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3 text-right">Paid (₹)</th>
                                    <th className="px-6 py-3 text-right">Outstanding (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reportData.properties.length > 0 ? (
                                    reportData.properties.map((p, idx) => (
                                        <tr key={p.id} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{idx + 1}</td>
                                            <td className="px-6 py-3 text-indigo-600 font-medium">
                                                Code: {p.code} | {p.title}
                                            </td>
                                            <td className="px-6 py-3">
                                                {p.status.toLowerCase() === 'booked' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Booked
                                                    </span>
                                                ) : (p.status.toLowerCase() === 'on agreement' || p.status.toLowerCase() === 'agreement') ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        On Agreement
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {p.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                {p.customer ? (
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {p.customer.fullname} {p.customer.surname}
                                                        </div>
                                                        {(p.customer.phone || p.customer.mobile) && (
                                                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                                <Phone size={12} className="mr-1" />
                                                                {p.customer.phone || p.customer.mobile}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-green-600">
                                                {formatCurrency(p.paid)}
                                            </td>
                                            <td className="px-6 py-3 text-right font-medium text-red-600">
                                                {formatCurrency(p.outstanding)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No properties found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {reportData.properties.length > 0 && (
                                <tfoot className="bg-gray-50 border-t font-semibold">
                                    <tr>
                                        <td colSpan={4} className="px-6 py-3 text-right text-gray-700">Total Paid (₹)</td>
                                        <td className="px-6 py-3 text-right text-green-700">{formatCurrency(reportData.totals.paid)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="px-6 py-3 text-right text-gray-700">Total Outstanding (₹)</td>
                                        <td className="px-6 py-3 text-right text-red-700">{formatCurrency(reportData.totals.outstanding)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default VentureWiseAgentOutstandingReport;
