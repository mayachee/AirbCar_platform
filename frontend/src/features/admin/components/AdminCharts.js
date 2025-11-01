'use client';

import { Bar, BarChart, AreaChart, Area } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "#2563eb",
  },
  users: {
    label: "Users",
    color: "#10b981",
  },
  earnings: {
    label: "Earnings ($)",
    color: "#f59e0b",
  },
};

export default function AdminCharts({ chartData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Bookings Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Bookings</h3>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
          </BarChart>
          <ChartLegend content={<ChartLegendContent />} />
        </ChartContainer>
      </div>

      {/* Users Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
        <ChartContainer config={chartConfig}>
          <AreaChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="users"
              type="natural"
              fill="var(--color-users)"
              fillOpacity={0.4}
              stroke="var(--color-users)"
              stackId="a"
            />
          </AreaChart>
          <ChartLegend content={<ChartLegendContent />} />
        </ChartContainer>
      </div>
    </div>
  );
}
