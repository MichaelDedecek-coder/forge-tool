"use client";

import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Calendar, Mail, ListTodo, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

function ConnectedPageContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full mb-6">
            <CheckCircle2 className="w-12 h-12 text-teal-600" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            You're All Set! 🎉
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-8">
            FocusMate is now connected to your Google Workspace
          </p>

          {/* Connected Email */}
          {email && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-6 py-4 mb-8">
              <p className="text-sm text-teal-900 font-medium">
                Connected Account
              </p>
              <p className="text-lg text-teal-700 font-semibold mt-1">
                {email}
              </p>
            </div>
          )}

          {/* What's Connected */}
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Calendar</p>
              <p className="text-xs text-gray-500 mt-1">Read-only</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="w-7 h-7 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Gmail</p>
              <p className="text-xs text-gray-500 mt-1">Read-only</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <ListTodo className="w-7 h-7 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Tasks</p>
              <p className="text-xs text-gray-500 mt-1">Read-only</p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              What Happens Next
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-600 text-sm font-bold">1</span>
                </div>
                <p className="text-gray-700">
                  FocusMate will read your Calendar, Gmail, and Tasks <strong>overnight</strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-600 text-sm font-bold">2</span>
                </div>
                <p className="text-gray-700">
                  You'll receive your first <strong>Morning Pulse email at 8:00 AM</strong> tomorrow
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-teal-600 text-sm font-bold">3</span>
                </div>
                <p className="text-gray-700">
                  Every workday morning, you'll know exactly what needs your attention
                </p>
              </li>
            </ul>
          </div>

          {/* Privacy Note */}
          <p className="text-sm text-gray-500 mb-6">
            🔒 We only <strong>read</strong> your data — we never modify, delete, or send anything on your behalf.
            Your data is processed securely and never shared with third parties.
          </p>

          {/* CTA Button */}
          <a
            href="/focusmate"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all hover:shadow-xl"
          >
            Back to FocusMate
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-600 mt-8">
          Questions? Email us at{' '}
          <a href="mailto:support@focusmateapp.com" className="text-teal-600 font-semibold hover:underline">
            support@focusmateapp.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ConnectedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConnectedPageContent />
    </Suspense>
  );
}
