import React, { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
    password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
    const strength = useMemo(() => {
        const requirements = {
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const metRequirements = Object.values(requirements).filter(Boolean).length;
        let score = 0;
        let label = "";
        let color = "";

        if (password.length === 0) {
            score = 0;
            label = "";
            color = "";
        } else if (metRequirements <= 2) {
            score = 1;
            label = "Weak";
            color = "bg-red-500";
        } else if (metRequirements === 3) {
            score = 2;
            label = "Fair";
            color = "bg-orange-500";
        } else if (metRequirements === 4) {
            score = 3;
            label = "Good";
            color = "bg-yellow-500";
        } else {
            score = 4;
            label = "Strong";
            color = "bg-green-500";
        }

        return { score, label, color, requirements };
    }, [password]);

    if (!password) return null;

    return (
        <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Password Strength:</span>
                <span className={`font-bold ${strength.score === 1 ? 'text-red-500' :
                        strength.score === 2 ? 'text-orange-500' :
                            strength.score === 3 ? 'text-yellow-500' :
                                strength.score === 4 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                    {strength.label}
                </span>
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${level <= strength.score ? strength.color : 'bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            <div className="space-y-1 pt-1">
                {[
                    { key: 'minLength', label: 'Min. 8 characters' },
                    { key: 'hasUppercase', label: 'One uppercase letter' },
                    { key: 'hasLowercase', label: 'One lowercase letter' },
                    { key: 'hasNumber', label: 'One number' },
                    { key: 'hasSpecial', label: 'One special character' }
                ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-[10px]">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${strength.requirements[key as keyof typeof strength.requirements]
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                            {strength.requirements[key as keyof typeof strength.requirements] ? '✓' : '○'}
                        </div>
                        <span className={strength.requirements[key as keyof typeof strength.requirements] ? 'text-gray-700' : 'text-gray-400'}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
