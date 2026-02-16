import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Plus, Minus, Filter } from 'lucide-react';
import { useGetSuperAdminCountryDistributionQuery } from '@/store/services/api';
import en from 'react-phone-number-input/locale/en';
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const GEO_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// Map 2-letter codes to 3-letter codes for GeoJSON
const iso2to3: Record<string, string> = {
    'AF': 'AFG', 'AX': 'ALA', 'AL': 'ALB', 'DZ': 'DZA', 'AS': 'ASM', 'AD': 'AND', 'AO': 'AGO', 'AI': 'AIA', 'AQ': 'ATA', 'AG': 'ATG',
    'AR': 'ARG', 'AM': 'ARM', 'AW': 'ABW', 'AU': 'AUS', 'AT': 'AUT', 'AZ': 'AZE', 'BS': 'BHS', 'BH': 'BHR', 'BD': 'BGD', 'BB': 'BRB',
    'BY': 'BLR', 'BE': 'BEL', 'BZ': 'BLZ', 'BJ': 'BEN', 'BM': 'BMU', 'BT': 'BTN', 'BO': 'BOL', 'BQ': 'BES', 'BA': 'BIH', 'BW': 'BWA',
    'BV': 'BVT', 'BR': 'BRA', 'IO': 'IOT', 'BN': 'BRN', 'BG': 'BGR', 'BF': 'BFA', 'BI': 'BDI', 'CV': 'CPV', 'KH': 'KHM', 'CM': 'CMR',
    'CA': 'CAN', 'KY': 'CYM', 'CF': 'CAF', 'TD': 'TCD', 'CL': 'CHL', 'CN': 'CHN', 'CX': 'CXR', 'CC': 'CCK', 'CO': 'COL', 'KM': 'COM',
    'CD': 'COD', 'CG': 'COG', 'CK': 'COK', 'CR': 'CRI', 'CI': 'CIV', 'HR': 'HRV', 'CU': 'CUB', 'CW': 'CUW', 'CY': 'CYP', 'CZ': 'CZE',
    'DK': 'DNK', 'DJ': 'DJI', 'DM': 'DMA', 'DO': 'DOM', 'EC': 'ECU', 'EG': 'EGY', 'SV': 'SLV', 'GQ': 'GNQ', 'ER': 'ERI', 'EE': 'EST',
    'SZ': 'SWZ', 'ET': 'ETH', 'FK': 'FLK', 'FO': 'FRO', 'FJ': 'FJI', 'FI': 'FIN', 'FR': 'FRA', 'GF': 'GUF', 'PF': 'PYF', 'TF': 'ATF',
    'GA': 'GAB', 'GM': 'GMB', 'GE': 'GEO', 'DE': 'DEU', 'GH': 'GHA', 'GI': 'GIB', 'GR': 'GRC', 'GL': 'GRL', 'GD': 'GRD', 'GP': 'GLP',
    'GU': 'GUM', 'GT': 'GTM', 'GG': 'GGY', 'GN': 'GIN', 'GW': 'GNB', 'GY': 'GUY', 'HT': 'HTI', 'HM': 'HMD', 'VA': 'VAT', 'HN': 'HND',
    'HK': 'HKG', 'HU': 'HUN', 'IS': 'ISL', 'IN': 'IND', 'ID': 'IDN', 'IR': 'IRN', 'IQ': 'IRQ', 'IE': 'IRL', 'IM': 'IMN', 'IL': 'ISR',
    'IT': 'ITA', 'JM': 'JAM', 'JP': 'JPN', 'JE': 'JEY', 'JO': 'JOR', 'KZ': 'KAZ', 'KE': 'KEN', 'KI': 'KIR', 'KP': 'PRK', 'KR': 'KOR',
    'KW': 'KWT', 'KG': 'KGZ', 'LA': 'LAO', 'LV': 'LVA', 'LB': 'LBN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'LI': 'LIE', 'LT': 'LTU',
    'LU': 'LUX', 'MO': 'MAC', 'MG': 'MDG', 'MW': 'MWI', 'MY': 'MYS', 'MV': 'MDV', 'ML': 'MLI', 'MT': 'MLT', 'MH': 'MHL', 'MQ': 'MTQ',
    'MR': 'MRT', 'MU': 'MUS', 'YT': 'MYT', 'MX': 'MEX', 'FM': 'FSM', 'MD': 'MDA', 'MC': 'MCO', 'MN': 'MNG', 'ME': 'MNE', 'MS': 'MSR',
    'MA': 'MAR', 'MZ': 'MOZ', 'MM': 'MMR', 'NA': 'NAM', 'NR': 'NRU', 'NP': 'NPL', 'NL': 'NLD', 'NC': 'NCL', 'NZ': 'NZL', 'NI': 'NIC',
    'NE': 'NER', 'NG': 'NGA', 'NU': 'NIU', 'NF': 'NFK', 'MP': 'MNP', 'NO': 'NOR', 'OM': 'OMN', 'PK': 'PAK', 'PW': 'PLW', 'PS': 'PSE',
    'PA': 'PAN', 'PG': 'PNG', 'PY': 'PRY', 'PE': 'PER', 'PH': 'PHL', 'PN': 'PCN', 'PL': 'POL', 'PT': 'PRT', 'PR': 'PRI', 'QA': 'QAT',
    'RE': 'REU', 'RO': 'ROU', 'RU': 'RUS', 'RW': 'RWA', 'BL': 'BLM', 'SH': 'SHN', 'KN': 'KNA', 'LC': 'LCA', 'MF': 'MAF', 'PM': 'SPM',
    'VC': 'VCT', 'WS': 'WSM', 'SM': 'SMR', 'ST': 'STP', 'SA': 'SAU', 'SN': 'SEN', 'RS': 'SRB', 'SC': 'SYC', 'SL': 'SLE', 'SG': 'SGP',
    'SX': 'SXM', 'SK': 'SVK', 'SI': 'SVN', 'SB': 'SLB', 'SO': 'SOM', 'ZA': 'ZAF', 'GS': 'SGS', 'SS': 'SSD', 'ES': 'ESP', 'LK': 'LKA',
    'SD': 'SDN', 'SR': 'SUR', 'SJ': 'SJM', 'SE': 'SWE', 'CH': 'CHE', 'SY': 'SYR', 'TW': 'TWN', 'TJ': 'TJK', 'TZ': 'TZA', 'TH': 'THA',
    'TL': 'TLS', 'TG': 'TGO', 'TK': 'TKL', 'TO': 'TON', 'TT': 'TTO', 'TN': 'TUN', 'TR': 'TUR', 'TM': 'TKM', 'TC': 'TCA', 'TV': 'TUV',
    'UG': 'UGA', 'UA': 'UKR', 'AE': 'ARE', 'GB': 'GBR', 'UM': 'UMI', 'US': 'USA', 'UY': 'URY', 'UZ': 'UZB', 'VU': 'VUT', 'VE': 'VEN',
    'VN': 'VNM', 'VG': 'VGB', 'VI': 'VIR', 'WF': 'WLF', 'EH': 'ESH', 'YE': 'YEM', 'ZM': 'ZMB', 'ZW': 'ZWE'
};

export default function CountryDistributionWidget() {
    const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'ENTERED' | 'EXITED'>('ALL');
    const [zoom, setZoom] = useState(1);
    const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

    const { data: countryData = [], isLoading } = useGetSuperAdminCountryDistributionQuery({ filter });

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 8));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 1));

    const COUNTRY_PALETTE = [
        { h: 210, s: 80 }, // Blue
        { h: 140, s: 75 }, // Green
        { h: 25, s: 90 },  // Orange
        { h: 280, s: 65 }, // Purple
        { h: 350, s: 85 }, // Red
        { h: 190, s: 90 }, // Cyan
        { h: 10, s: 85 },  // Coral
        { h: 160, s: 80 }, // Mint
        { h: 255, s: 75 }, // Royal Blue
        { h: 50, s: 95 }   // Gold
    ];

    const getBaseColorForCountryCode = (code: string) => {
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            hash = code.charCodeAt(i) + ((hash << 5) - hash);
        }
        return COUNTRY_PALETTE[Math.abs(hash) % COUNTRY_PALETTE.length];
    };

    const processedCountryData = useMemo(() => {
        const map = new Map();
        const maxCount = Math.max(...countryData.map(c => c.count), 1);

        countryData.forEach(item => {
            const upperCode = (item.code || '').toUpperCase().trim();
            const code = upperCode.length === 2 ? iso2to3[upperCode] || upperCode : upperCode;

            const baseColor = getBaseColorForCountryCode(upperCode);
            // Intensity range 0.4 to 0.9 for better contrast and color presence
            const intensity = 0.4 + (item.count / maxCount) * 0.5;

            // Adjust lightness based on intensity: higher count = richer color (lower lightness than background)
            const l = 95 - (95 - 45) * intensity;
            map.set(code, {
                ...item,
                color: `hsl(${baseColor.h}, ${baseColor.s}%, ${l}%)`
            });
        });
        return map;
    }, [countryData]);

    function getColor(filter: string, intensity: number = 1) {
        // This is now handled in processedCountryData
        return '#cbd5e1';
    }

    if (isLoading) return (
        <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div id="chart-geographic-dist" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Country Distribution</h3>
                    <p className="text-sm text-slate-500">Geographic breakdown by applicant status</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                    {(['ALL', 'APPROVED', 'ENTERED', 'EXITED'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                                filter === f
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {f === 'ALL' ? 'All Applications' : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Map */}
                    <div className="h-[300px] sm:h-[400px] lg:h-[480px] lg:flex-1 relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                        <ComposableMap
                            projection="geoMercator"
                            style={{ width: "100%", height: "100%" }}
                        >
                            <ZoomableGroup
                                zoom={zoom}
                                center={[20, 0]}
                                onMoveEnd={({ zoom }) => setZoom(zoom)}
                            >
                                <Geographies geography={GEO_URL}>
                                    {({ geographies }) => geographies.map((geo) => {
                                        const d = processedCountryData.get(geo.id);
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                onMouseEnter={() => setHoveredCountry(`${geo.properties.name}${d ? `: ${d.count}` : ''}`)}
                                                onMouseLeave={() => setHoveredCountry(null)}
                                                fill={d ? d.color : "#cbd5e1"}
                                                stroke="#ffffff"
                                                strokeWidth={0.5}
                                                style={{ default: { outline: "none" }, hover: { fill: "#94a3b8", outline: "none" }, pressed: { outline: "none" } }}
                                            />
                                        );
                                    })}
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md shadow-lg border border-slate-100 rounded-xl px-4 py-2.5 pointer-events-none">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Selected</div>
                            <div className="text-sm font-bold text-slate-900 mt-0.5 max-w-[200px] truncate">{hoveredCountry || "Hover a country"}</div>
                        </div>
                        <div className="absolute bottom-3 left-3 flex gap-1 bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-100 shadow-sm">
                            <button className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600" onClick={handleZoomIn}><Plus className="h-4 w-4" /></button>
                            <button className="h-7 w-7 flex items-center justify-center hover:bg-slate-100 rounded text-slate-600" onClick={handleZoomOut}><Minus className="h-4 w-4" /></button>
                        </div>
                    </div>

                    {/* Top List */}
                    <div className="lg:w-80 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Top Nationalities ({filter})</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">Top 10</div>
                        </div>
                        <div className="space-y-4 h-[420px] overflow-y-auto custom-scrollbar pr-2">
                            {countryData.slice(0, 10).map((country, idx) => {
                                const maxCount = Math.max(...countryData.map(c => c.count), 1);
                                const percentage = (country.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm font-bold text-slate-700 truncate" title={country.name}>{country.name || country.code}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{country.count}</span>
                                        </div>
                                        <Progress
                                            value={percentage}
                                            className="h-1.5 bg-slate-100"
                                            indicatorStyle={{
                                                backgroundColor: processedCountryData.get(iso2to3[(country.code || '').toUpperCase().trim()] || (country.code || '').toUpperCase().trim())?.color || '#cbd5e1'
                                            }}
                                        />
                                    </div>
                                )
                            })}
                            {countryData.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">No data available for this filter</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
