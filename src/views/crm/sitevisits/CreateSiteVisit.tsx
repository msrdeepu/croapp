// import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SiteVisitForm from './SiteVisitForm';

const CreateSiteVisit = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/crm/sitevisits')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organise Site Visit</h2>
                    <p className="text-muted-foreground">Schedule a new site visit for leads.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Site Visit Details</CardTitle>
                    <CardDescription>
                        Fill in the details to schedule a site visit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SiteVisitForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateSiteVisit;
