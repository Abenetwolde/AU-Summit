import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Minus, CheckCircle, Clock, XCircle, FileText, Globe, Building2, MapPin, Camera, Mic, Type } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// Mock Data
const REGISTRATION_DATA = [
    { name: 'Mon', approved: 20, rejected: 10 },
    { name: 'Tue', approved: 50, rejected: 20 },
    { name: 'Wed', approved: 25, rejected: 15 },
    { name: 'Thu', approved: 35, rejected: 25 },
    { name: 'Fri', approved: 60, rejected: 30 },
    { name: 'Sat', approved: 30, rejected: 10 },
    { name: 'Sun', approved: 45, rejected: 20 },
];

const ORG_TYPE_DATA = [
    { label: 'AU Member State', percentage: 45, color: 'bg-emerald-500' },
    { label: 'Local Media', percentage: 25, color: 'bg-blue-500' },
    { label: 'International Media', percentage: 20, color: 'bg-purple-500' },
    { label: 'NGO / Inter-governmental', percentage: 10, color: 'bg-amber-500' },
];

const MEDIA_TYPE_COUNTS = [
    { type: 'Text / Print', count: 42, icon: Type, color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'Photography', count: 28, icon: Camera, color: 'text-purple-600', bg: 'bg-purple-50' },
    { type: 'Broadcast / TV', count: 22, icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50' },
    { type: 'Online / Digital', count: 18, icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const COUNTRIES_LIST = [
    { name: 'Nigeria', count: 18, color: '#3b82f6', code: 'NGA' },
    { name: 'Ethiopia', count: 15, color: '#8b5cf6', code: 'ETH' },
    { name: 'Kenya', count: 12, color: '#22c55e', code: 'KEN' },
    { name: 'South Africa', count: 14, color: '#f97316', code: 'ZAF' },
    { name: 'Ghana', count: 9, color: '#ef4444', code: 'GHA' },
    { name: 'Tanzania', count: 8, color: '#06b6d4', code: 'TZA' },
    { name: 'Uganda', count: 7, color: '#84cc16', code: 'UGA' },
    { name: 'Rwanda', count: 6, color: '#a855f7', code: 'RWA' },
    { name: 'Egypt', count: 11, color: '#eab308', code: 'EGY' },
    { name: 'Morocco', count: 10, color: '#14b8a6', code: 'MAR' },
];

const countryDataMap = new Map(COUNTRIES_LIST.map(c => [c.code, c]));
const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

export function SuperAdminDashboard() {
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 1));

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-sans text-gray-900">System Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time media accreditation monitoring and analytics</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 font-bold border-gray-200">
                        <FileText className="h-4 w-4" />
                        Export Report
                    </Button>
                    <Button className="bg-[#009b4d] hover:bg-[#007a3d] font-bold gap-2 shadow-md shadow-green-200">
                        <Plus className="h-4 w-4" />
                        Manage Events
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Registered', value: '112', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Fully Accredited', value: '58', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Application', value: '34', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Total Rejected', value: '12', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", stat.bg)}>
                                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Secondary Stats & Viz */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Media Organization Types */}
                    <Card className="border-0 shadow-sm h-full">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                </div>
                                <CardTitle className="text-lg font-bold">Organization Diversity</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            {ORG_TYPE_DATA.map((org, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-600">{org.label}</span>
                                        <span className="text-gray-900">{org.percentage}%</span>
                                    </div>
                                    <Progress value={org.percentage} className="h-2" indicatorClassName={org.color} />
                                </div>
                            ))}

                            <div className="pt-6 border-t mt-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    {MEDIA_TYPE_COUNTS.map((m, i) => (
                                        <div key={i} className={cn("p-4 rounded-xl space-y-1", m.bg)}>
                                            <div className="flex items-center gap-2">
                                                <m.icon className={cn("h-4 w-4", m.color)} />
                                                <span className="text-[10px] font-black uppercase text-gray-400">{m.type}</span>
                                            </div>
                                            <p className="text-xl font-bold text-gray-900">{m.count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Map Section */}
                <Card className="border-0 shadow-sm xl:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Globe className="h-4 w-4 text-gray-600" />
                            </div>
                            <CardTitle className="text-lg font-bold">Global Presence</CardTitle>
                        </div>
                        <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                                <Minus className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="h-[420px] relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                            <ComposableMap
                                projection="geoMercator"
                                projectionConfig={{ scale: 380, center: [20, 0] }}
                                style={{ width: "100%", height: "100%" }}
                            >
                                <ZoomableGroup zoom={zoom}>
                                    <Geographies geography={GEO_URL}>
                                        {({ geographies }) => geographies.map((geo) => {
                                            const countryData = countryDataMap.get(geo.id);
                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    onMouseEnter={() => setHoveredCountry(`${geo.properties.name}${countryData ? `: ${countryData.count}` : ''}`)}
                                                    onMouseLeave={() => setHoveredCountry(null)}
                                                    fill={countryData ? countryData.color : "#e2e8f0"}
                                                    stroke="#ffffff"
                                                    strokeWidth={0.5}
                                                    className="outline-none hover:brightness-95 transition-all cursor-pointer"
                                                />
                                            );
                                        })}
                                    </Geographies>
                                </ZoomableGroup>
                            </ComposableMap>
                            {hoveredCountry && (
                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-xl border rounded-xl px-4 py-2 text-sm font-black text-gray-900">
                                    {hoveredCountry}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Analytics Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="border-0 shadow-sm lg:col-span-3">
                    <CardHeader className="flex flex-row items-baseline justify-between pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <MapPin className="h-4 w-4 text-gray-600" />
                            </div>
                            <CardTitle className="text-lg font-bold">Weekly Activity</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Approved</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-400" /> Rejected</div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={REGISTRATION_DATA}>
                                    <defs>
                                        <linearGradient id="colApp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colRej" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="approved" stroke="#3b82f6" strokeWidth={3} fill="url(#colApp)" />
                                    <Area type="monotone" dataKey="rejected" stroke="#f43f5e" strokeWidth={3} fill="url(#colRej)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Countries List */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Top Origins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {COUNTRIES_LIST.slice(0, 5).map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                        <span className="text-sm font-bold text-gray-700">{c.name}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{c.count}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 text-xs font-black text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            VIEW FULL REPORT
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}