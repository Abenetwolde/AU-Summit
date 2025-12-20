import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_JOURNALISTS } from '@/data/mock';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import auLogo from '@/assests/au.png';

export function BadgeSlipPreview() {
    const { id } = useParams();
    const navigate = useNavigate();
    const journalist = MOCK_JOURNALISTS.find(j => j.id === id);

    if (!journalist) return <div>Journalist not found</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-md mx-auto space-y-6">
                {/* Badge Slip */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
                    {/* Badge Card */}
                    <div className="relative bg-gradient-to-b from-white to-gray-50 p-8">
                        {/* Lanyard Hole */}
                        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gray-200 rounded-full shadow-inner"></div>

                        {/* Main Badge Content */}
                        <div className="mt-12 space-y-6">
                            {/* African Union Logo */}
                            <div className="flex justify-center">
                                <div className="w-28 h-28 flex items-center justify-center">
                                    <img src={auLogo} alt="African Union" className="w-full h-full object-contain" />
                                </div>
                            </div>

                            {/* African Union Text */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-green-700 tracking-wide">African Union</h1>
                                <p className="text-sm text-gray-600 mt-1">Union Africaine</p>
                            </div>

                            {/* Decorative Line */}
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                            </div>

                            {/* Photo */}
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-44 h-52 overflow-hidden rounded-xl shadow-lg ring-4 ring-green-100">
                                        <img
                                            src={journalist.photoUrl}
                                            alt={journalist.fullname}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div className="text-center px-4">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{journalist.fullname}</h2>
                            </div>

                            {/* Role */}
                            <div className="text-center">
                                <p className="text-base text-gray-600 font-medium">Journalist</p>
                            </div>

                            {/* Decorative Line */}
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                                <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
                            </div>

                            {/* PRESS Badge */}
                            <div className="mx-6">
                                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center py-5 rounded-xl shadow-lg">
                                    <h3 className="text-5xl font-black tracking-widest">PRESS</h3>
                                </div>
                            </div>

                            {/* Footer Info & QR Code */}
                            <div className="flex items-end justify-between pt-6 border-t border-gray-100">
                                <div className="text-left text-[10px] text-gray-500 space-y-0.5">
                                    <p className="font-bold text-gray-700">Event Accreditation Badge</p>
                                    <p>Valid for Official AU Events</p>
                                    <p className="font-mono uppercase">ID: {journalist.passportNo.substring(0, 8)}</p>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-2 bg-gradient-to-r from-green-600 to-green-400 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                    <div className="relative bg-white p-1 rounded-lg shadow-sm border border-gray-100 ring-1 ring-gray-50">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=AU-JOURNALIST-${journalist.id}`}
                                            alt="QR Code"
                                            className="w-16 h-16"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 print:hidden">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/au-admin/journalists')}
                    >
                        Back
                    </Button>
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" />
                        Print Badge
                    </Button>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:rounded-none {
                        border-radius: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
