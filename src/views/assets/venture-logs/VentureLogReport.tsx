import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Alert, AlertTitle } from 'src/components/ui/alert';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Loader2, Save, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from 'src/components/ui/dialog';
import { cn } from 'src/lib/utils';

const VentureLogReport = () => {
    const { token } = useAuth();
    const [ventures, setVentures] = useState<any[]>([]);
    const [selectedVentureId, setSelectedVentureId] = useState<string>('');
    const [ventureData, setVentureData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState('');

    // Toast State
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    // Confirm Dialog State
    const [showConfirmLogs, setShowConfirmLogs] = useState(false);

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

    // Fetch initial venture list
    useEffect(() => {
        const fetchVentures = async () => {
            // Basic fetch for dropdown
            try {
                const response = await fetch(`${API_BASE_URL}/venture-logs`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const text = await response.text();
                // Robust JSON parsing
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
                    }
                }

                if (data && data.status) {
                    setVentures(data.data.ventures);
                }
            } catch (error) {
                console.error("Error fetching ventures", error);
            }
        };
        fetchVentures();
    }, [token]);

    // Fetch stats when venture selected
    useEffect(() => {
        if (!selectedVentureId) {
            setStats(null);
            setVentureData(null);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/venture-logs?venture_id=${selectedVentureId}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        data = JSON.parse(text.substring(firstBrace, lastBrace + 1));
                    }
                }

                if (data && data.status && data.data.stats) {
                    setStats(data.data.stats);
                    setVentureData(data.data.ventureData);
                }
            } catch (error) {
                console.error("Error fetching stats", error);
                showAlert('error', 'Error', 'Failed to fetch venture stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedVentureId, token]);

    const handleSaveLogClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!stats || !selectedVentureId) {
            showAlert('error', 'Validation Error', 'Please select a venture first');
            return;
        }
        setShowConfirmLogs(true);
    };

    const confirmSaveLog = async () => {
        setShowConfirmLogs(false);
        setSubmitting(true);
        try {
            const payload = {
                venture_id: selectedVentureId,
                booked_properties: stats.bookedProperties,
                total_receipts: stats.receipts_count,
                registered_properties: stats.registeredProperties,
                available_properties: stats.availableProperties,
                agreement_properties: stats.agreementProperties,
                paid_pending_registration_properties: stats.paidPendingProperties,
                registered_amount: stats.registeredBusiness,
                current_business: stats.currentBusiness,
                paid_amount: stats.paidBusiness,
                pending_amount: stats.pendingBusiness,
                available_properties_worth: stats.availablePropertiesWorth,
                comments: comments
            };

            const response = await fetch(`${API_BASE_URL}/venture-logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showAlert('success', 'Success', 'Venture Log Added Successfully');
                setComments('');
                // Optionally clear selection or fetch fresh stats
            } else {
                showAlert('error', 'Error', 'Failed to add log');
            }
        } catch (error) {
            showAlert('error', 'Error', 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const StatusCard = ({ title, count, color, iconClass, percentage }: any) => (
        <div className="card shadow-md rounded border-0 flex-1 min-w-[250px] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <i className={`${iconClass} text-muted text-lg mr-2`}></i>
                    <span className="text-lg text-gray-500">{title}</span>
                </div>
                <h1 className="text-3xl font-light text-right">{count}</h1>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );

    const FinanceCard = ({ title, amount, color, iconClass, percentage }: any) => (
        <div className="card shadow-md rounded border-0 flex-1 min-w-[250px] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <i className={`${iconClass} text-muted text-lg mr-2`}></i>
                    <span className="text-lg text-gray-500">{title}</span>
                </div>
                <h4 className="text-xl font-light text-right">₹{Number(amount).toLocaleString()}</h4>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-6">
            <BreadcrumbComp title="Venture Log Report" />

            {/* Toast Notification Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div key={alert.id} className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out">
                        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className={cn("shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10", alert.type === 'success' ? "bg-green-500" : "bg-red-500")}>
                            {alert.type === 'success' ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" /> : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />}
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <div className="text-sm text-white/90 font-medium leading-relaxed">
                                    {alert.message}
                                </div>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </Alert>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/3">
                            <Label htmlFor="venture">Select Venture</Label>
                            <SearchableSelect
                                options={ventures.map(v => ({ value: String(v.id), label: `${v.code} - ${v.title}` }))}
                                value={selectedVentureId}
                                onChange={setSelectedVentureId}
                                placeholder="-- Select Venture --"
                            />
                        </div>
                        {selectedVentureId && (
                            <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="bg-green-600 hover:bg-green-700">Add Venture Log</Button>
                        )}
                        {/* {user?.type === 'admin' && ( // TODO: Add type definition or fix check
                            <div className="ml-auto">
                                <Button variant="outline" className="border-info text-info hover:bg-blue-50">
                                   <History className="mr-2 h-4 w-4" /> Show Previous Logs
                                </Button>
                            </div>
                        )} */}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : stats && ventureData ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                    {/* Venture Info Card */}
                    <div className="flex justify-center my-4">
                        <div className="card shadow-md border-2 border-yellow-500 bg-yellow-50 rounded-xl transform transition duration-300 hover:scale-105 hover:shadow-xl w-full max-w-xl p-6 text-center">
                            <p className="text-lg font-semibold text-yellow-600">Venture Info</p>
                            <h4 className="text-xl font-bold text-gray-800 mt-2">
                                #{ventureData.code} - {ventureData.title} - {ventureData.location}
                            </h4>
                        </div>
                    </div>

                    {/* Stats Grid 1 - Counts */}
                    <div className="flex flex-wrap gap-4">
                        <StatusCard title="Registered" count={stats.registeredProperties} color="bg-green-500" iconClass="ri-time-line" percentage={50} />
                        <StatusCard title="Booked" count={stats.bookedProperties} color="bg-blue-400" iconClass="ri-emotion-line" percentage={75} />
                        <StatusCard title="On Agreement" count={stats.agreementProperties} color="bg-purple-500" iconClass="ri-money-euro-circle-line" percentage={65} />
                        <StatusCard title="Paid Reg Pending" count={stats.paidPendingProperties} color="bg-red-500" iconClass="ri-bar-chart-fill" percentage={70} />
                        <StatusCard title="Available" count={stats.availableProperties} color="bg-yellow-500" iconClass="ri-image-fill" percentage={60} />
                    </div>

                    {/* Stats Grid 2 - Financials */}
                    <div className="flex flex-wrap gap-4">
                        <FinanceCard title="Completed" amount={stats.registeredBusiness} color="bg-green-500" iconClass="ri-image-fill" percentage={60} />
                        <FinanceCard title="Current" amount={stats.currentBusiness} color="bg-blue-400" iconClass="ri-emotion-line" percentage={75} />
                        <FinanceCard title="Paid Amount" amount={stats.paidBusiness} color="bg-purple-500" iconClass="ri-money-euro-circle-line" percentage={65} />
                        <FinanceCard title="Pending Amount" amount={stats.pendingBusiness} color="bg-red-500" iconClass="ri-bar-chart-fill" percentage={70} />
                        <FinanceCard title="Available Worth" amount={stats.availablePropertiesWorth} color="bg-yellow-500" iconClass="ri-time-line" percentage={50} />
                    </div>

                    {/* Receipts Count */}
                    <div className="flex flex-wrap gap-4">
                        <div className="card shadow-md rounded border-0 flex-1 min-w-[250px] max-w-[300px] bg-white p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <i className="ri-image-fill text-muted text-lg mr-2"></i>
                                    <span className="text-lg text-gray-500">Total Receipts</span>
                                </div>
                                <h1 className="text-3xl font-light text-right">{stats.receipts_count}</h1>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Form */}
                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Add Venture Log Entry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveLogClick} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Comments</Label>
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Enter Your Comments"
                                        className="resize-none"
                                        rows={4}
                                    />
                                </div>
                                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" /> Save Venture Log Report
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                </div>
            ) : null}

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmLogs} onOpenChange={setShowConfirmLogs}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Venture Log</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to add this venture log? This action creates a permanent record.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="font-semibold">Venture:</span>
                            <span>{ventureData?.title}</span>
                            <span className="font-semibold">Receipts:</span>
                            <span>{stats?.receipts_count}</span>
                            <span className="font-semibold">Registered:</span>
                            <span>{stats?.registeredProperties}</span>
                            {comments && (
                                <>
                                    <span className="font-semibold">Comments:</span>
                                    <span className="col-span-2 italic text-gray-600">{comments}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmLogs(false)}>Cancel</Button>
                        <Button onClick={confirmSaveLog}>Confirm & Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VentureLogReport;
