"use client";

import React, { useState, useEffect } from "react";
import { 
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, 
  ResponsiveContainer, Tooltip, XAxis, YAxis 
} from "recharts";
import { 
  ArrowDown, ArrowUp, Minus, AlertTriangle, CheckCircle2, Lightbulb, 
  FileText, BarChart3, Table as TableIcon 
} from "lucide-react";

// --- SUB-COMPONENTS (Consolidated) ---

function KeyFindingCard({ metric }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
      <div className="pb-2">
        <h3 className="text-sm font-medium text-slate-400">
          {metric.label}
        </h3>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{metric.value}</div>
        {metric.trend && (
          <div className={`flex items-center text-xs mt-1 ${
            metric.trend.direction === 'up' ? 'text-green-400' : 
            metric.trend.direction === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {metric.trend.direction === 'up' && <ArrowUp className="h-3 w-3 mr-1" />}
            {metric.trend.direction === 'down' && <ArrowDown className="h-3 w-3 mr-1" />}
            {metric.trend.direction === 'neutral' && <Minus className="h-3 w-3 mr-1" />}
            <span className="font-medium">{metric.trend.value}</span>
            <span className="ml-1 text-slate-500">{metric.trend.label}</span>
          </div>
        )}
        {metric.description && (
          <p className="text-xs text-slate-500 mt-2">
            {metric.description}
          </p>
        )}
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

function ChartCard({ chart }) {
  // SAFETY CHECK: Ensure dataKeys exists and has at least one item
  const safeDataKeys = chart.dataKeys && chart.dataKeys.length > 0 
    ? chart.dataKeys 
    : [{ name: 'name', value: 'value' }]; // Fallback to prevent crash

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <BarChart data={chart.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey={safeDataKeys[0].name} 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey={safeDataKeys[0].value} radius={[4, 4, 0, 0]}>
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={safeDataKeys[0].value}
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={chart.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey={safeDataKeys[0].name} 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e2e', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey={safeDataKeys[0].value} 
              stroke={COLORS[0]} 
              strokeWidth={2}
              dot={{ fill: COLORS[0], r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white">{chart.title}</h3>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightDetailCard({ insight }) {
  const getIcon = () => {
    switch (insight.severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (insight.severity) {
      case 'critical': return 'border-red-500/20 bg-red-500/5';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/5';
      case 'success': return 'border-green-500/20 bg-green-500/5';
      default: return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className={`border rounded-xl p-6 ${getStyles()}`}>
      <div className="flex flex-row items-start gap-4 pb-2">
        <div className="mt-1">{getIcon()}</div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-white">
            {insight.title}
          </h3>
        </div>
      </div>
      <div className="pl-9">
        <p className="text-sm text-slate-400 leading-relaxed">
          {insight.content}
        </p>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

export default function ReportInterface({ data }) {
  const [activeTab, setActiveTab] = useState("charts");

  // Debug logging
  useEffect(() => {
    console.log("[ReportInterface] Mounted with data:", data);
  }, [data]);

  if (!data) {
    console.warn("[ReportInterface] No data provided!");
    return null;
  }

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

      {/* Custom Tabs Implementation */}
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