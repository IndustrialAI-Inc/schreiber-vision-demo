"use client";

import * as React from "react";
import { TrendingUp, MoreHorizontal } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartData = [
  {
    supplier: "salmans",
    amount: 84,
    fill: "var(--color-mainred)",
  },
  {
    supplier: "customFruits",
    amount: 63,
    fill: "var(--color-mainblue)",
  },
  { supplier: "wixon", amount: 35, fill: "var(--color-dark)" },
];

const chartConfig = {
  suppliers: {
    label: "Suppliers",
  },
  salmans: {
    label: "Salmans and Associates Incorporated",
    color: "hsl(var(--chart-1))",
  },
  customFruits: {
    label: "California Custom Fruits and Flavors Inc",
    color: "hsl(var(--chart-2))",
  },
  wixon: {
    label: "Wixon Inc",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function PieChartComponent() {
  const totalSpecs = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0);
  }, []);

  return (
    <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center backdrop-blur-sm col-span-2 row-span-2 pt-6">
      <CardContent className="flex-1 pb-0">
        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-col">
            <CardTitle className="text-xl font-medium text-bright">
              Top 3 suppliers
            </CardTitle>
            <CardDescription>Amount of specs created per supplier since 2022</CardDescription>
          </div>
          <MoreHorizontal className="h-5 w-5 text-bright" />
        </div>
        <ChartContainer config={chartConfig} className="mx-auto max-h-[300px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="supplier"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalSpecs.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Specs
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="supplier" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/2 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter> */}
    </Card>
  );
}
