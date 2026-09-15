import React from 'react';
import { useGetFormsQuery } from '@/store/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Archive, CheckCircle2 } from 'lucide-react';

interface FormFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  className?: string;
  hideDefault?: boolean;
}

export const FormFilter: React.FC<FormFilterProps> = ({ value, onChange, className, hideDefault }) => {
  const { data: forms, isLoading } = useGetFormsQuery();

  const handleValueChange = (val: string) => {
    onChange(val === 'default' ? undefined : val);
  };

  if (isLoading) {
    return <div className="h-10 w-48 animate-pulse bg-muted rounded-md" />;
  }

  const activeCount = forms?.filter((f) => f.status === 'PUBLISHED').length || 0;

  return (
    <div className={className}>
      <Select value={value || 'default'} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[280px] bg-background">
          <SelectValue placeholder="All Active Forms (Default)" />
        </SelectTrigger>
        <SelectContent>
          {!hideDefault && (
            <SelectItem value="default" className="cursor-pointer">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">All Active Forms</span>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 font-semibold">
                  {activeCount} Active
                </Badge>
              </div>
            </SelectItem>
          )}
          {forms?.map((form) => (
            <SelectItem key={form.form_id} value={form.form_id.toString()} className="cursor-pointer">
              <div className="flex items-center justify-between w-full gap-4">
                <span className="truncate max-w-[180px]">{form.name}</span>
                {form.status === 'ARCHIVED' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-[10px] py-0 px-1">
                    <Archive className="h-3 w-3" />
                    Archived
                  </Badge>
                )}
                {form.status === 'PUBLISHED' && (
                  <Badge variant="outline" className="flex items-center gap-1 text-[10px] py-0 px-1 border-green-200 text-green-600 bg-green-50">
                    Active
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
