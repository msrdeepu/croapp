import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
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
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Copy, Loader2, FileSpreadsheet } from 'lucide-react';
import { Badge } from 'src/components/ui/badge';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';

const VenturesList = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [ventures, setVentures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const fetchVentures = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ventures?page=${page}&search=${searchTerm}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const text = await response.text();

            if (!response.ok) {
                console.error(`API Error ${response.status}:`, text);
                setVentures([]);
                return;
            }

            let data;
            try {
                // First try standard parse
                data = JSON.parse(text);
            } catch (e) {
                // The response is likely "[]{...}" or similar garbage
                // Find the first { and the last }
                try {
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');

                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        const jsonStr = text.substring(firstBrace, lastBrace + 1);
                        data = JSON.parse(jsonStr);
                    } else {
                        throw new Error('No valid JSON object found in response');
                    }
                } catch (e2) {
                    console.error('JSON Parse/Recovery Error:', e2);
                    setVentures([]);
                    return;
                }
            }
            // Data is directly paginated result
            if (data && data.data) {
                setVentures(data.data);
                setTotalPages(data.last_page);
            } else {
                console.warn('Unexpected data structure:', data);
                setVentures([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchVentures();
        }, 500);
        return () => clearTimeout(timeout);
    }, [page, searchTerm, token]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 3000);
    };



    const handleDuplicate = async (id: number) => {
        if (!confirm('Are you sure you want to duplicate this venture?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/ventures/${id}/clone`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                showAlert('success', 'Duplicated', 'Venture duplicated successfully');
                fetchVentures();
            } else {
                showAlert('error', 'Error', 'Failed to duplicate venture');
            }
        } catch (err) {
            showAlert('error', 'Error', 'An error occurred');
        }
    };

    const handleCopy = (venture: any) => {
        const lines = [
            `Code: ${venture.code}`,
            `Title: ${venture.title}`,
            `Location: ${venture.location}`,
            `Status: ${venture.status}`,
            `Active: ${venture.enabled === 1 ? 'Yes' : 'No'}`,
            `Created: ${venture.created_at ? format(new Date(venture.created_at), 'dd/MM/yyyy') : 'N/A'}`
        ];
        const text = lines.join('\n');
        navigator.clipboard.writeText(text);
        showAlert('success', 'Copied', 'Venture details copied to clipboard');
    };

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ongoing': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Hold': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="w-full">
            <BreadcrumbComp title="Manage Ventures" />

            {/* Toast Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'} className="animate-in slide-in-from-top-full fade-in w-[300px]">
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                ))}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>List of Ventures</CardTitle>
                    <Button onClick={() => navigate('/assets/ventures/create')}>
                        <Plus className="mr-2 h-4 w-4" /> New Venture
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search ventures..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : ventures.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No ventures found.</TableCell>
                                    </TableRow>
                                ) : (
                                    ventures.map((venture) => (
                                        <TableRow key={venture.id}>
                                            <TableCell className="font-medium font-mono text-xs">{venture.code}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{venture.title}</span>
                                                    <span className="text-xs text-gray-500">{venture.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{venture.location}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(venture.status)}>
                                                    {venture.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {venture.enabled === 1
                                                    ? <span className="text-green-600 font-bold text-xs">YES</span>
                                                    : <span className="text-red-600 font-bold text-xs">NO</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-xs text-gray-500">
                                                {venture.created_at && format(new Date(venture.created_at), 'dd/MM/yyyy')}
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
                                                        <DropdownMenuItem onClick={() => navigate(`/assets/ventures/edit/${venture.id}`)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDuplicate(venture.id)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigate(`/assets/ventures/dips-overview/${venture.id}`)}>
                                                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Dips Overview
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCopy(venture)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Copy Details
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

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default VenturesList;
