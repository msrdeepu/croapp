import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from 'src/config';
import { useAuth } from 'src/context/AuthContext';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'src/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';

const DipsOverview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ventures/${id}/dips-overview`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const text = await response.text();
                let result;
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    // Robust JSON parsing for garbage prefix
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        result = JSON.parse(text.substring(firstBrace, lastBrace + 1));
                    } else throw e;
                }

                if (result.status) {
                    setData(result.data);
                } else {
                    setError(result.message || 'Failed to fetch data');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, token]);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (!data) return null;

    const renderSummarySection = (stats: any) => {
        // Convert amountwise objects to array for table
        const amounts = Object.keys(stats.amountwise_available).sort((a, b) => Number(a) - Number(b));
        // Note: The blade template iterates 'available' keys. 
        // We should merge keys from available and redemptioned to be safe, but following blade logic:

        return (
            <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-500">Total Dip Amounts</p>
                        <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded border border-green-100">
                        <p className="text-sm text-green-600">Available</p>
                        <p className="text-xl font-bold text-green-700">{stats.available}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded border border-red-100">
                        <p className="text-sm text-red-600">Redeemed</p>
                        <p className="text-xl font-bold text-red-700">{stats.redemptioned}</p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount</TableHead>
                                <TableHead>Available Count</TableHead>
                                <TableHead>Redeemed Count</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {amounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No data available</TableCell>
                                </TableRow>
                            ) : (
                                amounts.map((amount) => (
                                    <TableRow key={amount}>
                                        <TableCell className="font-medium">{Number(amount).toLocaleString()}</TableCell>
                                        <TableCell>{stats.amountwise_available[amount]}</TableCell>
                                        <TableCell>{stats.amountwise_redemptioned[amount] || 0}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            <BreadcrumbComp title="Dip Amount Overview" />

            <div className="max-w-7xl mx-auto space-y-6">
                <Button variant="outline" onClick={() => navigate('/assets/ventures')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Ventures
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-center text-primary text-2xl">Dip Amount Overview</CardTitle>
                        <div className="text-center text-gray-600 mt-2">
                            Venture: <span className="font-bold text-black">{data.venture.title}</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible defaultValue="overall" className="w-full">

                            <AccordionItem value="overall">
                                <AccordionTrigger>Overall Summary</AccordionTrigger>
                                <AccordionContent>
                                    {renderSummarySection(data.overall)}
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="booking">
                                <AccordionTrigger>Booking Dip Amounts</AccordionTrigger>
                                <AccordionContent>
                                    {renderSummarySection(data.booking)}
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="agreement">
                                <AccordionTrigger>Agreement Dip Amounts</AccordionTrigger>
                                <AccordionContent>
                                    {renderSummarySection(data.agreement)}
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DipsOverview;
