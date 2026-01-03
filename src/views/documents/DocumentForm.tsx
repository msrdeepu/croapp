import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Loader2, FileText, Image as ImageIcon, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent } from 'src/components/ui/card';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { cn } from 'src/lib/utils';

interface DocumentFormProps {
    documentId?: number; // If present, it's edit mode
}

const DocumentForm = ({ documentId }: DocumentFormProps) => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        venture_id: '',
        property_id: '',
        document_type: '',
        notes: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [existingFile, setExistingFile] = useState<string | null>(null); // URL of existing file

    // Dropdown Data
    const [ventures, setVentures] = useState<{ value: string; label: string }[]>([]);
    const [doctypes, setDoctypes] = useState<{ value: string; label: string }[]>([]);
    const [properties, setProperties] = useState<{ value: string; label: string }[]>([]);

    // Alert State
    const [alerts, setAlerts] = useState<{ id: number, type: 'success' | 'error', message: string, title: string }[]>([]);

    const showAlert = (type: 'success' | 'error', title: string, message: string) => {
        const id = Date.now();
        setAlerts(prev => {
            const newAlert = { id, type, title, message };
            // Keep max 3, remove oldest (from start) if exceeded
            const updated = [...prev, newAlert];
            if (updated.length > 3) {
                return updated.slice(updated.length - 3);
            }
            return updated;
        });

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            removeAlert(id);
        }, 3000);
    };

    const removeAlert = (id: number) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    };

    useEffect(() => {
        fetchFormData();
        if (documentId) {
            fetchDocumentDetails();
        }
    }, [token, documentId]);

    // Fetch Ventures and DocTypes
    const fetchFormData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents/form-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else {
                        throw e;
                    }
                }
                setVentures(data.ventures?.map((v: any) => ({ ...v, value: String(v.value) })) || []);
                setDoctypes(data.doctypes || []);
            }
        } catch (error) {
            console.error("Error fetching form data:", error);
        } finally {
            if (!documentId) setFetchingData(false);
        }
    };

    // Fetch Properties when Venture changes
    const fetchProperties = async (ventureId: string | number) => {
        if (!ventureId) {
            setProperties([]);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/documents/properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ venture_id: ventureId })
            });
            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else {
                        throw e;
                    }
                }
                setProperties(data.properties?.map((p: any) => ({ ...p, value: String(p.value) })) || []);
            }
        } catch (error) {
            console.error("Error fetching properties:", error);
        }
    };

    // Fetch Document Details (Edit Mode)
    const fetchDocumentDetails = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const text = await response.text();
                let data: any;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    if (text.trim().startsWith('[]')) {
                        data = JSON.parse(text.substring(2));
                    } else {
                        throw e;
                    }
                }

                // Pre-populate form - convert IDs to strings for searchable select matching
                setFormData({
                    venture_id: String(data.venture_id || ''),
                    property_id: String(data.property_id || ''),
                    document_type: data.document_type,
                    notes: data.notes || '',
                });
                setExistingFile(data.file_path);

                // Fetch properties for the pre-selected venture
                if (data.venture_id) {
                    await fetchProperties(String(data.venture_id));
                }
            }
        } catch (error) {
            console.error("Error fetching document details:", error);
            showAlert('error', 'Error', 'Failed to load document details.');
            setTimeout(() => navigate('/documents'), 1500);
        } finally {
            setFetchingData(false);
        }
    };

    const handleVentureChange = (value: string) => {
        setFormData(prev => ({ ...prev, venture_id: value, property_id: '' })); // Reset property on venture change
        fetchProperties(value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('venture_id', formData.venture_id);
        if (formData.property_id) data.append('property_id', formData.property_id);
        data.append('document_type', formData.document_type);
        data.append('notes', formData.notes);
        if (selectedFile) {
            data.append('document', selectedFile);
        }

        // If edit mode and method PUT, Laravel often requires _method field for FormData or POST with _method=PUT
        // But standard API Resource usually accepts PUT. Use _method for FormData safety in Laravel.
        if (documentId) {
            data.append('_method', 'PUT');
        }

        const url = documentId
            ? `${API_BASE_URL}/documents/${documentId}`
            : `${API_BASE_URL}/documents`;

        try {
            const response = await fetch(url, {
                method: 'POST', // Always POST for FormData with file (use _method for PUT)
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (response.ok) {
                showAlert('success', 'Success', documentId ? 'Document updated successfully!' : 'Document added successfully!');
                setTimeout(() => navigate('/documents'), 1500);
            } else {
                const errorData = await response.json();
                console.error("Submission failed:", errorData);
                showAlert('error', 'Error', errorData.message || 'Validation failed');
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showAlert('error', 'Error', 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <>
            {/* Toast Notification Container */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="animate-in slide-in-from-top-full fade-in zoom-in-95 duration-300 ease-out"
                    >
                        <Alert
                            variant={alert.type}
                            className={cn(
                                "shadow-2xl border-0 p-4 flex items-start gap-4 min-w-[300px] max-w-[400px] text-white rounded-xl relative pr-10",
                                alert.type === 'success' ? "bg-green-500" : "bg-red-500"
                            )}
                        >
                            {alert.type === 'success'
                                ? <CheckCircle2 className="h-6 w-6 text-white shrink-0 mt-0.5" />
                                : <AlertCircle className="h-6 w-6 text-white shrink-0 mt-0.5" />
                            }
                            <div className="flex flex-col">
                                <AlertTitle className="mb-0 text-base font-bold text-white">{alert.title}</AlertTitle>
                                <AlertDescription className="text-sm text-white/90 mt-1 font-medium leading-tight">
                                    {alert.message}
                                </AlertDescription>
                            </div>
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </Alert>
                    </div>
                ))}
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Venture - Searchable Select */}
                            <div className="space-y-2">
                                <Label>Venture *</Label>
                                <SearchableSelect
                                    options={ventures}
                                    value={formData.venture_id}
                                    onChange={handleVentureChange}
                                    placeholder="Select Venture"
                                />
                            </div>

                            {/* Property - Searchable Select */}
                            <div className="space-y-2">
                                <Label>Property</Label>
                                <SearchableSelect
                                    options={properties}
                                    value={formData.property_id}
                                    onChange={(val) => setFormData(prev => ({ ...prev, property_id: val }))}
                                    placeholder="Select Property (Optional)"
                                />
                            </div>

                            {/* Document Type - SearchableSelect or standard Select is fine, using Searchable for consistency */}
                            <div className="space-y-2">
                                <Label>Document Type *</Label>
                                <Select
                                    value={formData.document_type}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, document_type: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Document Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctypes.map(dt => (
                                            <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* File Upload */}
                            <div className="space-y-2">
                                <Label>Upload Document {documentId && "(Leave empty to keep existing)"} *</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition">
                                    <Input
                                        type="file"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                        {selectedFile ? (
                                            <>
                                                <FileText className="h-10 w-10 text-emerald-500 mb-2" />
                                                <span className="text-sm font-medium text-emerald-700">{selectedFile.name}</span>
                                                <span className="text-xs text-gray-500">Click to change</span>
                                            </>
                                        ) : (
                                            <>
                                                <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                                                <span className="text-sm font-medium text-gray-700">Click to upload file</span>
                                                <span className="text-xs text-gray-500">PDF, Word, or Images (Max 10MB)</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {existingFile && !selectedFile && (
                                    <div className="mt-2 text-sm text-blue-600 flex items-center">
                                        <FileText className="h-4 w-4 mr-1" />
                                        Current File: <a href={`${API_BASE_URL.replace('/api', '')}/${existingFile}`} target="_blank" rel="noreferrer" className="underline hover:text-blue-800 ml-1">View File</a>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Enter any notes about this document..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate('/documents')}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {documentId ? 'Update Document' : 'Save Document'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

export default DocumentForm;
