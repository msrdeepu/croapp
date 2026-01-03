import { useState, useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { SearchableSelect } from 'src/components/ui/searchable-select';
import { Textarea } from 'src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from 'src/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert';
import { Card, CardContent } from 'src/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface VentureFormProps {
    initialData?: any;
    onSuccess: (data: any) => void;
    onCancel: () => void;
}

const VentureForm: React.FC<VentureFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        code: '',
        title: '',
        slug: '',
        location: '',
        branch_id: '',
        address: '',
        status: '',
        mapurl: '',
        height: '',
        width: '',
        access: '',
        layout: '',
        meta_title: '',
        meta_description: '',
        meta_keyword: '',
        enabled: '1',
        landbudget: '',
        body: '',
        extrabody: '',
        css: '',
        details: '',
        // File inputs will be handled separately in submission
    });

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        image: null,
        banner: null,
        map: null,
        lmap: null
    });

    const [formOptions, setFormOptions] = useState<{
        branches: any[];
        settings: any[];
    }>({ branches: [], settings: [] });

    // Fetch dropdown options and initial code
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ventures/form-data`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    // Recover from garbage prefix
                    try {
                        const firstBrace = text.indexOf('{');
                        const lastBrace = text.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1) {
                            const jsonStr = text.substring(firstBrace, lastBrace + 1);
                            data = JSON.parse(jsonStr);
                        } else throw e;
                    } catch (e2) {
                        console.error("JSON Parse Error in form options", e2);
                        return; // Fail silently or set empty
                    }
                }

                if (data.status) {
                    setFormOptions({
                        branches: data.branches,
                        settings: data.settings
                    });
                    if (!initialData) {
                        setFormData((prev: any) => ({ ...prev, code: data.new_code }));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch form options", err);
            }
        };
        fetchOptions();
    }, [token, initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                enabled: initialData.enabled.toString()
            });
        }
    }, [initialData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            // Append all text fields
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key] || '');
            });

            // Append files if selected
            Object.keys(files).forEach(key => {
                if (files[key]) {
                    data.append(key, files[key]!);
                }
            });

            // Method spoofing for update if needed, though we use POST for creation
            if (initialData) {
                data.append('_method', 'PATCH');
            }

            const url = initialData
                ? `${API_BASE_URL}/ventures/${initialData.id}`
                : `${API_BASE_URL}/ventures`;

            const response = await fetch(url, {
                method: 'POST', // Always POST for FormData with files
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                    // 'Content-Type': 'multipart/form-data' // Let browser set this
                },
                body: data
            });

            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // Recover from garbage prefix
                try {
                    const firstBrace = text.indexOf('{');
                    const lastBrace = text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1) {
                        const jsonStr = text.substring(firstBrace, lastBrace + 1);
                        result = JSON.parse(jsonStr);
                    } else throw e;
                } catch (e2) {
                    console.error("JSON Parse Error in submit", e2);
                    setError('Failed to parse server response');
                    return;
                }
            }

            if (result.status) {
                onSuccess(result.data);
            } else {
                setError(result.message || 'Operation failed');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label>Code *</Label>
                            <div className="font-mono text-sm mb-1">{formData.code}</div>
                            <Input
                                type="hidden"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter Venture Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>URL / Slug</Label>
                            <Input
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="page-url-slug"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Location *</Label>
                            <Input
                                required
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Enter Location"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Branch *</Label>
                            <SearchableSelect
                                value={formData.branch_id.toString()}
                                onChange={val => setFormData({ ...formData, branch_id: val })}
                                options={formOptions.branches.map((b: any) => ({
                                    value: b.id.toString(),
                                    label: b.location
                                }))}
                                placeholder="Select Branch"
                                searchPlaceholder="Search branch..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Location Image</Label>
                            <Input type="file" onChange={e => handleFileChange(e, 'image')} accept="image/*" />
                            {initialData?.image_url && (
                                <img src={initialData.image_url} alt="Location" className="h-20 object-cover rounded mt-2" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Layout Map</Label>
                            <Input type="file" onChange={e => handleFileChange(e, 'map')} accept="image/*" />
                            {initialData?.map_url && (
                                <img src={initialData.map_url} alt="Map" className="h-20 object-cover rounded mt-2" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Banner</Label>
                            <Input type="file" onChange={e => handleFileChange(e, 'banner')} accept="image/*" />
                            {initialData?.banner_url && (
                                <img src={initialData.banner_url} alt="Banner" className="h-20 object-cover rounded mt-2" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Large Map</Label>
                            <Input type="file" onChange={e => handleFileChange(e, 'lmap')} accept="image/*" />
                            {initialData?.lmap_url && (
                                <img src={initialData.lmap_url} alt="Large Map" className="h-20 object-cover rounded mt-2" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Textarea
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column */}
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label>Status *</Label>
                            <SearchableSelect
                                value={formData.status}
                                onChange={val => setFormData({ ...formData, status: val })}
                                options={formOptions.settings.map((s: any) => ({
                                    value: s.name,
                                    label: s.name
                                }))}
                                placeholder="Select Status"
                                searchPlaceholder="Search status..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Map URL</Label>
                                <Input
                                    value={formData.mapurl}
                                    onChange={e => setFormData({ ...formData, mapurl: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Access</Label>
                                <SearchableSelect
                                    value={formData.access}
                                    onChange={val => setFormData({ ...formData, access: val })}
                                    options={[
                                        { value: 'Public', label: 'Public' },
                                        { value: 'Private', label: 'Private' }
                                    ]}
                                    placeholder="Select Access"
                                    searchPlaceholder="Search access..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Width</Label>
                                <Input
                                    value={formData.width}
                                    onChange={e => setFormData({ ...formData, width: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Height</Label>
                                <Input
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Page Layout</Label>
                            <SearchableSelect
                                value={formData.layout}
                                onChange={val => setFormData({ ...formData, layout: val })}
                                options={[
                                    { value: 'Default', label: 'Default' }
                                ]}
                                placeholder="Select Layout"
                                searchPlaceholder="Search layout..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>SEO Title *</Label>
                            <Input
                                required
                                value={formData.meta_title}
                                onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Description</Label>
                            <Textarea
                                value={formData.meta_description}
                                onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meta Keywords</Label>
                            <Textarea
                                value={formData.meta_keyword}
                                onChange={e => setFormData({ ...formData, meta_keyword: e.target.value })}
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Published *</Label>
                            <RadioGroup
                                value={formData.enabled}
                                onValueChange={val => setFormData({ ...formData, enabled: val })}
                                className="flex space-x-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="enabled-yes" />
                                    <Label htmlFor="enabled-yes" className="text-green-600 font-medium">YES</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="0" id="enabled-no" />
                                    <Label htmlFor="enabled-no" className="text-red-600 font-medium">NO</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="p-4 border border-blue-100 rounded bg-blue-50/50 mt-4">
                            <h5 className="font-semibold text-center mb-4">Project Budget Estimates</h5>
                            <div className="space-y-2">
                                <Label>Land Purchase</Label>
                                <Input
                                    value={formData.landbudget}
                                    onChange={e => setFormData({ ...formData, landbudget: e.target.value })}
                                    placeholder="Approx Cost"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Full Width Sections */}
            <Card>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label>Main Body</Label>
                        <Textarea
                            value={formData.body}
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                            rows={5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Extra Body</Label>
                        <Textarea
                            value={formData.extrabody}
                            onChange={e => setFormData({ ...formData, extrabody: e.target.value })}
                            rows={5}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Layout CSS</Label>
                        <Textarea
                            value={formData.css}
                            onChange={e => setFormData({ ...formData, css: e.target.value })}
                            rows={5}
                            className="font-mono text-xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Other Details</Label>
                        <Textarea
                            value={formData.details}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                            rows={5}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Venture
                </Button>
            </div>
        </form>
    );
};

export default VentureForm;
