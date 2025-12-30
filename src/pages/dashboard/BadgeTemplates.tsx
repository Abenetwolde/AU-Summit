import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Check,
    Eye,
    Palette,
    QrCode,
    Printer,
    Settings2,
    Layout
} from 'lucide-react';
import auLogo from '@/assests/au.png';
import { cn } from '@/lib/utils';

interface BadgeTemplate {
    id: string;
    name: string;
    type: 'Standard' | 'VIP' | 'Media';
    color: string;
    description: string;
    isActive: boolean;
}

const TEMPLATES: BadgeTemplate[] = [
    {
        id: '1',
        name: 'Standard AU Badge',
        type: 'Standard',
        color: 'from-green-600 to-green-700',
        description: 'The official standard badge for AU events, featuring QR security and standard branding.',
        isActive: true,
    },
    {
        id: '2',
        name: 'VIP / Delegation Badge',
        type: 'VIP',
        color: 'from-amber-500 to-amber-600',
        description: 'Gold-themed minimalist design for high-level delegates, VIPs, and official missions.',
        isActive: false,
    },
    {
        id: '3',
        name: 'Press / Media Badge',
        type: 'Media',
        color: 'from-blue-600 to-blue-700',
        description: 'Blue-themed vibrant design optimized for fast identification of media and technical personnel.',
        isActive: false,
    },
];

export function BadgeTemplates() {
    const [badges, setBadges] = useState<BadgeTemplate[]>(TEMPLATES);

    const setActive = (id: string) => {
        setBadges(badges.map(b => ({ ...b, isActive: b.id === id })));
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">Badge Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage event badge designs, security features, and color variations</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-gray-200">
                        <Palette className="h-4 w-4" />
                        Customize Styles
                    </Button>
                    <Button className="bg-[#009b4d] hover:bg-[#007a3d] gap-2 shadow-md">
                        <Plus className="h-4 w-4" />
                        New Template
                    </Button>
                </div>
            </div>

            {/* Template Gallery */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {badges.map((badge) => (
                    <div key={badge.id} className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "h-3 w-3 rounded-full",
                                    badge.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
                                )}></span>
                                <span className="text-sm font-bold text-gray-700">{badge.name}</span>
                            </div>
                            {badge.isActive && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Currently Active</span>}
                        </div>

                        <Card className={cn(
                            "relative overflow-hidden transition-all duration-500 border-0 shadow-xl",
                            badge.isActive ? "ring-4 ring-green-100" : "opacity-90 hover:opacity-100"
                        )}>
                            {/* The Actual Badge Preview Component */}
                            <div className="aspect-[4/5.5] relative bg-white flex flex-col p-6 overflow-hidden">
                                {/* Badge Layout Decor */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-100 rounded-full border border-gray-200 shadow-inner"></div>

                                <div className="mt-8 flex flex-col items-center space-y-4 h-full">
                                    <img src={auLogo} alt="AU" className="h-10 object-contain" />
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest leading-none">African Union</p>
                                        <p className="text-[8px] text-gray-500">Union Africaine</p>
                                    </div>

                                    {/* Photo Placeholder */}
                                    <div className="w-32 h-40 bg-gray-100 rounded-lg border-2 border-gray-100 overflow-hidden flex items-center justify-center relative">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 bg-gray-200 rounded-full opacity-20 flex items-center justify-center">
                                                <Layout className="h-10 w-10 text-gray-400" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 h-1 bg-green-500/20 rounded-full"></div>
                                    </div>

                                    {/* Name & Role */}
                                    <div className="text-center space-y-1">
                                        <p className="font-bold text-lg text-gray-900 leading-none">John Doe</p>
                                        <p className="text-xs text-gray-500 font-medium">Official Media</p>
                                    </div>

                                    {/* Categorized Banner */}
                                    <div className={cn(
                                        "w-full py-3 px-4 rounded-xl shadow-md transform transition-all duration-500",
                                        "bg-gradient-to-r",
                                        badge.color
                                    )}>
                                        <p className="text-2xl font-black text-white text-center tracking-[0.2em] uppercase">
                                            {badge.type}
                                        </p>
                                    </div>

                                    {/* High Visibility QR Area */}
                                    <div className="flex-1 w-full flex items-end justify-between gap-4 mt-auto">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Accreditation ID</p>
                                            <p className="text-[10px] font-mono font-bold text-gray-700">AU-2025-001</p>
                                        </div>

                                        {/* Prominent QR Code */}
                                        <div className="group relative">
                                            <div className="absolute -inset-1.5 bg-gradient-to-tr from-gray-200 to-gray-100 rounded-lg blur-sm opacity-50"></div>
                                            <div className="relative bg-white p-1 rounded-lg border-2 border-gray-100 shadow-sm">
                                                <QrCode className="h-10 w-10 text-gray-900" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Background Element */}
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gray-50 rounded-full opacity-30 -z-0"></div>
                            </div>

                            {/* Card Actions overlay for non-active */}
                            {!badge.isActive && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none"></div>
                            )}
                        </Card>

                        <div className="pt-2 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-2 font-bold"
                                >
                                    <Eye className="h-4 w-4" />
                                    Preview
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-2 font-bold"
                                >
                                    <Settings2 className="h-4 w-4" />
                                    Configure
                                </Button>
                            </div>

                            {!badge.isActive ? (
                                <Button
                                    onClick={() => setActive(badge.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-10 shadow-lg font-bold"
                                >
                                    Set as Active Template
                                </Button>
                            ) : (
                                <div className="flex items-center justify-center h-10 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-bold gap-2">
                                    <Check className="h-4 w-4" /> Current Active Choice
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Theme Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                {[
                    { label: 'Security Level', value: 'High', icon: Settings2 },
                    { label: 'Total Variation', value: '12 Styles', icon: Palette },
                    { label: 'QR Scan Rate', value: '99.9%', icon: QrCode },
                    { label: 'Print Ready', value: '300 DPI', icon: Printer }
                ].map((stat, i) => (
                    <Card key={i} className="bg-white border-gray-100 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 bg-gray-50 rounded-lg">
                                <stat.icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
