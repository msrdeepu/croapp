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
import TransportBillForm from './TransportBillForm';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb"

const CreateTransportBill = () => {
    const navigate = useNavigate();

    return (
        <div className="p-6">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/expenses/transport">Transport Expenses</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Create</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => navigate('/expenses/transport')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Add Transport Bill</h2>
                    <p className="text-muted-foreground">Create a new transport expense record.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bill Details</CardTitle>
                    <CardDescription>
                        Fill in the details for the transport expense.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TransportBillForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateTransportBill;
