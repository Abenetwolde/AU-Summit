import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, FileText, Plane, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, AlertCircle } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { EquipmentVerification } from '@/components/EquipmentVerification';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';

export function JournalistProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const journalist = MOCK_JOURNALISTS.find(j => j.id === id);
    const countryName = (code: string) => en[code as keyof typeof en] || code;
    const [showSystemCheck, setShowSystemCheck] = useState(false);

    if (!journalist) return <div>Journalist not found</div>;

    const isReadOnly = user?.role === UserRole.NISS_OFFICER;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-gray-500 hover:text-gray-900"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Journalist Profile</h2>
                </div>
                <Button
                    variant="outline"
                    onClick={() => exportJournalistDetailToPDF(journalist)}
                    className="gap-2"
                >
                    <Download className="h-4 w-4" />
                    Export PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content - Left */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Basic Info Card */}
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-200">
                                <img src={journalist.photoUrl} alt={journalist.fullname} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{journalist.fullname}</h3>
                                <div className="text-gray-500 text-sm flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{journalist.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg leading-none">{getFlagEmoji(journalist.country)}</span>
                                        <span>{countryName(journalist.country)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                                <span>• CNN News</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="personal" className="w-full">
                        <div className="bg-white rounded-lg p-1 shadow-sm mb-4">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none px-4">
                                <TabsTrigger value="personal" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <User className="h-4 w-4" /> Personal Details
                                </TabsTrigger>
                                <TabsTrigger value="contact" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Phone className="h-4 w-4" /> Contact Info
                                </TabsTrigger>
                                <TabsTrigger value="passport" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <FileText className="h-4 w-4" /> Passport Info
                                </TabsTrigger>
                                <TabsTrigger value="arrival" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Plane className="h-4 w-4" /> Arrival Info
                                </TabsTrigger>
                                <TabsTrigger value="media" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Briefcase className="h-4 w-4" /> Media Accreditation
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Personal Details Content */}
                        <TabsContent value="personal">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
                                    <User className="h-5 w-5 text-blue-600" />
                                </CardHeader>
                                <CardContent className="grid grid-cols-4 gap-6 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">FULL NAME</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.fullname}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">DATE OF BIRTH</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.dob || '04 Dec 1990'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">GENDER</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.gender || 'Female'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">NATIONALITY</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{countryName(journalist.country)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">RESIDENTIAL ADDRESS</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">Nairobi</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Contact Info Content */}
                        <TabsContent value="contact">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Contact Info</CardTitle>
                                    <Phone className="h-5 w-5 text-teal-500" />
                                </CardHeader>
                                <CardContent className="grid grid-cols-4 gap-6 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Personal Email</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">sara23@gmail.com</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Personal Phone</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.contact || '+254879613395'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Passport Info Content */}
                        <TabsContent value="passport">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Passport Information</CardTitle>
                                    <FileText className="h-5 w-5 text-yellow-500" />
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="grid grid-cols-4 gap-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">PASSPORT NUMBER</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">{journalist.passportNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">ISSUING COUNTRY</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">{countryName(journalist.country)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">DATE OF ISSUE</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">10 May 2023</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">DATE OF EXPIRY</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">10 May 2033</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">PASSPORT BIO PAGE</p>
                                        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-center gap-3 w-fit">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <p className="text-sm font-bold text-blue-900">Passport bio page.jpg</p>
                                                <p className="text-xs text-blue-400">512KB</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Arrival Info Content */}
                        <TabsContent value="arrival">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Arrival Information</CardTitle>
                                    <Plane className="h-5 w-5 text-green-500" />
                                </CardHeader>
                                <CardContent className="grid grid-cols-4 gap-6 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">EXPECTED ARRIVAL</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">04 DEC 2025</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">EXPECTED DEPARTURE</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">07 Dec 2025</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">AIRLINE</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">Ethiopian Airlines</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">FLIGHT NO</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">ET 404</p>
                                    </div>
                                    <div className="col-span-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase">ACCOMMODATION</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{journalist.accommodation || 'Ethiopian Skylight Hotel, Bole International Airport, Addis Ababa'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Media Accreditation Content */}
                        <TabsContent value="media">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Media Accreditation</CardTitle>
                                    <Briefcase className="h-5 w-5 text-purple-500" />
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">ORGANIZATION</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">CNN NEWS</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">ROLE TITLE</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">{journalist.role}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">ASSIGNMENT</p>
                                            <p className="text-sm font-bold text-gray-900 mt-1">Broadcasting</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">ASSIGNMENT LETTER</p>
                                        <div className="bg-red-50 border border-red-100 rounded-md p-3 flex items-center gap-3 w-fit">
                                            <FileText className="h-8 w-8 text-red-500" />
                                            <div>
                                                <p className="text-sm font-bold text-red-900">Letter_of_Assignment.pdf</p>
                                                <p className="text-xs text-red-400">5MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Equipment List - Enhanced */}
                    <EquipmentVerification
                        equipment={[
                            { type: 'Lens', model: 'Sony FE 24-70mm GM' },
                            { type: 'Drone', model: 'Sony A7S III' },
                            { type: 'Drone', model: 'Rode VideoMic Pro' },
                        ]}
                        onApprove={() => console.log('Equipment approved')}
                        onReject={() => console.log('Equipment rejected')}
                        showActions={user?.role === UserRole.CUSTOMS_OFFICER}
                    />
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Decision Panel</h3>
                                    <p className="text-xs text-gray-500 leading-tight">Review carefully before taking action.</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />

                            {user?.role === UserRole.CUSTOMS_OFFICER ? (
                                <>
                                    <Button
                                        className="w-full bg-[#009b4d] hover:bg-[#007a3d] font-bold shadow-md"
                                        onClick={() => setShowSystemCheck(true)}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Approve Visa
                                    </Button>
                                    <Button className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold shadow-none">
                                        <X className="h-4 w-4 mr-2" /> Reject Application
                                    </Button>
                                </>
                            ) : (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col items-center gap-3 text-center">
                                    <AlertCircle className="h-8 w-8 text-amber-500" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-amber-900">Restricted Access</p>
                                        <p className="text-xs text-amber-700 leading-relaxed">
                                            Visa approval and equipment verification are restricted to Customs Officers.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full text-amber-700 border-amber-200 hover:bg-amber-100 h-9 font-bold" disabled>
                                        Actions Locked
                                    </Button>
                                </div>
                            )}

                            {isReadOnly && (
                                <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-600 text-center">
                                    Read-only access. Actions are disabled.
                                </div>
                            )}

                            <p className="text-xs text-center text-gray-400">Applied: 15 Dec 2024</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
                            <h3 className="font-bold text-gray-900">Verification Checklist</h3>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={user?.role !== UserRole.CUSTOMS_OFFICER}
                                />
                                <label className="text-sm text-gray-600 font-medium">Passport validity &gt; 2 months</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={user?.role !== UserRole.CUSTOMS_OFFICER}
                                />
                                <label className="text-sm text-gray-600 font-medium">Press Card Verified</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={user?.role !== UserRole.CUSTOMS_OFFICER}
                                />
                                <label className="text-sm text-gray-600 font-medium">Photo meets requirements</label>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
