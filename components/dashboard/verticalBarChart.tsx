"use client";
import { MoreHorizontal, TrendingDown } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const data = [
  { name: "1", item1: 4, item2: 3 },
  { name: "2", item1: 5, item2: 4 },
  { name: "3", item1: 6, item2: 5 },
  { name: "4", item1: 4, item2: 6 },
  { name: "5", item1: 5, item2: 3 },
  { name: "6", item1: 7, item2: 6 },
  { name: "7", item1: 5, item2: 8 },
  { name: "8", item1: 6, item2: 5 },
  { name: "9", item1: 7, item2: 6 },
  { name: "10", item1: 8, item2: 7 },
  { name: "11", item1: 7, item2: 8 },
  { name: "12", item1: 8, item2: 7 },
];

const VerticalBarChart = () => {
  return (
    <Card className="bg-fulldark50 border-bright20 backdrop-blur-sm row-span-1 col-span-2 pt-6">
      <CardContent className="flex flex-col gap-4 h-full">
        <div className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl font-medium text-bright">
            Total specs
          </CardTitle>
          <MoreHorizontal className="h-5 w-5 text-bright" />
        </div>
        <div className="text-4xl font-semibold mb-2">
          7<span className="text-xl text-zinc-400 font-normal ml-1">days</span>
        </div>
        <div className="inline-flex items-center text-xs mb-3">
          <TrendingDown className="w-4 h-4 text-green-400 mr-1" />
          <span className="text-green-400 mr-1 font-bold">-15%</span>
          <span className="text-bright">from last month</span>
        </div>

        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                }}
              />
              <Legend
                align="right"
                verticalAlign="top"
                wrapperStyle={{ paddingBottom: "10px" }}
              />
              <Bar
                dataKey="item1"
                name="Item 1"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="item2"
                name="Item 2"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerticalBarChart;
