"use client";

import { TrendingUp, MoreHorizontal } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ];

const chartData = [
  { month: "January", desktop: 15 },
  { month: "February", desktop: 30 },
  { month: "March", desktop: 25 },
  { month: "April", desktop: 35 },
  { month: "May", desktop: 32 },
  { month: "June", desktop: 40 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--color-mainred)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--color-mainblue)",
  },
} satisfies ChartConfig;

export default function AreaChartComponent() {
  return (
    <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center backdrop-blur-sm col-span-2 pt-6">
      <CardContent>
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl font-medium text-bright">
              Total specs
            </CardTitle>
            <CardDescription>
              Showing total specs for the last 6 months
            </CardDescription>
          </div>
          <MoreHorizontal className="h-5 w-5 text-bright" />
        </div>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 24,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              fillOpacity={0.4}
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
