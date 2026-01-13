import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { useNavigate, useLocation } from 'react-router-dom';
import { MoreHorizontal, Printer } from 'lucide-react';
import { API_BASE_URL } from 'src/config';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';

const ManageAgents = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [allData, setAllData] = useState<any[]>([]); // Store all fetched data
    const [filteredData, setFilteredData] = useState<any[]>([]); // Data after local filtering
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1); // Current page (client-side)
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(10);

    // Column Filters
    const [filters, setFilters] = useState({
        id: '',
        agent_code: '',
        location: '',
        name: '',
        level: '',
        email: '',
        mobile: '',
        created_at: ''
    });

    useEffect(() => {
        if (token) fetchAgents();
    }, [token]);

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            window.history.replaceState({}, ''); // Clear state to avoid showing again on reload
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    }, [location]);

    const fetchAgents = async () => {
        if (!token) return; // Wait for token
        setLoading(true);
        try {
            // Using the agents endpoint as per routes: Route::get('/agents', [MemberController::class, 'index']);
            const response = await fetch(`${API_BASE_URL}/members/agents?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        result = JSON.parse(text.trim().substring(2));
                    } else {
                        throw e;
                    }
                }

                // Handling both paginated response structure and flat array
                const dataList = result.data ? result.data : (Array.isArray(result) ? result : []);
                setAllData(dataList);
                setFilteredData(dataList);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = allData;

        // Apply column filters
        if (Object.values(filters).some(f => f)) {
            result = result.filter(item => {
                const matchId = String(item.id || '').toLowerCase().includes(filters.id.toLowerCase());

                // Agent Code from profile or root
                const agentCode = item.profile?.agent_code || item.agent_code || '';
                const matchCode = String(agentCode).toLowerCase().includes(filters.agent_code.toLowerCase());

                // Location from branch or profile.joblocation or root.location
                const locationVal = item.branch?.location || item.profile?.joblocation || item.location || '';
                const matchLocation = String(locationVal).toLowerCase().includes(filters.location.toLowerCase());

                const matchName = item.name?.toLowerCase().includes(filters.name.toLowerCase());
                const matchLevel = (item.level || '').toLowerCase().includes(filters.level.toLowerCase());
                const matchEmail = (item.email || '').toLowerCase().includes(filters.email.toLowerCase());
                const matchMobile = (item.mobile || '').toLowerCase().includes(filters.mobile.toLowerCase());
                const matchDate = (item.created_at || '').toLowerCase().includes(filters.created_at.toLowerCase());

                return (!filters.id || matchId) &&
                    (!filters.agent_code || matchCode) &&
                    (!filters.location || matchLocation) &&
                    (!filters.name || matchName) &&
                    (!filters.level || matchLevel) &&
                    (!filters.email || matchEmail) &&
                    (!filters.mobile || matchMobile) &&
                    (!filters.created_at || matchDate);
            });
        }

        setFilteredData(result);
        setPage(1); // Reset to first page of results
    }, [filters, allData]);


    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleDownloadIdCard = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/members/print-id-card/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `idcard_${id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                console.error('Failed to download ID card');
                setSuccessMessage('Failed to download ID card'); // Or use a toast
            }
        } catch (error) {
            console.error('Error downloading ID card:', error);
        }
    };

    // Pagination Logic (Client Side)
    const totalPages = Math.ceil(filteredData.length / perPage);
    const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

    return (
        <div className="md:px-4">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/members">Users</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Manage Agents</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {successMessage && (
                <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            <Card className="shadow-sm">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle>List Of Agent Profiles</CardTitle>
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Show</span>
                            <select
                                className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-sm text-gray-500">entries</span>
                        </div>


                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden grid">
                        <div className="overflow-x-auto w-full max-w-[85vw] md:max-w-[calc(100vw-220px)]">
                            <Table className="min-w-max w-full text-left">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID#</TableHead>
                                        <TableHead>Agent Code</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Cadre Level</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Mobile</TableHead>
                                        <TableHead>Created On</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                    {/* Search Filters Row */}
                                    <TableRow>
                                        <TableHead><Input className="h-8 text-xs min-w-[60px]" placeholder="ID" value={filters.id} onChange={e => handleFilterChange('id', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[80px]" placeholder="Code" value={filters.agent_code} onChange={e => handleFilterChange('agent_code', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[80px]" placeholder="Location" value={filters.location} onChange={e => handleFilterChange('location', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[100px]" placeholder="Name" value={filters.name} onChange={e => handleFilterChange('name', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[80px]" placeholder="Level" value={filters.level} onChange={e => handleFilterChange('level', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[100px]" placeholder="Email" value={filters.email} onChange={e => handleFilterChange('email', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[80px]" placeholder="Mobile" value={filters.mobile} onChange={e => handleFilterChange('mobile', e.target.value)} /></TableHead>
                                        <TableHead><Input className="h-8 text-xs min-w-[90px]" placeholder="Date" value={filters.created_at} onChange={e => handleFilterChange('created_at', e.target.value)} /></TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                No Results Found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedData.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.id}</TableCell>
                                                <TableCell>{item.profile?.agent_code || item.agent_code || '-'}</TableCell>
                                                <TableCell>{item.branch?.location || item.profile?.joblocation || item.location || '-'}</TableCell>
                                                <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                                                <TableCell>{item.level || '-'}</TableCell>
                                                <TableCell className="whitespace-nowrap">{item.email}</TableCell>
                                                <TableCell className="whitespace-nowrap">{item.mobile}</TableCell>
                                                <TableCell className="whitespace-nowrap text-sm">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => navigate(`/members/view/${item.id}`)}>
                                                                <MoreHorizontal className="mr-2 h-4 w-4" /> View
                                                            </DropdownMenuItem>
                                                            {/* <DropdownMenuItem onClick={() => navigate(`/members/edit/${item.id}`)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem> */}
                                                            <DropdownMenuItem onClick={() => handleDownloadIdCard(item.id)}>
                                                                <Printer className="mr-2 h-4 w-4" /> Print ID Card
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end py-4">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm text-gray-500">
                                Page {page} of {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ManageAgents;
