import SiteVisitBillForm from './SiteVisitBillForm';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb"

const CreateSiteVisitBill = () => {
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
                            <BreadcrumbLink href="/expenses/site-visit">Site Visit Expenses</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Add New</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add Site Visit Expense</CardTitle>
                </CardHeader>
                <CardContent>
                    <SiteVisitBillForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateSiteVisitBill;
