import React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export function KeyFindingCard({ metric }) {
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