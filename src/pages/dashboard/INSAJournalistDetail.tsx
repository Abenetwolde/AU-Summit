import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { User, FileText, Briefcase, Check, X, ShieldCheck, Download } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { EquipmentVerification } from '@/components/EquipmentVerification';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { toast } from 'sonner';
import { sendApprovalEmail } from '@/lib/emailService';

export function INSAJournalistDetail() {
    const { id } = useParams();
    const journalist = MOCK_JOURNALISTS.find(j => j.id === id);
    const countryName = (code: string) => en[code as keyof typeof en] || code;
    const [showSystemCheck, setShowSystemCheck] = useState(false);
    const { user } = useAuth();
    const isReadOnly = user?.role !== UserRole.INSA_OFFICER;

    if (!journalist) return <div>Journalist not found</div>;

    const dummyEquipment = [
        { type: 'Camera Body', model: 'Sony A7S III', status: 'Approved' as const },
        { type: 'Drone', model: 'DJI Mavic 3 Pro', category: 'Category B', weight: '958g', frequency: '2.4GHz / 5.8GHz', status: 'Pending' as const },
        { type: 'Lens', model: 'Sony FE 70-200mm GM', status: 'Approved' as const }
    ];

    const handleGrantClearance = async () => {
        setShowSystemCheck(true);
        toast.promise(sendApprovalEmail(journalist.fullname), {
            loading: 'Sending approval notification...',
            success: 'Notification email sent successfully!',
            error: 'Failed to send notification email'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Security Clearance Review</h2>
                    <p className="text-gray-500 text-sm">INSA specialized equipment and background verification</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => exportJournalistDetailToPDF(journalist)}
                    className="gap-2 font-bold border-gray-200"
                >
                    <Download className="h-4 w-4" />
                    Export Dossier
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content - Left */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Basic Info Card */}
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gray-200 border-2 border-primary/10">
                                <img src={journalist.photoUrl} alt={journalist.fullname} className="h-full w-full object-cover" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-gray-900">{journalist.fullname}</h3>
                                <div className="text-gray-500 text-sm flex flex-col gap-1.5 mt-2">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">{journalist.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl leading-none">{getFlagEmoji(journalist.country)}</span>
                                        <span className="font-medium">{countryName(journalist.country)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase">Level 2 Review</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="personal" className="w-full">
                        <div className="bg-white rounded-xl p-1 shadow-sm mb-4 border border-gray-100">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none px-4">
                                <TabsTrigger value="personal" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-3 px-0 gap-2 font-bold text-gray-500 transition-all">
                                    <User className="h-4 w-4" /> Personal
                                </TabsTrigger>
                                <TabsTrigger value="passport" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-3 px-0 gap-2 font-bold text-gray-500 transition-all">
                                    <FileText className="h-4 w-4" /> Security Docs
                                </TabsTrigger>
                                <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-3 px-0 gap-2 font-bold text-gray-500 transition-all">
                                    <Briefcase className="h-4 w-4" /> Media credentials
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Contents remain largely the same, just keeping it consistent */}
                        <TabsContent value="personal">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FULL NAME</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.fullname}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DATE OF BIRTH</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.dob || '04 Dec 1990'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GENDER</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.gender || 'Female'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NATIONALITY</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{countryName(journalist.country)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="passport">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardContent className="space-y-6 p-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PASSPORT NO</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">{journalist.passportNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">EXPIRY</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">10 May 2033</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 transition-hover hover:bg-blue-100/50 cursor-pointer">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <FileText className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-blue-900">Passport Bio Page</p>
                                                <p className="text-[10px] font-black text-blue-400 uppercase">IMAGE • 512KB</p>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4 transition-hover hover:bg-amber-100/50 cursor-pointer">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <ShieldCheck className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-amber-900">Security Clearance Form</p>
                                                <p className="text-[10px] font-black text-amber-400 uppercase">PDF • 1.2MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Equipment Verification */}
                    <EquipmentVerification
                        equipment={dummyEquipment}
                        showActions={!isReadOnly}
                    />
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white border-0 shadow-sm overflow-hidden">
                        <div className="h-2 bg-primary" />
                        <CardHeader className="pb-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-900">Security Verdict</h3>
                                    <p className="text-xs text-gray-500 leading-snug font-medium">Final approval for equipment and personnel security clearance.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />

                            <div className="p-4 bg-gray-50 rounded-xl space-y-3 mb-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Background Status</span>
                                    <span className="text-emerald-600 font-black text-[10px] uppercase bg-emerald-100 px-2 py-0.5 rounded">CLEAN</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Equipment Type</span>
                                    <span className="text-amber-600 font-black text-[10px] uppercase bg-amber-100 px-2 py-0.5 rounded">DRONE INCLUDED</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 font-black h-12 shadow-lg shadow-blue-100 tracking-wide"
                                onClick={handleGrantClearance}
                                disabled={isReadOnly}
                            >
                                <Check className="h-5 w-5 mr-2" /> GRANT SECURITY CLEARANCE
                            </Button>
                            <Button
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-black h-12 shadow-none border border-rose-100 tracking-wide"
                                disabled={isReadOnly}
                            >
                                <X className="h-5 w-5 mr-2" /> DENY ACCESS
                            </Button>

                            <p className="text-[10px] font-black text-center text-gray-400 uppercase tracking-widest pt-2">Ref: INSA-ACCR-2025-0982</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
                            <h3 className="font-bold text-gray-900">Security Checklist</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-md border-2 border-primary bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                                <label className="text-sm text-gray-700 font-bold">Security Background Check Cleared</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-md border-2 border-gray-200" />
                                <label className="text-sm text-gray-500 font-medium">Restricted Area Access Approved</label>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-md border-2 border-gray-200" />
                                <label className="text-sm text-gray-500 font-medium">Communication Frequencies Verified</label>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
