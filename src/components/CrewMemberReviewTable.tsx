import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  FileText,
  User,
  Eye,
  Image as ImageIcon,
  ShieldCheck,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import {
  useGetApplicationMembersQuery,
  ApplicationMember,
  getFileUrl
} from '@/store/services/api';

interface CrewMemberReviewTableProps {
  applicationId: number;
}

export function CrewMemberReviewTable({
  applicationId,
}: CrewMemberReviewTableProps) {
  const { data, isLoading, isError } = useGetApplicationMembersQuery(applicationId);

  // Track expanded members
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const members = data?.members || [];

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === members.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(members.map((m) => m.id)));
    }
  };

  const renderStatusBadge = (status: string, rejectionReason?: string) => {
    if (status === 'ACTION_REQUIRED' || status === 'REJECTED' || Boolean(rejectionReason)) {
      return (
        <Badge className="bg-amber-50 text-amber-800 border-amber-300 gap-1 font-semibold py-0.5 px-2 text-[11px] shrink-0" variant="outline">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Action Required
        </Badge>
      );
    }
    return null;
  };

  const isFileEntry = (key: string, val: any): boolean => {
    if (!val) return false;

    // Exclude non-file keys
    const lowerKey = key.toLowerCase();
    const nonFileKeys = ['date', 'expiry', 'expir', 'birth', 'number', 'num', 'status', 'name', 'email', 'phone', 'code', 'role', 'nationality', 'gender'];
    if (nonFileKeys.some(nk => lowerKey.includes(nk))) return false;

    if (typeof val === 'object') {
      if (val.url || val.path || val.fileUrl) return true;
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && (val[0].includes('uploads/') || /\.(pdf|jpg|jpeg|png|webp|gif|doc|docx)$/i.test(val[0]))) return true;
      return false;
    }
    const str = String(val).trim();
    if (str.length < 4) return false;

    // Exclude ISO date strings or pure numbers
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return false;
    if (/^\d+$/.test(str)) return false;

    // Definite file indicators
    if (str.startsWith('http://') || str.startsWith('https://')) {
      return /\.(pdf|jpg|jpeg|png|webp|gif|doc|docx|svg)(\?.*)?$/i.test(str) || str.includes('/uploads/');
    }
    if (str.includes('uploads/') || str.includes('/uploads/')) return true;
    if (/\.(pdf|jpg|jpeg|png|webp|gif|doc|docx|svg)$/i.test(str)) return true;

    return false;
  };

  const resolveFileUrl = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'object') {
      if (val.url) return getFileUrl(val.url);
      if (val.path) return getFileUrl(val.path);
      if (val.fileUrl) return getFileUrl(val.fileUrl);
      if (Array.isArray(val) && val[0]) return resolveFileUrl(val[0]);
      return '';
    }
    return getFileUrl(String(val));
  };

  if (isLoading) {
    return (
      <Card className="border shadow-2xs">
        <CardContent className="py-8 flex flex-col justify-center items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading crew manifest...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-6 text-center text-destructive text-xs font-medium">
          Failed to load crew members for this application.
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="border-dashed border bg-slate-50/50">
        <CardContent className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center">
          <Users className="w-8 h-8 text-slate-300 mb-2" />
          <h4 className="font-semibold text-slate-700 text-xs mb-0.5">No Crew Members Recorded</h4>
          <p className="text-[11px] text-slate-500 max-w-sm">
            This application allows crew submissions, but no individual crew members were submitted.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allExpanded = members.length > 0 && expandedIds.size === members.length;

  return (
    <div className="space-y-3">
      {/* Top Banner & Summary Card - Compact */}
      <Card className="border shadow-2xs bg-white">
        <CardHeader className="p-3 sm:p-4 border-b bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Crew Manifest & Accreditations ({members.length})
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500">
                Review personnel details, passports, and credentials. Approvals and rejections are made via the Decision Panel.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="text-xs font-medium gap-1 h-7 px-2.5 border-slate-300 text-slate-700 shrink-0 self-start sm:self-center"
              onClick={toggleExpandAll}
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
              {allExpanded ? 'Shrink All' : 'Expand All'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Expandable Crew Member Cards */}
      <div className="space-y-2">
        {members.map((member, index) => {
          const isExpanded = expandedIds.has(member.id);
          const hasIssue = member.status === 'REJECTED' || member.status === 'ACTION_REQUIRED' || Boolean(member.rejectionReason);

          const memberFiles: { label: string; url: string; key: string; category: string }[] = [];

          const addFile = (label: string, rawVal: any, key: string, category: string) => {
            if (!rawVal) return;
            const url = resolveFileUrl(rawVal);
            if (!url) return;

            const normLabel = label.toLowerCase().replace(/[^a-z]/g, '');

            // Deduplicate by resolved URL, semantic category (passport, photo, visa, press_card), or normalized label
            const existingIndex = memberFiles.findIndex(f =>
              f.url === url ||
              (category !== 'custom' && f.category === category) ||
              f.label.toLowerCase().replace(/[^a-z]/g, '') === normLabel
            );

            if (existingIndex === -1) {
              memberFiles.push({ label, url, key, category });
            }
          };

          // 1. Standard member document fields
          if (member.passportScanUrl) {
            addFile('Passport Scan', member.passportScanUrl, 'passportScanUrl', 'passport');
          }
          if (member.photoUrl) {
            addFile('Photo / Headshot', member.photoUrl, 'photoUrl', 'photo');
          }
          if (member.visaScanUrl) {
            addFile('Visa Scan', member.visaScanUrl, 'visaScanUrl', 'visa');
          }
          if (member.pressCardUrl) {
            addFile('Press Card / Accreditation', member.pressCardUrl, 'pressCardUrl', 'press_card');
          }

          // 2. Dynamic memberData fields (custom uploads, assignment letters, or mapped fields)
          if (member.memberData && typeof member.memberData === 'object') {
            Object.entries(member.memberData).forEach(([k, v]) => {
              if (isFileEntry(k, v)) {
                const lowerK = k.toLowerCase().replace(/[^a-z]/g, '');
                let category = 'custom';
                let label = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                if (lowerK.includes('passport') && (lowerK.includes('scan') || lowerK.includes('copy') || lowerK.includes('bio') || lowerK.includes('file') || lowerK === 'passport')) {
                  category = 'passport';
                  label = 'Passport Scan';
                } else if (lowerK.includes('photo') || lowerK.includes('avatar') || lowerK.includes('headshot') || lowerK.includes('picture')) {
                  category = 'photo';
                  label = 'Photo / Headshot';
                } else if (lowerK.includes('visa') && (lowerK.includes('scan') || lowerK.includes('copy') || lowerK.includes('file') || lowerK === 'visa')) {
                  category = 'visa';
                  label = 'Visa Scan';
                } else if (lowerK.includes('press') || lowerK.includes('badge') || lowerK.includes('card')) {
                  category = 'press_card';
                  label = 'Press Card / Accreditation';
                }

                addFile(label, v, k, category);
              }
            });
          }

          const fileKeys = new Set(memberFiles.map(f => f.key));

          const memberTextFields = member.memberData && typeof member.memberData === 'object'
            ? Object.entries(member.memberData).filter(([k, v]) => !fileKeys.has(k) && !isFileEntry(k, v) && v !== null && v !== undefined && typeof v !== 'object')
            : [];

          const cardBorderColor = hasIssue
            ? 'border-amber-300 bg-amber-50/20'
            : member.status === 'APPROVED'
            ? 'border-emerald-200'
            : 'border-slate-200';

          return (
            <Card
              key={member.id}
              className={`border bg-white shadow-2xs transition-all rounded-xl overflow-hidden ${cardBorderColor}`}
            >
              {/* Clickable Header Bar - Press to Expand / Shrink */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(member.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpand(member.id);
                  }
                }}
                className={`p-3 sm:p-3.5 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${
                  isExpanded ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left Side: Chevron, Photo, Name, Role & Primary Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Chevron Toggle Button */}
                  <div className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-transform shrink-0">
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </div>

                  {/* Member Photo or Avatar */}
                  <div className="relative shrink-0">
                    {member.photoUrl ? (
                      <img
                        src={getFileUrl(member.photoUrl)}
                        alt={member.fullName}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100 shadow-2xs"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/80x80?text=Photo';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded-full border border-white">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Name, Role & Passport / Nationality Summary */}
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                        {member.fullName}
                      </h4>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {member.roleInProduction}
                      </span>
                      {hasIssue && member.rejectionReason && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Action Required
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span>
                        Nat: <strong className="text-slate-700">{member.nationality || '—'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Passport: <strong className="font-mono text-slate-700">{member.passportNumber || '—'}</strong>
                      </span>
                      {member.email && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline text-slate-400 truncate max-w-[180px]">{member.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Status Badge */}
                <div className="flex items-center gap-2 shrink-0 ml-8 sm:ml-0">
                  {renderStatusBadge(member.status, member.rejectionReason)}
                </div>
              </div>

              {/* Expandable Box: Compact & Neat Layout */}
              {isExpanded && (
                <div className="p-3.5 sm:p-4 bg-slate-50/40 space-y-3 animate-in fade-in-0 duration-150 text-xs">
                  
                  {/* Feedback / Rejection Notice Banner if flagged */}
                  {member.rejectionReason && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Flagged Reviewer Feedback for this Crew Member:</span>
                      </div>
                      <p className="text-xs leading-relaxed pl-5 font-medium whitespace-pre-wrap">
                        {member.rejectionReason}
                      </p>
                      {member.reviewer && (
                        <p className="text-[10px] text-amber-700 pl-5 pt-0.5">
                          Reviewer: {member.reviewer.fullName || member.reviewer.email}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                    
                    {/* Col 1: Personal & Identity Details */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs pb-1 border-b border-slate-100">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Identity & Passport Details</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-0.5 border-b border-slate-50">
                          <span className="text-slate-400">Full Name:</span>
                          <strong className="text-slate-800 font-semibold">{member.fullName}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-50">
                          <span className="text-slate-400">Role:</span>
                          <strong className="text-indigo-700 font-semibold">{member.roleInProduction}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-50">
                          <span className="text-slate-400">Nationality:</span>
                          <strong className="text-slate-800">{member.nationality || '—'}</strong>
                        </div>
                        <div className="flex justify-between py-0.5 border-b border-slate-50">
                          <span className="text-slate-400">Passport Number:</span>
                          <strong className="font-mono text-slate-800">{member.passportNumber || '—'}</strong>
                        </div>
                        {member.passportExpiry && (
                          <div className="flex justify-between py-0.5 border-b border-slate-50">
                            <span className="text-slate-400">Passport Expiry:</span>
                            <span className="text-slate-700">{member.passportExpiry}</span>
                          </div>
                        )}
                        {member.visaNumber && (
                          <div className="flex justify-between py-0.5 border-b border-slate-50">
                            <span className="text-slate-400">Visa Number:</span>
                            <span className="text-slate-700">{member.visaNumber}</span>
                          </div>
                        )}
                        {member.visaExpiry && (
                          <div className="flex justify-between py-0.5 border-b border-slate-50">
                            <span className="text-slate-400">Visa Expiry:</span>
                            <span className="text-slate-700">{member.visaExpiry}</span>
                          </div>
                        )}
                        {member.email && (
                          <div className="flex justify-between py-0.5 border-b border-slate-50">
                            <span className="text-slate-400">Email:</span>
                            <span className="text-slate-700 truncate max-w-[160px]" title={member.email}>{member.email}</span>
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-slate-400">Phone:</span>
                            <span className="text-slate-700">{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Col 2: Attached Credentials & Dynamic Responses */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 text-xs pb-1 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>Attached Credentials & Documents ({memberFiles.length})</span>
                        </div>
                      </div>

                      {memberFiles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {memberFiles.map((file) => (
                            <a
                              key={file.key}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 flex items-center justify-between text-xs transition-colors group"
                            >
                              <span className="font-medium text-slate-800 flex items-center gap-1.5 truncate mr-2">
                                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate">{file.label}</span>
                              </span>
                              <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 shrink-0">
                                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" /> View
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">No attached documents recorded for this member.</p>
                      )}

                      {/* Custom Dynamic Member Data (Non-file text fields) */}
                      {memberTextFields.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Additional Field Responses</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {memberTextFields.map(([k, v]) => (
                              <div key={k} className="flex justify-between text-[11px] p-1.5 rounded bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                                <strong className="text-slate-700">{String(v)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
