import React from "react";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

export function InsightDetailCard({ insight }) {
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