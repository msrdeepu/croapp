import { useEffect, useState } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { ENDPOINTS } from 'src/config';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from 'src/components/ui/card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from 'src/components/ui/accordion';
import { Users, UserCircle, UserCheck, Shield, Award, Star } from 'lucide-react';

interface Agent {
    id: number;
    fullname: string;
    surname: string;
    agent_code: string;
    introducer_code: string;
    cadre: string;
}

interface GenerationReportData {
    counts: {
        total_agents: number;
        apms: number;
        pms: number;
        spms: number;
        dos: number;
        sdos: number;
        mds: number;
        smds: number;
        rmds: number;
        cmds: number;
    };
    agents: {
        apms: Agent[];
        pms: Agent[];
        spms: Agent[];
        dos: Agent[];
        sdos: Agent[];
        mds: Agent[];
        smds: Agent[];
        rmds: Agent[];
        cmds: Agent[];
    };
}

const MLMGenerationReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<GenerationReportData | null>(null);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await fetch(ENDPOINTS.MLM_GENERATION_REPORT, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const text = await response.text();
                    // Attempt to find the start of the JSON object, ignoring potential prefixes like '[]'
                    const jsonStart = text.indexOf('{');
                    if (jsonStart !== -1) {
                        const cleanText = text.substring(jsonStart);
                        try {
                            const result = JSON.parse(cleanText);
                            if (result.status === 'success') {
                                setReportData(result.data);
                            }
                        } catch (e) {
                            console.error("Failed to parse cleaned JSON:", e);
                        }
                    } else {
                        console.error("No JSON object found in response");
                    }
                } else {
                    const errorText = await response.text();
                    console.error("Failed to fetch MLM Generation Report:", response.status, errorText);
                }
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchReport();
    }, [token]);

    const SummaryCard = ({ title, subtitle, count, icon: Icon, colorClass }: { title: string, subtitle: string, count: number, icon: any, colorClass: string }) => (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full text-white ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg">{title}</h4>
                        <p className="text-xs text-gray-500">{subtitle}</p>
                    </div>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                    {count}
                </div>
            </CardContent>
        </Card>
    );

    if (loading) return <div className="p-6 text-center">Loading Generation Plan...</div>;
    if (!reportData) return <div className="p-6 text-center">No data availble.</div>;

    const { counts, agents } = reportData;

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-ld mb-4">Generation Plan</h2>

            {/* Total Agents */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 mb-6">
                <Card className="shadow-sm bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-600 text-white">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-blue-900">Agents</h4>
                                <p className="text-sm text-blue-700">Total List Of Team</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-900">
                            {counts.total_agents}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Tier: CMD, RMD, SMD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="CMD" subtitle="Chief Marketing Director" count={counts.cmds} icon={UserCircle} colorClass="bg-cyan-500" />
                <SummaryCard title="RMD" subtitle="Regional Marketing Director" count={counts.rmds} icon={Award} colorClass="bg-emerald-500" />
                <SummaryCard title="SMD" subtitle="Senior Marketing Director" count={counts.smds} icon={Star} colorClass="bg-emerald-600" />
            </div>

            {/* Mid Tier: MD, SDO, DO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="MD" subtitle="Marketing Director" count={counts.mds} icon={UserCheck} colorClass="bg-amber-500" />
                <SummaryCard title="SDOs" subtitle="Senior Development Officers" count={counts.sdos} icon={Users} colorClass="bg-amber-600" />
                <SummaryCard title="DOs" subtitle="Development Officers" count={counts.dos} icon={Users} colorClass="bg-amber-700" />
            </div>

            {/* Lower Tier: SPM, PM, APM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard title="SPMs" subtitle="Senior Project Managers" count={counts.spms} icon={Shield} colorClass="bg-red-500" />
                <SummaryCard title="PMs" subtitle="Project Managers" count={counts.pms} icon={Shield} colorClass="bg-red-600" />
                <SummaryCard title="APMs" subtitle="Assistant Project Managers" count={counts.apms} icon={Shield} colorClass="bg-red-700" />
            </div>


            {/* Accordion Lists */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Detailed Agent Lists</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">

                        {/* CMD */}
                        <AccordionItem value="cmd">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <UserCircle className="h-5 w-5 text-cyan-600" />
                                    <span>Chief Marketing Director - <span className="font-bold">{counts.cmds}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.cmds.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* RMD */}
                        <AccordionItem value="rmd">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-emerald-600" />
                                    <span>Regional Marketing Director - <span className="font-bold">{counts.rmds}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.rmds.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* SMD */}
                        <AccordionItem value="smd">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-emerald-700" />
                                    <span>Senior Marketing Director - <span className="font-bold">{counts.smds}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.smds.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* MD */}
                        <AccordionItem value="md">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-5 w-5 text-amber-600" />
                                    <span>Marketing Director - <span className="font-bold">{counts.mds}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.mds.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* SDO */}
                        <AccordionItem value="sdo">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-amber-700" />
                                    <span>Senior Development Officers - <span className="font-bold">{counts.sdos}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.sdos.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* DO */}
                        <AccordionItem value="do">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-amber-800" />
                                    <span>Development Officers - <span className="font-bold">{counts.dos}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.dos.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* SPM */}
                        <AccordionItem value="spm">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-600" />
                                    <span>Senior Project Managers - <span className="font-bold">{counts.spms}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.spms.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* PM */}
                        <AccordionItem value="pm">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-700" />
                                    <span>Project Managers - <span className="font-bold">{counts.pms}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.pms.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        {/* APM */}
                        <AccordionItem value="apm">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-red-800" />
                                    <span>Assistant Project Managers - <span className="font-bold">{counts.apms}</span></span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ol className="list-decimal pl-6 space-y-1 text-sm text-gray-700">
                                    {agents.apms.map(agent => (
                                        <li key={agent.id}>
                                            <span className="font-semibold">{agent.agent_code}</span> : {agent.fullname} {agent.surname} # <span className="text-gray-500">{agent.introducer_code}</span>
                                        </li>
                                    ))}
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
};

export default MLMGenerationReport;
