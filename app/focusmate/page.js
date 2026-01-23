"use client";

import { useState } from 'react';
import { Clock, Mail, Calendar, CheckCircle2, Zap, Target } from 'lucide-react';
import PilotSignupForm from './components/PilotSignupForm';

export default function FocusMatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">
                Focus<span className="text-teal-600">Mate</span>
              </span>
            </div>
            <a
              href="#pilot"
              className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 transition-all hover:shadow-lg"
            >
              Join Pilot
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Your morning briefing.
              <br />
              <span className="text-teal-600">Automated.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We read your Calendar, Gmail, and Tasks overnight. You get one email at 8am telling you exactly what needs attention.
            </p>

            {/* Trust Signal */}
            <p className="text-sm text-gray-500 mb-8">
              No credit card. No new app to learn. Cancel anytime.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <a
                href="#pilot"
                className="inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                Join the Pilot — Free
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-300 text-slate-700 font-semibold rounded-full hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                How It Works
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-bold text-teal-600">47 min</div>
                <div className="text-sm text-gray-600">Saved daily</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-600">€29</div>
                <div className="text-sm text-gray-600">Per month</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-teal-600">8:00 AM</div>
                <div className="text-sm text-gray-600">Every workday</div>
              </div>
            </div>
          </div>

          {/* Right Column - Sample Email Preview */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Email Header */}
              <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">FM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">FocusMate</div>
                    <div className="text-xs text-gray-500">focus@focusmate.app</div>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-slate-900">☀️ Your Morning Pulse — Monday, Jan 12</h2>
              </div>

              {/* Email Body */}
              <div className="p-6 space-y-6">
                {/* Calendar Section */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Today's Calendar
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-3">
                      <span className="text-gray-500 font-mono">09:00</span>
                      <span className="text-gray-700">Team Standup</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-gray-500 font-mono">14:00</span>
                      <span className="text-gray-700 font-semibold">Sarah Chen — Q1 Budget</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-16 mt-1">
                      💡 Last discussed Dec 15: Budget allocation
                    </div>
                  </div>
                </div>

                {/* Email Priority */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-600" />
                    Needs Response Today
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-700">• Client proposal (deadline today)</div>
                    <div className="text-gray-700">• Invoice approval (waiting 3 days)</div>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Priority Tasks
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-700">• Finalize Q1 report (due tomorrow)</div>
                    <div className="text-gray-700">• Prep slides for Sarah meeting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="bg-slate-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Stop Sorting. Start Executing.
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              The average professional spends <span className="text-teal-400 font-semibold">2.1 hours daily</span> just figuring out what to work on.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Email triage. Calendar scanning. Context switching. Searching old threads for meeting prep.
            </p>
            <p className="text-lg text-teal-400 font-semibold mt-4">
              That's hundreds of hours per year spent on administrative overhead instead of actual work.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              How FocusMate Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One email at 8am. Your calendar, your priorities, your prep — synthesized.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">The Morning Pulse™</h3>
              <p className="text-gray-600">
                One deterministic email at 8am every workday with your complete day overview.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Zero App Philosophy</h3>
              <p className="text-gray-600">
                Lives inside Gmail. No new dashboard. No login. Your tools just got smart.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Context Intelligence</h3>
              <p className="text-gray-600">
                Meeting prep with email history. Know what Sarah wanted to discuss before you meet.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email Triage</h3>
              <p className="text-gray-600">
                Which emails need response today. Which can wait. Pure Google API data.
              </p>
            </div>
          </div>

          {/* Zero App Philosophy Callout */}
          <div className="mt-16 bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-lg text-center text-slate-700 italic">
              "We aren't asking you to move to a new house; we're installing a high-end automation system in the house you already live in."
            </p>
          </div>
        </div>
      </section>

      {/* Permissions & Security Section */}
      <section className="py-16 sm:py-24 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Transparent & Secure
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your privacy and security matter. Here's exactly what we access and how we protect your data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* What We Access */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                What FocusMate Accesses (Read-Only)
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Calendar</p>
                    <p className="text-sm text-gray-600">See your meetings and schedule</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Gmail</p>
                    <p className="text-sm text-gray-600">See email subjects and senders (never content)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Tasks</p>
                    <p className="text-sm text-gray-600">See your task lists and due dates</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* What We Never Do */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                What FocusMate NEVER Does
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 text-red-600 flex-shrink-0 mt-1 font-bold text-xl">❌</div>
                  <div>
                    <p className="font-semibold text-slate-900">Send emails on your behalf</p>
                    <p className="text-sm text-gray-600">We only read, never send</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 text-red-600 flex-shrink-0 mt-1 font-bold text-xl">❌</div>
                  <div>
                    <p className="font-semibold text-slate-900">Modify your calendar</p>
                    <p className="text-sm text-gray-600">Read-only access only</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 text-red-600 flex-shrink-0 mt-1 font-bold text-xl">❌</div>
                  <div>
                    <p className="font-semibold text-slate-900">Delete anything</p>
                    <p className="text-sm text-gray-600">Your data stays untouched</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 text-red-600 flex-shrink-0 mt-1 font-bold text-xl">❌</div>
                  <div>
                    <p className="font-semibold text-slate-900">Share your data</p>
                    <p className="text-sm text-gray-600">Never sold to third parties</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Security Badges */}
          <div className="mt-12 bg-slate-50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 text-center mb-6">
              Enterprise-Grade Security
            </h3>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <p className="font-semibold text-slate-900">Bank-Level Encryption</p>
                <p className="text-sm text-gray-600 mt-1">AES-256-GCM standard</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔐</div>
                <p className="font-semibold text-slate-900">OAuth 2.0</p>
                <p className="text-sm text-gray-600 mt-1">We never see your password</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🗑️</div>
                <p className="font-semibold text-slate-900">Disconnect Anytime</p>
                <p className="text-sm text-gray-600 mt-1">From Google Account settings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Below the "I need to think about it" threshold
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border-2 border-teal-600 overflow-hidden">
              {/* Pilot Badge */}
              <div className="bg-teal-600 text-white text-center py-2 text-sm font-semibold">
                🎯 Pilot Program — Free Early Access
              </div>

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">FocusMate</h3>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-slate-900">€29</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">The cost of two business lunches</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Daily Morning Pulse briefing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email priority triage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Meeting context preparation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Task deadline intelligence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Works with Google Workspace</span>
                  </li>
                </ul>

                <a
                  href="#pilot"
                  className="block w-full text-center px-8 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all hover:shadow-xl"
                >
                  Join Pilot — Free
                </a>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Pilot users get free access while we refine the experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Signup Section */}
      <section id="pilot" className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Join the FocusMate Pilot
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Get free access while we validate and refine the experience. No credit card required.
          </p>

          <PilotSignupForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">
                Focus<span className="text-teal-600">Mate</span>
              </span>
            </div>
            <p className="text-gray-600 mb-2">
              Part of the FORGE CREATIVE AI Workforce
            </p>
            <a
              href="https://aijob.agency"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              aijob.agency
            </a>
            <p className="text-sm text-gray-500 mt-6">
              Meaning &gt; Money
            </p>
            <p className="text-xs text-gray-400 mt-2">
              © 2026 FORGE CREATIVE. Made in EU. GDPR Compliant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
