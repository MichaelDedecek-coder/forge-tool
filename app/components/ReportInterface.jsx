"use client";
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Lightbulb, BarChart3 } from "lucide-react";

// Color palette for charts
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// === SUB-COMPONENTS ===

function KeyMetricCard({ label, value, trend }) {
  const isPositive = trend && (trend.includes("+") || trend.toLowerCase().includes("up"));
  const isNegative = trend && (trend.includes("-") || trend.toLowerCase().includes("down"));

  return (
    <div style={{
      background: "#1e293b",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #334155",
      minWidth: "150px",
      flex: "1"
    }}>
      <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "8px" }}>{label}</p>
      <p style={{ color: "#fff", fontSize: "24px", fontWeight: "bold", marginBottom: "4px" }}>{value}</p>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {isPositive && <TrendingUp size={16} color="#10b981" />}
          {isNegative && <TrendingDown size={16} color="#ef4444" />}
          <span style={{ 
            color: isPositive ? "#10b981" : isNegative ? "#ef4444" : "#94a3b8", 
            fontSize: "14px" 
          }}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}

function ChartRenderer({ chart }) {
  const { chartType, data, title, dataKeys } = chart;

  if (!data || data.length === 0) return null;

  // Extract key names from data
  const keys = Object.keys(data[0] || {});
  const categoryKey = dataKeys?.[0]?.name || keys[0];
  const valueKey = dataKeys?.[0]?.value || keys[1];

  return (
    <div style={{
      background: "#1e293b",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #334155",
      marginBottom: "20px"
    }}>
      <h4 style={{ color: "#fff", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
        <BarChart3 size={18} color="#3b82f6" />
        {title}
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        {chartType === "bar" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={categoryKey} stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar dataKey={valueKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
        {chartType === "line" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={categoryKey} stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line type="monotone" dataKey={valueKey} stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
          </LineChart>
        )}
        {chartType === "pie" && (
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={categoryKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function InsightCard({ title, description }) {
  return (
    <div style={{
      background: "#1e293b",
      borderRadius: "12px",
      padding: "16px",
      border: "1px solid #334155",
      marginBottom: "12px"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <Lightbulb size={20} color="#f59e0b" style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <h4 style={{ color: "#fff", fontSize: "16px", marginBottom: "6px" }}>{title}</h4>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>{description}</p>
        </div>
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===

export function ReportInterface({ data, language = "en" }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Handle case where data is null/undefined or parsing failed
  if (!data || (!data.title && !data.metrics?.length && !data.charts?.length && !data.insights?.length)) {
    return (
      <div style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
        <p>{language === "cs" ? "Žádná strukturovaná data k zobrazení." : "No structured data to display."}</p>
      </div>
    );
  }

  const { title, summary, metrics, charts, insights } = data;

  const tabs = [
    { id: "overview", label: language === "cs" ? "Přehled" : "Overview" },
    { id: "charts", label: language === "cs" ? "Grafy" : "Charts" },
    { id: "insights", label: language === "cs" ? "Poznatky" : "Insights" },
  ];

  return (
    <div>
      {/* Title & Summary */}
      {title && (
        <h2 style={{ color: "#fff", fontSize: "24px", marginBottom: "10px" }}>{title}</h2>
      )}
      {summary && (
        <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>{summary}</p>
      )}

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "20px",
        borderBottom: "1px solid #334155",
        paddingBottom: "10px"
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#3b82f6" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#94a3b8",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div>
          {/* Metrics */}
          {metrics && metrics.length > 0 && (
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px" }}>
              {metrics.map((metric, idx) => (
                <KeyMetricCard key={idx} label={metric.label} value={metric.value} trend={metric.trend} />
              ))}
            </div>
          )}

          {/* First Chart (preview) */}
          {charts && charts.length > 0 && (
            <ChartRenderer chart={charts[0]} />
          )}

          {/* First 2 Insights (preview) */}
          {insights && insights.length > 0 && (
            <div>
              <h3 style={{ color: "#fff", fontSize: "18px", marginBottom: "15px" }}>
                {language === "cs" ? "Klíčové poznatky" : "Key Insights"}
              </h3>
              {insights.slice(0, 2).map((insight, idx) => (
                <InsightCard key={idx} title={insight.title} description={insight.description} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "charts" && (
        <div>
          {charts && charts.length > 0 ? (
            charts.map((chart, idx) => (
              <ChartRenderer key={idx} chart={chart} />
            ))
          ) : (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
              {language === "cs" ? "Žádné grafy k dispozici." : "No charts available."}
            </p>
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div>
          {insights && insights.length > 0 ? (
            insights.map((insight, idx) => (
              <InsightCard key={idx} title={insight.title} description={insight.description} />
            ))
          ) : (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
              {language === "cs" ? "Žádné poznatky k dispozici." : "No insights available."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}