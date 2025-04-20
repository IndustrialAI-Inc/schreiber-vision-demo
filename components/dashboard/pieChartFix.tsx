"use client";

import * as React from "react";
import { TrendingUp, MoreHorizontal } from "lucide-react";
import { Label, Pie, PieChart, ResponsiveContainer } from "recharts";
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
  { supplier: "wixon", amount: 35, fill: "var(--color-chart-1)" },
  { supplier: "schreiberFoods", amount: 77, fill: "var(--color-chart-9)" },
  { supplier: "lyonsMagnus", amount: 43, fill: "var(--color-chart-3)" },
  { supplier: "givaudanFlavors", amount: 32, fill: "var(--color-chart-4)" },
  { supplier: "gossnerFoods", amount: 31, fill: "var(--color-chart-5)" },
  { supplier: "onlyWhatYouNeed", amount: 28, fill: "var(--color-chart-6)" },
  { supplier: "hilmar", amount: 28, fill: "var(--color-chart-7)" },
  { supplier: "schreiberMexico", amount: 25, fill: "var(--color-chart-8)" },
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
  schreiberFoods: {
    label: "Schreiber Foods",
    color: "hsl(var(--chart-3))",
  },
  lyonsMagnus: {
    label: "Lyons Magnus",
    color: "hsl(var(--chart-3))",
  },
  givaudanFlavors: {
    label: "Givaudan Flavors Corporation",
    color: "hsl(var(--chart-3))",
  },
  gossnerFoods: {
    label: "Gossner Foods",
    color: "hsl(var(--chart-3))",
  },
  onlyWhatYouNeed: {
    label: "Only What You Need",
    color: "hsl(var(--chart-3))",
  },
  hilmar: {
    label: "Hilmar Cheese CO INC",
    color: "hsl(var(--chart-3))",
  },
  schreiberMexico: {
    label: "Schreiber Mexico",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function PieChartFixComponent() {
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
        <div className="mx-auto h-64 w-full min-w-[300px] min-h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="supplier"
                  innerRadius="50%"
                  outerRadius="80%"
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
                              className="fill-foreground text-2xl font-bold"
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
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:justify-center"
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
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