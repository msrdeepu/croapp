import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import { Button } from 'src/components/ui/button';

import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Calendar, CheckSquare, RotateCcw, Search, Loader2, FileText, FileSpreadsheet, Plus, Copy, AlertCircle, CheckCircle2, X } from 'lucide-react';
import RescheduleModal from './RescheduleModal';
import FinalizeModal from './FinalizeModal';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Input } from 'src/components/ui/input';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'src/components/ui/dialog';
import { cn } from 'src/lib/utils'; const SiteVisits = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Pagination & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // Modals
    const [rescheduleData, setRescheduleData] = useState<any>(null);
    const [finalizeData, setFinalizeData] = useState<any>(null);
    const [statusOptions, setStatusOptions] = useState([]);

    // Restore Dialog State
    const [restoreId, setRestoreId] = useState<string | null>(null);

    // Alert State
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => {
            const newAlert = { id, type, title, message };
            const updated = [...prev, newAlert];
            if (updated.length > 3) return updated.slice(updated.length - 3);
            return updated;
        });
        setTimeout(() => removeAlert(id), 3000);
    };

    const removeAlert = (id: number) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    const handleCopy = (visit: any) => {
        const lines = [
            `Branch: ${visit.branch?.location || 'Unknown'}`,
            `Date: ${visit.date ? format(new Date(visit.date), 'dd/MMM/yyyy h:mm a') : 'N/A'}`,
            `Agent: ${visit.agent?.fullname || 'N/A'} (${visit.agent?.agent_code || 'N/A'})`,
            `Customer: ${(visit.leads || []).map((l: any) => l.name).join(', ') || 'N/A'}`,
            `Vehicle: ${visit.vehical?.vehical || 'N/A'} (${visit.vehical?.number || 'N/A'})`,
            `Status: ${visit.status}`
        ];

        // Add Trip Details
        lines.push(`Start: ${visit.starts || 'N/A'}`);
        (visit.leads || []).forEach((l: any) => {
            if (l.oneproperty_id) lines.push(`- ${l.oneventure}, ${l.oneproperty}`);
            if (l.twoproperty_id) lines.push(`- ${l.twoventure}, ${l.twoproperty}`);
        });
        lines.push(`End: ${visit.drops || 'N/A'}`);

        const text = lines.join('\n');
        navigator.clipboard.writeText(text);
        showAlert('success', 'Copied', 'Visit details copied to clipboard');
    };

    const fetchVisits = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            let url = ENDPOINTS.SITE_VISITS.STATUS_PENDING;
            if (activeTab === 'rescheduled') url = ENDPOINTS.SITE_VISITS.STATUS_RESCHEDULED;
            if (activeTab === 'completed') url = ENDPOINTS.SITE_VISITS.STATUS_COMPLETED;
            if (activeTab === 'canceled') url = ENDPOINTS.SITE_VISITS.STATUS_CANCELED;

            // Append Query Params
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            // params.append('per_page', itemsPerPage.toString()); // Controller needs update to support this
            if (searchTerm) params.append('search', searchTerm); // Controller needs update to support this

            // Construct full URL with params
            const fullUrl = `${url}?${params.toString()}`;

            const response = await fetch(fullUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('"') || text.trim().startsWith("'")) {
                    try { data = JSON.parse(JSON.parse(text)); } catch (e2) { console.error('Double parse failed', e2); }
                } else if (text.trim().startsWith('[]')) {
                    const fixedText = text.trim().substring(2);
                    try { data = JSON.parse(fixedText); } catch (e2) { console.error('Error parsing fixed JSON:', e2); }
                } else {
                    console.error('Error parsing JSON:', e);
                }
            }

            if (data) {
                if (data.data && Array.isArray(data.data)) {
                    setVisits(data.data);
                    setTotalItems(data.total || data.data.length); // Use total from pagination if available
                } else if (Array.isArray(data)) {
                    setVisits(data);
                    setTotalItems(data.length);
                } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
                    setVisits(data.data.data);
                    setTotalItems(data.data.total);
                } else {
                    setVisits([]);
                    setTotalItems(0);
                }
            } else {
                setVisits([]);
                setTotalItems(0);
            }

        } catch (error) {
            console.error('Error fetching visits:', error);
            setVisits([]);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [token, activeTab, currentPage, searchTerm]);

    useEffect(() => {
        fetchVisits();
    }, [fetchVisits]);

    useEffect(() => {
        if (token && !statusOptions.length) {
            fetch(ENDPOINTS.SITE_VISITS.CREATE_FORM_DATA, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(async res => {
                    const text = await res.text();
                    console.log('Raw Status Response:', text);
                    try {
                        let cleanText = text.trim();
                        if (cleanText.startsWith('[]')) {
                            cleanText = cleanText.substring(2);
                        }
                        return JSON.parse(cleanText);
                    } catch (e) {
                        console.error('Status Parse Error 1:', e);
                        try { return JSON.parse(JSON.parse(text)); } catch { return {}; }
                    }
                })
                .then(data => {
                    console.log('Status API Response:', data);
                    if (Array.isArray(data) && data[0] && data[0].status) {
                        setStatusOptions(data[0].status);
                    } else if (data && data.status) {
                        setStatusOptions(data.status);
                    }
                })
                .catch(err => console.error('Error fetching statuses:', err));
        }
    }, [token, statusOptions.length]);




    const handleRestore = (id: string) => {
        setRestoreId(id);
    };

    const confirmRestore = async () => {
        if (!restoreId) return;
        try {
            const response = await fetch(ENDPOINTS.SITE_VISITS.RESTORE(restoreId), {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchVisits();
                showAlert('success', 'Success', 'Site visit restored successfully');
                setRestoreId(null);
            } else {
                showAlert('error', 'Error', 'Failed to restore site visit');
            }
        } catch (error) {
            console.error(error);
            showAlert('error', 'Error', 'An error occurred while restoring');
        }
    };

    const exportToCSV = () => {
        // Flatten data for export
        const exportData = visits.map(v => ({
            Date: v.date,
            Agent: v.agent?.fullname,
            Customer: v.leads?.map((l: any) => l.name).join(', '),
            Vehicle: v.vehical?.vehical,
            Status: v.status
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SiteVisits");
        XLSX.writeFile(workbook, "SiteVisits.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        autoTable(doc, {
            head: [['Date', 'Agent', 'Customer', 'Vehicle', 'Status']],
            body: visits.map(v => [
                v.date ? format(new Date(v.date), 'dd/MM/yyyy') : '-',
                v.agent?.fullname || '-',
                v.leads?.map((l: any) => l.name).join(', ') || '-',
                v.vehical?.vehical || '-',
                v.status
            ]),
        });
        doc.save("SiteVisits.pdf");
    };

    return (
        <div className="space-y-4 p-8 pt-6">
            {/* Toast Notification Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out">
                        <Alert variant={alert.type} className={cn("shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10", alert.type === 'success' ? "bg-green-500" : "bg-red-500")}>
                            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" /> : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />}
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">{alert.message}</AlertDescription>
                            </div>
                            <button onClick={() => removeAlert(alert.id)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
                        </Alert>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Site Visits</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                    <Button onClick={() => navigate('/crm/sitevisits/create')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Visit
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="capitalize">{activeTab} Site Visits</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentPage(1); }} className="w-full">
                            <TabsList>
                                <TabsTrigger value="pending">Pending</TabsTrigger>
                                <TabsTrigger value="rescheduled">Rescheduled</TabsTrigger>
                                <TabsTrigger value="completed">Completed</TabsTrigger>
                                <TabsTrigger value="canceled">Canceled</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show</span>
                            <select
                                className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={itemsPerPage}
                                onChange={() => {
                                    /* Handle page size change - would need state update and API param */
                                }}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span className="text-sm text-muted-foreground">entries</span>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-[300px]">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search visits..."
                                    className="pl-8 w-full md:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                <p className="mt-2 text-muted-foreground">Loading site visits...</p>
                            </div>
                        ) : visits.length === 0 ? (
                            <div className="col-span-full text-center py-12 border rounded-lg bg-slate-50">
                                <p className="text-muted-foreground">No site visits found.</p>
                            </div>
                        ) : (
                            visits.map((visit: any) => (
                                <div key={visit.id} className="relative bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                    {/* Side Stick Color Indicator */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${visit.status === 'Completed' ? 'bg-green-500' :
                                        visit.status === 'Canceled' ? 'bg-red-500' :
                                            visit.status === 'Rescheduled' ? 'bg-orange-400' :
                                                'bg-blue-500'
                                        }`}></div>

                                    <div className="p-4 pl-6">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3 border-b pb-2">
                                            <h3 className="font-medium text-slate-700">
                                                {visit.branch?.location || 'Unknown'} : {visit.date ? format(new Date(visit.date), 'dd/MMM/yyyy') : 'N/A'},
                                            </h3>
                                            <div className={`h-3 w-3 rounded-full ${visit.status === 'Completed' ? 'bg-green-500' :
                                                visit.status === 'Canceled' ? 'bg-red-500' :
                                                    visit.status === 'Rescheduled' ? 'bg-orange-400' :
                                                        'bg-blue-500'
                                                }`}></div>
                                        </div>

                                        {/* Promoter Details */}
                                        <div className="mb-3">
                                            <h4 className="text-sm font-semibold text-slate-800 mb-1">Promoter Details :</h4>
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                {visit.agent ? (
                                                    <>
                                                        <div>{visit.agent.fullname} {visit.agent.surname} : {visit.agent.agent_code}</div>
                                                        {visit.contact && (
                                                            <div className="flex gap-2">
                                                                {visit.contact.phone && <span><i className="fas fa-phone-square-alt"></i> : {visit.contact.phone}</span>}
                                                                {visit.contact.mobile && <span><i className="fas fa-mobile-alt"></i> : {visit.contact.mobile}</span>}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : <span className="text-red-400">Agent Not Found</span>}
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 my-2" />

                                        {/* Vehicle Details */}
                                        <div className="mb-3">
                                            <h4 className="text-sm font-semibold text-slate-800 mb-1">Vehical Details :</h4>
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                {visit.vehical ? (
                                                    <>
                                                        <div>Owner: {visit.vehical.owner} - {visit.vehical.ownercontact || 'NA'}</div>
                                                        <div>{visit.vehical.number} : {visit.vehical.vehical}</div>
                                                        <div>Driver: {visit.vehical.driver || 'NA'} - {visit.vehical.drivercontact || 'NA'}</div>
                                                    </>
                                                ) : <span className="text-red-400">Vehical Info Missing</span>}
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 my-2" />

                                        {/* Trip Details */}
                                        <div className="mb-3">
                                            <h4 className="text-sm font-semibold text-slate-800 mb-1">Trip Details :</h4>
                                            <div className="text-xs text-slate-500 space-y-0.5">
                                                <div>{visit.date ? format(new Date(visit.date), 'dd/MMM/yyyy h:mm a') : 'N/A'}</div>
                                                <div>Starting Point: {visit.starts}</div>

                                                {/* Leads / Routes */}
                                                {(visit.leads || []).map((l: any) => (
                                                    <div key={l.id} className="pl-1 border-l-2 border-slate-200 my-1">
                                                        {l.oneproperty_id && <div>{l.oneventure}, {l.oneproperty}</div>}
                                                        {l.twoproperty_id && <div>{l.twoventure}, {l.twoproperty}</div>}
                                                        {l.threeproperty_id && <div>{l.threeproperty}, {l.threeproperty}</div>}
                                                        {l.fourproperty_id && <div>{l.fourventure}, {l.fourproperty}</div>}
                                                    </div>
                                                ))}

                                                <div>Final Stop : {visit.drops}</div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100 my-3" />

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-3 text-xs font-medium">
                                            <button
                                                onClick={() => handleCopy(visit)}
                                                className="text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-1"
                                                title="Copy Details"
                                            >
                                                <Copy className="h-3 w-3" /> Copy
                                            </button>
                                            {visit.status !== 'Canceled' && visit.status !== 'Completed' && (
                                                <>
                                                    <button
                                                        onClick={() => setRescheduleData(visit)}
                                                        className="text-orange-500 hover:underline flex items-center gap-1"
                                                    >
                                                        <Calendar className="h-3 w-3" /> Reschedule
                                                    </button>

                                                    <button
                                                        onClick={() => setFinalizeData(visit)}
                                                        className="text-green-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <CheckSquare className="h-3 w-3" /> Final Status
                                                    </button>

                                                    <button
                                                        onClick={() => handleCopy(visit)}
                                                        className="text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-1"
                                                        title="Copy Details"
                                                    >
                                                        <Copy className="h-3 w-3" /> Copy
                                                    </button>

                                                </>
                                            )}


                                            {visit.status === 'Canceled' && (
                                                <button
                                                    onClick={() => handleRestore(visit.id)}
                                                    className="text-blue-500 hover:underline flex items-center gap-1"
                                                >
                                                    <RotateCcw className="h-3 w-3" /> Restore
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {Math.ceil(totalItems / itemsPerPage) || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage >= (Math.ceil(totalItems / itemsPerPage) || 1)}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <RescheduleModal
                isOpen={!!rescheduleData}
                onClose={() => setRescheduleData(null)}
                onSuccess={(msg) => { fetchVisits(); showAlert('success', 'Success', msg || 'Rescheduled successfully'); }}
                visit={rescheduleData}
            />

            <FinalizeModal
                isOpen={!!finalizeData}
                onClose={() => setFinalizeData(null)}
                onSuccess={(msg) => { fetchVisits(); showAlert('success', 'Success', msg || 'Finalized successfully'); }}
                visit={finalizeData}
                statusOptions={statusOptions}
            />

            <Dialog open={!!restoreId} onOpenChange={(open) => !open && setRestoreId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Site Visit</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to restore this site visit? It will be moved back to the pending list.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRestoreId(null)}>Cancel</Button>
                        <Button onClick={confirmRestore}>Restore</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SiteVisits;
