import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, CheckCircle2, Lock } from "lucide-react"
import { Link } from "react-router-dom"

export function ResetPassword() {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsLoading(false)
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-[#009b4d]/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
                </div>

                <div className="w-full max-w-md relative z-10">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6 text-center">
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-100 rounded-full blur-xl" />
                                    <div className="relative bg-[#009b4d] p-4 rounded-full">
                                        <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900">
                                Check your email
                            </h1>

                            <p className="text-slate-600">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>

                            <p className="text-sm text-slate-500">
                                Please check your inbox and follow the instructions to reset your password.
                            </p>

                            <div className="pt-4">
                                <Link to="/login">
                                    <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-96 h-96 bg-[#009b4d]/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
            </div>

            {/* Reset Password Card */}
            <div className="w-full max-w-md relative z-10">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {/* Card Content */}
                    <div className="p-8 space-y-6">
                        {/* Back Button */}
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Sign In
                        </Link>

                        {/* Icon */}
                        <div className="flex justify-center mb-2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#009b4d]/20 to-blue-500/20 rounded-full blur-xl" />
                                <div className="relative bg-gradient-to-br from-[#009b4d] to-green-600 p-4 rounded-full shadow-lg">
                                    <Lock className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Reset password
                            </h1>
                            <p className="text-sm text-slate-600">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-4 pr-12 h-12 border-slate-200 focus-visible:border-[#009b4d] focus-visible:ring-[#009b4d]/20"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </span>
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
