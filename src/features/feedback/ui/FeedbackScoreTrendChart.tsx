"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FeedbackScoreTrendChartProps = {
  data: {
    cycle: string;
    score: number;
  }[];
};

export function FeedbackScoreTrendChart({
  data,
}: FeedbackScoreTrendChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="cycle" />

          <YAxis
            domain={[0, 5]}
            tickCount={6}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--brand)"
            strokeWidth={3}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
