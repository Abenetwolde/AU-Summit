import { useParams, useSearchParams } from 'react-router-dom';
import { useGetPublicBadgeProfileByAppIdQuery } from '@/store/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, User, Loader2, XCircle, Building2, BadgeCheck, IdCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JournalistVerification() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const memberId = searchParams.get('memberId');
    const { data: journalist, isLoading, error } = useGetPublicBadgeProfileByAppIdQuery(
        memberId ? { applicationId: id || '', memberId } : (id || '')
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
                        <ShieldCheck className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-slate-500 font-bold tracking-tight animate-pulse">VERIFYING CREDENTIALS...</p>
                </div>
            </div>
        );
    }

    if (error || !journalist) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-0 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden">
                    <div className="bg-red-500 h-2" />
                    <CardContent className="pt-12 pb-10 text-center space-y-6">
                        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-slate-900 leading-none">Access Denied</h1>
                            <p className="text-slate-500 font-medium px-6">
                                This credential could not be verified. It may be invalid, expired, or revoked.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Try Again
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isVerified = journalist.status === 'APPROVED';

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-3 py-6 sm:p-4 md:p-8">
            <div className="max-w-md w-full space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-700">
                {/* Branding */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900">VERIFY<span className="text-primary">PRESS</span></span>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="border-0 shadow-[0_30px_60px_rgba(0,0,0,0.12)] rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-white">
                    {/* Status Header */}
                    <div className={cn(
                        "py-4 px-4 sm:py-6 sm:px-8 flex items-center justify-between",
                        isVerified ? "bg-emerald-500" : "bg-amber-500"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <span className="text-white font-black uppercase tracking-widest text-xs sm:text-sm">
                                {journalist.isCrewMember ? "VERIFIED CREW" : "VERIFIED MEDIA"}
                            </span>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    </div>

                    <CardContent className="p-0">
                        {/* Profile Section */}
                        <div className="p-4 sm:p-8 text-center border-b border-slate-50">
                            <div className="relative inline-block mb-4 sm:mb-6">
                                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-2xl ring-4 ring-white ring-offset-4 ring-offset-slate-50">
                                    {journalist.photoUrl ? (
                                        <img src={journalist.photoUrl} alt={journalist.fullName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <User className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                {isVerified && (
                                    <div className="absolute -bottom-2 -right-2 h-8 w-8 sm:h-10 sm:w-10 bg-emerald-500 border-3 sm:border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                    {journalist.fullName}
                                </h2>
                                <p className="text-primary font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                                    {journalist.title}
                                </p>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="p-4 sm:p-8 space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-3.5 sm:gap-5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Media Affiliation</p>
                                    <p className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{journalist.organization}</p>
                                </div>
                            </div>

                            {journalist.passportNumber && (
                                <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                        <IdCard className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Passport Number</p>
                                        <p className="font-mono font-bold text-slate-900">{journalist.passportNumber}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                    <ShieldCheck className="h-6 w-6 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Credential ID</p>
                                    <p className="font-mono font-bold text-slate-900">
                                        {journalist.isCrewMember
                                            ? `VER-PER-${String(journalist.applicationId || id).padStart(6, '0')}-M${journalist.id}`
                                            : `VER-PER-${String(journalist.id || id).padStart(6, '0')}`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 pt-0 text-center">
                            <div className="py-6 px-4 bg-slate-900 rounded-[2rem] space-y-3">
                                <p className="text-white font-bold leading-snug">
                                    Authorized Personnel
                                </p>
                                <div className="h-1 w-12 bg-primary mx-auto rounded-full" />
                                <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                                    Secure Verification System
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="px-6 text-center space-y-4">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        This verification portal is an official service for verifying authorized personnel.
                        Unauthorized use or tampering with this system is strictly prohibited.

                    </p>
                </div>
            </div>
        </div>
    );
}
