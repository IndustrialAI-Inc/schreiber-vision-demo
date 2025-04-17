"use client";

import { TrendingUp, MoreHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
const chartData = [
  {
    status: "Waiting for supplier approval",
    specs: 12,
    fill: "var(--color-mainblue80)",
  },
  {
    status: "Waiting for Schreiber approval",
    specs: 10,
    fill: "var(--color-mainblue70)",
  },
  { status: "Fully approved", specs: 17, fill: "var(--color-mainblue60)" },
];

const chartConfig = {
  waitingForSupplier: {
    label: "Waiting for supplier approval",
    color: "hsl(var(--chart-1))",
  },
  waitingForSchreiber: {
    label: "Waiting for Schreiber approval",
    color: "hsl(var(--chart-2))",
  },
  fullyApproved: {
    label: "Fully approved",
    color: "hsl(var(--background))",
  },
} satisfies ChartConfig;

export default function BarChartComponent() {
  return (
    <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center backdrop-blur-sm col-span-2 pt-6">
      <CardContent>
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-xl font-medium text-bright">
              Specs status
            </CardTitle>
            <CardDescription>
              Showing total specs status for the last month
            </CardDescription>
          </div>
          <MoreHorizontal className="h-5 w-5 text-bright" />
        </div>
        <ChartContainer config={chartConfig} className="pt-6">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="status"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              hide
            />
            <XAxis dataKey="specs" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="specs"
              layout="vertical"
              fill="var(--color-mainblue)"
              radius={4}
            >
              <LabelList
                dataKey="status"
                position="insideLeft"
                offset={8}
                className="fill-[--color-bright] font-semibold"
                fontSize={14}
              />
              <LabelList
                dataKey="specs"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}
