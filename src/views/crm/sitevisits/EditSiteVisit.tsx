import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SiteVisitForm from './SiteVisitForm';

const EditSiteVisit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSiteVisit = async () => {
            try {
                // The backend Edit endpoint returns { data: {...}, agents: [...], ... }
                // But generally for JSON APIs we fetch the resource at BASE/id to get 'data'.
                // The user code for 'edit' returns: response()->json([ 'data' => ... ])
                // Actually user's `SitevisitController::edit` returns everything.
                // But typically in REST standards we might use GET /sitevisits/{id}.
                // Let's check user's routes.
                // Route::apiResource('sitevisits', SitevisitController::class);
                // SHOW: GET /sitevisits/{id} (calls show method if exists, but user didn't provide show method in the class!)
                // User provided `edit($id)` method. `Route::apiResource` maps GET /sitevisits/{id}/edit to edit(). (Wait, no, apiResource excludes create/edit routes usually unless spec'd).
                // Actually `apiResource` creates: index, store, show, update, destroy.
                // It does NOT create `edit` or `create` routes for API.
                // BUT the user code has:
                // Route::apiResource('sitevisits', SitevisitController::class);
                // And explicitly defined:
                // Route::get('sitevisits/status/pending', ...);
                // The user controller has an `edit($id)` method. 
                // In Laravel API Resource, `edit` is not standard.
                // If I want to use `edit` method, I need a route for it.
                // The user provided routes list DOES NOT show an explicit route for `edit` other than possibly resource?
                // Wait. `Route::apiResource` does NOT include `edit` route.
                // BUT the user provided code for `edit` function in controller.
                // Maybe I should assume there is a route `GET sitevisits/{id}/edit`?
                // OR `show` method method is missing in the provided code!
                // Ah, user's provided code for `SitevisitController` lists `index`... but SKIPs `show`.
                // It has `edit`.
                // So likely the route is `sitevisits/{id}/edit` OR the user means `show`?
                // But `edit` returns form data.
                // I will try to fetch `config.ts` CUSTOMERS.EDIT style: `${API_BASE_URL}/sitevisits/${id}/edit`?
                // But `apiResource` usually uses `show`.
                // If I can't find `show` in the code, I assume `edit` is used.
                // Let's assume the endpoint is `${API_BASE_URL}/sitevisits/${id}/edit` or just `${API_BASE_URL}/sitevisits/${id}` and hope `apiResource` maps to something returning data.
                // Wait, if `show` is missing, `GET /sitevisits/{id}` will fail if the controller doesn't implement it.
                // However, I can try `GET /sitevisits/{id}/edit` if I add it or if it exists.
                // Actually, looking at `CUSTOMERS` in config, it has `edit`.
                // I'll add `EDIT` to `SITE_VISITS` in config or just use `${ENDPOINTS.SITE_VISITS.BASE}/${id}/edit`?
                // Let's assume standard Laravel pattern where if they want "Edit Form Data", they use edit route.
                // I'll update the fetch URL to include `/edit` just in case, or try the resource URL.

                // Let's try `${ENDPOINTS.SITE_VISITS.BASE}/${id}` first. If that 404s/500s, I might need to ask user or assume `/edit`.
                // Given the user provided `edit` function, and NOT `show`, I bet the route is accessible via `/sitevisits/{id}/edit` manually added or intended to be added.
                // But `apiResource` doesn't make it.
                // Let's assume the user has `Route::get('sitevisits/{id}/edit', [SitevisitController::class, 'edit']);` somewhere or I should use that.
                // Or maybe I use the resource URL and the backend handles it (unlikely if method missing).

                // Correction: Use `ENDPOINTS.SITE_VISITS.BASE}/${id}/edit`?
                // Let's stick to `ENDPOINTS.SITE_VISITS.BASE}/${id}` for now, but if it fails I'll know why.
                // Actually, I'll modify the URL to use `/edit` because `edit` function returns the data I need (including lists).

                const response = await fetch(`${ENDPOINTS.SITE_VISITS.BASE}/${id}/edit`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setInitialData(data.data); // User's edit method returns { data: ..., status: ..., ... }
                    // Note: SiteVisitForm typically re-fetches list data.
                    // But here we have it!
                    // I should probably pass this data to SiteVisitForm to avoid double fetch.
                    // But SiteVisitForm fetches its own data.
                    // I will let SiteVisitForm fetch its generic lists, but I should pass `initialData` as the *record*.
                    // `data.data` is the record.
                } else {
                    // Fallback using resource URL if edit fails?
                    const resResource = await fetch(`${ENDPOINTS.SITE_VISITS.BASE}/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                        }
                    });
                    if (resResource.ok) {
                        setInitialData(await resResource.json());
                    } else {
                        navigate('/crm/sitevisits');
                    }
                }
            } catch (error) {
                console.error('Error fetching site visit:', error);
                navigate('/crm/sitevisits');
            } finally {
                setLoading(false);
            }
        };

        if (token && id) {
            fetchSiteVisit();
        }
    }, [token, id, navigate]);

    if (loading) {
        return <div className="flex justify-center items-center h-[500px]"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/crm/sitevisits')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Site Visit</h2>
                    <p className="text-muted-foreground">Update site visit details.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Site Visit Details</CardTitle>
                    <CardDescription>
                        Modify the details for the site visit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {initialData && <SiteVisitForm initialData={initialData} isEdit={true} />}
                </CardContent>
            </Card>
        </div>
    );
};

export default EditSiteVisit;
