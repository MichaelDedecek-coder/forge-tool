"use client";

import React, { useState } from "react";
import { KeyFindingCard } from "./report/KeyFindingCard";
import { ChartCard } from "./report/ChartCard";
import { InsightDetailCard } from "./report/InsightDetailCard";
import { FileText, BarChart3, Lightbulb, Table as TableIcon } from "lucide-react";

export function ReportInterface({ data }) {
  const [activeTab, setActiveTab] = useState("charts");

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">{data.title}</h1>
        <p className="text-slate-400 text-lg">{data.summary}</p>
      </div>

      {/* Key Metrics Grid */}
      {data.metrics && data.metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.metrics.map((metric, index) => (
            <KeyFindingCard key={index} metric={metric} />
          ))}
        </div>
      )}

      {/* Custom Tabs Implementation (No shadcn dependency) */}
      <div className="w-full">
        <div className="flex space-x-1 rounded-xl bg-slate-800/50 p-1 w-full md:w-auto inline-flex mb-6">
          <button
            onClick={() => setActiveTab("charts")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "charts" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Visuals
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "insights" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            Insights
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === "raw" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="h-4 w-4" />
            Raw
          </button>
        </div>

        {/* Charts Tab Content */}
        {activeTab === "charts" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.charts && data.charts.map((chart, index) => (
                <ChartCard key={index} chart={chart} />
              ))}
              {(!data.charts || data.charts.length === 0) && (
                <div className="col-span-full p-12 text-center border border-dashed border-slate-700 rounded-xl">
                  <p className="text-slate-500">No charts generated for this query.</p>
                </div>
              )}
            </div>
            
            {/* Tables Section */}
            {data.tables && data.tables.length > 0 && (
              <div className="space-y-6 mt-8">
                {data.tables.map((table, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="flex items-center gap-2 text-lg font-medium text-white">
                        <TableIcon className="h-5 w-5 text-slate-400" />
                        {table.title}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-white/5">
                          <tr>
                            {table.headers.map((header, i) => (
                              <th key={i} className="px-6 py-3">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {table.rows.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              {row.map((cell, j) => (
                                <td key={j} className="px-6 py-4 font-medium text-slate-300">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Insights Tab Content */}
        {activeTab === "insights" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 gap-4">
              {data.insights && data.insights.map((insight, index) => (
                <InsightDetailCard key={index} insight={insight} />
              ))}
              {(!data.insights || data.insights.length === 0) && (
                <div className="p-12 text-center border border-dashed border-slate-700 rounded-xl">
                  <p className="text-slate-500">No specific insights extracted.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raw Markdown Tab Content */}
        {activeTab === "raw" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 overflow-auto max-h-[600px]">
                {data.rawMarkdown}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}