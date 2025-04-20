"use client"
import { useEffect, useState, useRef } from "react"
import { TrendingUp, MoreHorizontal } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Custom tick component with space awareness
const CustomizedAxisTick = (props) => {
  const { x, y, payload, tickWidth } = props;
  
  // Function to handle text wrapping based on available width
  const wrapText = (text, maxWidth) => {
    if (!text) return [""];
    
    // Estimate characters that fit in available width (rough approximation)
    // Assumes each character is about 7px wide for a 12px font
    const charsPerLine = Math.max(3, Math.floor(maxWidth / 7));
    
    if (text.length <= charsPerLine) return [text];
    
    const words = text.toString().split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
      if (currentLine.length + words[i].length + 1 <= charsPerLine) {
        currentLine += ' ' + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Limit to 2 lines max with ellipsis if needed
    if (lines.length > 2) {
      lines.splice(2);
      const lastLine = lines[1];
      if (lastLine.length > 3) {
        lines[1] = lastLine.substring(0, lastLine.length - 3) + '...';
      }
    }
    
    return lines;
  };
  
  // Calculate available width for this tick
  const availableWidth = tickWidth || 60; // Default to 60px if not provided
  
  const lines = wrapText(payload.value, availableWidth);
  
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={index * 12}
          dy={16}
          textAnchor="middle"
          fontSize={12}
          className="fill-muted-foreground"
        >
          {line}
        </text>
      ))}
    </g>
  );
};

const chartData = [
  { status: "Spec in progress", suppliers: 36, fill: "var(--color-mainblue70)" },
  { status: "Waiting for Schreiber approval", suppliers: 25, fill: "var(--color-mainblue80)" },
  { status: "Waiting for Supplier approval", suppliers: 31, fill: "var(--color-mainblue90)" },
  { status: "Fully approved", suppliers: 58, fill: "var(--color-mainblue)" },
]

const chartConfig = {
  desktop: {
    label: "Supplier",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function SpecStatusChart() {
  const containerRef = useRef(null);
  const [tickWidth, setTickWidth] = useState(60);
  
  // Calculate the width available per tick based on container size
  useEffect(() => {
    const updateTickWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Subtract margins and padding (approximate)
        const availableWidth = containerWidth - 60;
        // Divide by number of data points
        const calculatedTickWidth = availableWidth / chartData.length;
        // Set a minimum width to ensure some text is visible
        setTickWidth(Math.max(30, calculatedTickWidth));
      }
    };
    
    // Initial calculation
    updateTickWidth();
    
    // Recalculate on window resize
    window.addEventListener('resize', updateTickWidth);
    return () => window.removeEventListener('resize', updateTickWidth);
  }, []);
  
  return (
    <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center backdrop-blur-sm col-span-2 row-span-1 pt-6">
      <CardContent ref={containerRef}>
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
            margin={{
              top: 20,
              bottom: 40,
              left: 20,
              right: 20
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="status"
              tickLine={false}
              axisLine={false}
              // height={20}
              tick={<CustomizedAxisTick tickWidth={tickWidth} />}
              interval={0} // Force display of all ticks
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="suppliers" fill="var(--color-desktop)" radius={8}>
              <LabelList
                dataKey="suppliers"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}