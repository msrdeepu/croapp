import React, { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { Button } from 'src/components/ui/button';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "src/components/ui/breadcrumb";
import { API_BASE_URL } from 'src/config';

// Reusing generic SearchableSelect logic locally or importing if exported. 
// Since it's not exported as a standalone reusable component file in my last read (it was inline in MemberForm), 
// I'll define a local version or improved version here.
// Ideally, this should be in src/components/ui/searchable-select.tsx but for now I will inline it 
// or use the one I saw in src/components/ui if it exists. 
// I saw `src/components/ui/searchable-select.tsx` in the file list earlier! So I will import it.
import { SearchableSelect } from 'src/components/ui/searchable-select';

const CreateEmployeeCreds = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        employee_id: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEmployees();
    }, [token]);

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/employee-creds/employees`, {
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
                    } else { throw e; }
                }
                // Handle structure { status: 'success', data: [...] } or just [...]
                setEmployees(result.data || result || []);
            }
        } catch (err) {
            console.error("Failed to fetch employees", err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleEmployeeChange = (empId: string) => {
        const emp = employees.find(e => String(e.id) === String(empId));
        let newEmail = formData.email;
        if (emp && emp.code) {
            newEmail = `${emp.code}@slnmpl.com`;
        } else if (!empId) {
            newEmail = '';
        }

        setFormData(prev => ({
            ...prev,
            employee_id: empId,
            email: newEmail
        }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!formData.employee_id) {
            setError("Please select an employee.");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/employee-creds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                if (text.trim().startsWith('[]')) {
                    result = JSON.parse(text.trim().substring(2));
                } else { throw e; }
            }

            if (!response.ok) {
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    throw new Error(errorMessages || "Validation failed");
                }
                throw new Error(result.message || "Operation failed");
            }

            setSuccessMessage("Employee credentials created successfully!");
            setFormData({
                employee_id: '',
                email: '',
                password: '',
                password_confirmation: ''
            });
            window.scrollTo(0, 0);

        } catch (err: any) {
            setError(err.message);
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

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
                            <BreadcrumbLink href="/members">Members</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Create Credentials</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Create Employee Credentials</CardTitle>
                </CardHeader>
                <CardContent>
                    {successMessage && (
                        <Alert className="mb-6 border-green-500 bg-green-50 text-green-700">
                            <AlertTitle className="text-green-700">Success</AlertTitle>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Employee *</Label>
                                    <SearchableSelect
                                        options={employees.map(e => ({
                                            label: `${e.fullname} - ${e.code}`,
                                            value: String(e.id)
                                        }))}
                                        value={formData.employee_id}
                                        onChange={handleEmployeeChange}
                                        placeholder="Select Employee"
                                        searchPlaceholder="Search by name or code..."
                                        disabled={pageLoading}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => handleChange('email', e.target.value)}
                                        placeholder="employee@slnmpl.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Password *</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => handleChange('password', e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Confirm Password *</Label>
                                    <Input
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={e => handleChange('password_confirmation', e.target.value)}
                                        placeholder="Retype Password"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                            {/* Typically Cancel might go back to list, but user said "no need of list" for this flow? 
                                I'll link it to Members list as a safe fallback or Dashboard */}
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateEmployeeCreds;
