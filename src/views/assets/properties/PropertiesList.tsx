import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "src/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { Loader2, MoreHorizontal, Plus, Search, Pencil, Eye } from 'lucide-react';
import { Badge } from 'src/components/ui/badge';

const PropertiesList = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [ventureId, setVentureId] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [ventures, setVentures] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([]); // For client-side pagination
    const [filters, setFilters] = useState({
        code: '',
        venture: '',
        plot_no: '',
        dimensions: '',
        price: '',
        status: ''
    });

    const parseResponse = async (res: Response) => {
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            }
            throw e;
        }
    };

    useEffect(() => {
        // Fetch Ventures for Filter
        fetch(`${API_BASE_URL}/ventures`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => parseResponse(res))
            .then(res => {
                if (res.status || Array.isArray(res.data)) setVentures(res.data || res);
            })
            .catch(err => console.error(err));
    }, [token]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: String(perPage),
                search: search,
                venture_id: ventureId
            });

            const response = await fetch(`${API_BASE_URL}/properties?${params}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const result = await parseResponse(response);

            if (result.status && result.data) {
                if (Array.isArray(result.data)) {
                    // Flat response (Backend .get()) - Handle Client Side Pagination
                    setAllData(result.data);
                    setPagination(null);
                } else if (result.data.data && Array.isArray(result.data.data)) {
                    // Paginated response (Backend .paginate())
                    setData(result.data.data);
                    setPagination(result.data);
                    setAllData([]); // Clear flat data
                }
            } else {
                setData([]);
                setAllData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    // Filter Data Logic
    const filteredData = allData.filter(item => {
        // Global Search
        const matchesGlobal = search === '' ||
            item.code?.toLowerCase().includes(search.toLowerCase()) ||
            item.plot_no?.toLowerCase().includes(search.toLowerCase()) ||
            item.venture?.title?.toLowerCase().includes(search.toLowerCase());

        // Column Filters
        const matchesCode = item.code?.toLowerCase().includes(filters.code.toLowerCase());
        const matchesVenture = filters.venture === '' || (item.venture?.title || '').toLowerCase().includes(filters.venture.toLowerCase());
        const matchesPlot = item.plot_no?.toLowerCase().includes(filters.plot_no.toLowerCase());
        const matchesDimensions = (item.dimensions || '').toLowerCase().includes(filters.dimensions.toLowerCase());
        const matchesPrice = (String(item.total_cost) || '').includes(filters.price);
        const matchesStatus = filters.status === '' || (item.status || '').toLowerCase().includes(filters.status.toLowerCase());

        return matchesGlobal && matchesCode && matchesVenture && matchesPlot && matchesDimensions && matchesPrice && matchesStatus;
    });

    // Client-side pagination effect
    useEffect(() => {
        if (filteredData.length > 0 || allData.length > 0) { // Run if data exists (even if filtered result is empty)
            const startIndex = (page - 1) * perPage;
            const endIndex = startIndex + perPage;
            setData(filteredData.slice(startIndex, endIndex));
        } else {
            setData([]);
        }
    }, [allData, filters, search, page, perPage]);

    // Handle Column Filter Change
    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(1); // Reset to first page on filter
    };


    useEffect(() => {
        fetchProperties();
    }, [ventureId, token]); // Only re-fetch on filter change, NOT page/perPage if handling client-side

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProperties();
    };



    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-green-500';
            case 'Booked': return 'bg-blue-500';
            case 'Sold': return 'bg-gray-500';
            case 'Blocked': return 'bg-red-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="w-full space-y-4">
            <BreadcrumbComp title="Properties List" />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold">Manage Properties</CardTitle>
                    <Link to="/assets/properties/create">
                        <Button className="bg-cyan-600 hover:bg-cyan-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Property
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 max-w-sm">
                            <SearchableSelect
                                value={ventureId}
                                onChange={setVentureId}
                                options={[
                                    { value: '', label: 'All Ventures' },
                                    ...ventures.map(v => ({ value: String(v.id), label: `${v.title}` }))
                                ]}
                                placeholder="Filter by Venture"
                            />
                        </div>
                        <select
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-24"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <div className="flex-1 flex gap-2">
                            <Input
                                placeholder="Search plot, code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="max-w-sm"
                            />
                            <Button variant="secondary" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Venture</TableHead>
                                    <TableHead>Plot No</TableHead>
                                    <TableHead>Dimensions</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                                {/* Filter Row */}
                                <TableRow>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Code" value={filters.code} onChange={e => handleFilterChange('code', e.target.value)} /></TableHead>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Venture" value={filters.venture} onChange={e => handleFilterChange('venture', e.target.value)} /></TableHead>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Plot" value={filters.plot_no} onChange={e => handleFilterChange('plot_no', e.target.value)} /></TableHead>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Dims" value={filters.dimensions} onChange={e => handleFilterChange('dimensions', e.target.value)} /></TableHead>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Price" value={filters.price} onChange={e => handleFilterChange('price', e.target.value)} /></TableHead>
                                    <TableHead><Input className="h-8 text-xs" placeholder="Search Status" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} /></TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No properties found</TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.code}</TableCell>
                                            <TableCell>{item.venture?.title || '-'}</TableCell>
                                            <TableCell>{item.plot_no}</TableCell>
                                            <TableCell>{item.dimensions}</TableCell>
                                            <TableCell>₹{item.total_cost}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(item.status)} hover:${getStatusColor(item.status)} text-white`}>
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <Link to={`/assets/properties/view/${item.id}`}>
                                                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                                                        </Link>
                                                        <Link to={`/assets/properties/edit/${item.id}`}>
                                                            <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        </Link>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination - Handle both Server-side and Client-side */}
                    {(pagination || filteredData.length > 0) && (
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm text-gray-500">
                                Page {page} of {pagination ? pagination.last_page : Math.ceil(filteredData.length / perPage)}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page === (pagination ? pagination.last_page : Math.ceil(filteredData.length / perPage))}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PropertiesList;
