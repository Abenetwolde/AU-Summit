import { useParams } from 'react-router-dom';
import { useGetBadgeProfileByHashQuery } from '@/store/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Calendar, Building2, User, ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PublicProfile() {
    const { hash } = useParams<{ hash: string }>();
    const { data: profile, isLoading, error } = useGetBadgeProfileByHashQuery(hash || '');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <p className="text-slate-500 font-medium font-sans">Verifying credential...</p>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <Card className="max-w-md w-full border-0 shadow-2xl">
                    <CardContent className="pt-12 pb-8 text-center space-y-4">
                        <XCircle className="h-20 w-20 text-red-500 mx-auto" />
                        <h1 className="text-2xl font-black text-slate-900 font-sans">Invalid Credential</h1>
                        <p className="text-slate-500">
                            The QR code you scanned is either invalid, expired, or has been revoked.
                            Please contact the event organizers for assistance.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isExpired = profile.expiryDate ? new Date(profile.expiryDate) < new Date() : false;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 py-12 md:p-12">
            <div className="max-w-md w-full space-y-6">
                {/* Status Banner */}
                <div className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-top duration-500",
                    isExpired ? "bg-red-500 text-white" : "bg-green-600 text-white"
                )}>
                    {isExpired ? <XCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                    <span className="text-lg font-black font-sans uppercase tracking-wider">
                        {isExpired ? 'EXPIRED CREDENTIAL' : 'VERIFIED OFFICIAL'}
                    </span>
                </div>

                {/* Profile Card */}
                <Card className="border-0 shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
                    <div className="h-32 bg-primary relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10" />
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                            <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-xl">
                                {profile.photoUrl ? (
                                    <img src={profile.photoUrl} alt={profile.fullName} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-slate-300" />
                                )}
                            </div>
                        </div>
                    </div>

                    <CardContent className="pt-16 pb-12 px-8 text-center">
                        <h1 className="text-3xl font-black text-slate-900 font-sans leading-tight mb-2">
                            {profile.fullName}
                        </h1>
                        <p className="text-primary font-bold text-lg mb-8">{profile.title}</p>

                        <div className="space-y-4 text-left">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <Building2 className="h-6 w-6 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Organization</p>
                                    <p className="font-bold text-slate-900">{profile.organization}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <Calendar className="h-6 w-6 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Valid Until</p>
                                    <p className="font-bold text-slate-900">
                                        {profile.expiryDate ? new Date(profile.expiryDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }) : 'Indefinite'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center">
                            <img
                                src="/apple-touch-icon.png"
                                alt="Organization Logo"
                                className="h-12 w-auto grayscale opacity-50 mb-4"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            <p className="text-[10px] text-slate-400 font-medium">
                                SECURE DIGITAL CREDENTIAL BY<br />
                                ETHIOPIAN MEDIA AUTHORITY
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-slate-400 text-xs px-8">
                    This page is an official verification tool. If the information above does not match the physical badge, the badge should be considered fraudulent.
                </p>
            </div>
        </div>
    );
}
