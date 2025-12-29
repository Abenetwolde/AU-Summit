import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, FileText, Plane, Briefcase, Check, X, ShieldCheck, Download, ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { getFlagEmoji } from '@/lib/utils';
import en from 'react-phone-number-input/locale/en';
import { SystemCheckSuccess } from '@/components/SystemCheckSuccess';
import { exportJournalistDetailToPDF } from '@/lib/export-utils';
import { useAuth, UserRole } from '@/auth/context';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { useUpdateApplicationStatusMutation, Equipment as EquipmentType } from '@/store/services/api';
import { toast } from 'sonner';

export function JournalistProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Status Mutation
    const [updateStatus, { isLoading: isStatusUpdating }] = useUpdateApplicationStatusMutation();

    const [application, setApplication] = useState<any>(null);

    useEffect(() => {
        if (location.state?.application) {
            setApplication(location.state.application);
        } else {
            // Robust Fallback to Mock Data to "restore static data" appearance if API data is missing
            const mock = MOCK_JOURNALISTS.find(j => j.id === id);
            if (mock) {
                setApplication({
                    id: mock.id,
                    formData: {
                        first_name: mock.fullname.split(' ')[0],
                        last_name: mock.fullname.split(' ').slice(1).join(' '),
                        occupation: mock.role,
                        country: mock.country,
                        passport_number: mock.passportNo,
                        city: 'Addis Ababa', // Mock static
                        email: 'journalist@example.com', // Mock static
                        phone: mock.contact,
                        citizenship: mock.country,
                        arrival_date: '2024-01-20',
                        departure_date: '2024-02-10',
                        address_line_1: 'Bole Road',
                        place_of_birth: 'London',
                        airlines_and_flight_number: 'ET 701',
                        accommodation_details: 'Skylight Hotel'
                    },
                    user: { fullName: mock.fullname },
                    equipment: [],
                    status: mock.status,
                    createdAt: new Date().toISOString()
                });
            }
        }
    }, [location.state, id]);


    const [showSystemCheck, setShowSystemCheck] = useState(false);
    const countryName = (code: string) => code ? (en[code as keyof typeof en] || code) : 'Unknown';

    const handleApprove = async () => {
        if (!application) return;
        try {
            await updateStatus({ applicationId: Number(application.id), status: 'APPROVED' }).unwrap();
            toast.success("Application Approved Successfully");
            setApplication({ ...application, status: 'APPROVED' });
        } catch (err) {
            toast.error("Failed to approve application");
        }
    };

    if (!application) {
        return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;
    }

    // Data Mapping - Extensive
    const formData = application.formData || {};
    const equipmentList: EquipmentType[] = application.equipment || [];

    const fullname = formData.first_name
        ? `${formData.first_name} ${formData.last_name || ''}`
        : (application.user?.fullName || 'Unknown');

    const roleTitle = formData.occupation || 'Journalist';
    const country = formData.country || 'ET';
    const photoUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop";
    const organization = "News Org"; // Placeholder or from API if avail

    // Authorization
    const canApprove = user?.role === UserRole.SUPER_ADMIN ||
        user?.role === UserRole.ICS_OFFICER ||
        user?.role === UserRole.EMA_OFFICER;
    const isCustoms = user?.role === UserRole.CUSTOMS_OFFICER;

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
                    onClick={() => exportJournalistDetailToPDF(application as any)}
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
                                <img src={photoUrl} alt={fullname} className="h-full w-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{fullname}</h3>
                                <div className="text-gray-500 text-sm flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="h-3 w-3" />
                                        <span>{roleTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg leading-none">{getFlagEmoji(country)}</span>
                                        <span>{countryName(country)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                                <span>• {organization}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs */}
                    <Tabs defaultValue="personal" className="w-full">
                        <div className="bg-white rounded-lg p-1 shadow-sm mb-4">
                            <TabsList className="w-full justify-start bg-transparent h-auto p-0 gap-6 border-b rounded-none px-4 flex-wrap">
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
                                <TabsTrigger value="equipment" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3 px-0 gap-2 font-bold text-gray-500">
                                    <Briefcase className="h-4 w-4" /> Equipment
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
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">FULL NAME</p><p className="text-sm font-bold text-gray-900 mt-1">{fullname}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">DOB</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.date_of_birth || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">GENDER</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.gender || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">NATIONALITY</p><p className="text-sm font-bold text-gray-900 mt-1">{countryName(country)}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">PLACE OF BIRTH</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.place_of_birth || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">COUNTRY OF BIRTH</p><p className="text-sm font-bold text-gray-900 mt-1">{countryName(formData.country_of_birth)}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">CITIZENSHIP</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.citizenship || countryName(country)}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">OCCUPATION</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.occupation || 'N/A'}</p></div>
                                    <div className="col-span-4"><p className="text-xs font-bold text-gray-400 uppercase">ADDRESS</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.address_line_1}, {formData.address_line_2 ? `${formData.address_line_2}, ` : ''}{formData.city}, {formData.state_province_region ? `${formData.state_province_region}, ` : ''}{formData.zip_postal_code}</p></div>
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
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">EMAIL</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.email}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">PHONE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.phone}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">ZIP CODE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.zip_postal_code || 'N/A'}</p></div>
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
                                <CardContent className="grid grid-cols-4 gap-6 pt-4">
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">PASSPORT NO</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.passport_number}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">ISSUING COUNTRY</p><p className="text-sm font-bold text-gray-900 mt-1">{countryName(country)}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">ISSUE DATE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.passport_issue_date || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">EXPIRY DATE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.passport_expiry_date || 'N/A'}</p></div>
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
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">ARRIVAL DATE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.arrival_date}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">DEPARTURE DATE</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.departure_date || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">FLIGHT</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.airlines_and_flight_number || 'N/A'}</p></div>
                                    <div><p className="text-xs font-bold text-gray-400 uppercase">DEPARTURE CITY</p><p className="text-sm font-bold text-gray-900 mt-1">{formData.departure_country_and_city || 'N/A'}</p></div>

                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">ACCOMMODATION</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">{formData.accommodation_details || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">SPECIAL REQUIREMENTS</p>
                                        <p className="text-sm text-gray-700 mt-1">{formData.special_requirements || 'None'}</p>
                                    </div>

                                    <div className="col-span-4 border-t pt-4 mt-2">
                                        <h4 className="text-sm font-bold mb-3 text-gray-900">Additional Declarations</h4>
                                        <div className="grid grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">HAS DRONE</p>
                                                <p className="text-sm font-bold text-gray-900 mt-1">{formData.has_drone === 'true' || formData.has_drone === true ? 'Yes' : 'No'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">DECLARATION</p>
                                                <p className="text-sm font-bold text-gray-900 mt-1">{formData.declaration_status === 'true' || formData.declaration_status === true ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Equipment Content - Prioritized */}
                        <TabsContent value="equipment">
                            <Card className="bg-white border-0 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg font-bold">Equipment Details</CardTitle>
                                    <Briefcase className="h-5 w-5 text-gray-500" />
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    {equipmentList.length === 0 ? (
                                        <p className="text-gray-500 italic">No equipment declared.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {equipmentList.map((item, idx) => (
                                                <div key={item.id || idx} className="border rounded-md p-4 bg-gray-50/50">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">TYPE</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.type}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">DESCRIPTION</p>
                                                            <p className="text-sm text-gray-900">{item.description}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">SERIAL NO.</p>
                                                            <p className="text-sm font-mono text-gray-700">{item.serialNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">VALUE</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.value} {item.currency}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">QUANTITY</p>
                                                            <p className="text-sm font-bold text-gray-900">{item.quantity}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase">STATUS</p>
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar - Decision Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-900">Decision Panel</h3>
                                    <p className="text-xs text-gray-500 leading-tight">Current Status: <span className="font-bold">{application.status}</span></p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SystemCheckSuccess show={showSystemCheck} />

                            {canApprove && (
                                <Button
                                    className="w-full bg-[#009b4d] hover:bg-[#007a3d] font-bold shadow-md"
                                    onClick={handleApprove}
                                    disabled={isStatusUpdating || application.status === 'APPROVED'}
                                >
                                    {isStatusUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                    {application.status === 'APPROVED' ? 'Approved' : 'Approve Application'}
                                </Button>
                            )}

                            {isCustoms && (
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
                            )}

                            {!canApprove && !isCustoms && (
                                <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-600 text-center">
                                    Read-only view for this role.
                                </div>
                            )}

                            <p className="text-xs text-center text-gray-400">Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
