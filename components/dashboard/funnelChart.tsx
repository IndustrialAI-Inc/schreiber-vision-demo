import React from "react";
import {
  FunnelChart,
  Funnel,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { MoreHorizontal } from "lucide-react";

const DocumentApprovalFunnel = () => {
  const data = [
    { name: "Waiting for supplier approval", value: 45, fill: "#3b82f6" },
    { name: "Waiting for customer approval", value: 32, fill: "#60a5fa" },
    { name: "Fully approved", value: 18, fill: "#93c5fd" },
  ];

  return (
    <div className="text-gray-100 rounded-lg w-full">
      <div className="mb-8">
        {/* <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-medium">Document Approval Status</h2>
          <button className="text-gray-400 hover:text-gray-200">
            <MoreHorizontal size={20} />
          </button>
        </div> */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-4xl font-semibold">{data[2].value}</span>
            <div className="ml-2 flex items-center text-green-400 text-sm">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 01-1 1H9a1 1 0 01-1-1V6a1 1 0 011-1h2a1 1 0 011 1v1zm-1 4a1 1 0 00-1-1H9a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1v-1z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                  clipRule="evenodd"
                />
              </svg>
              +15% from last month
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 10, right: 120, bottom: 10, left: 10 }}>
            <Tooltip
              formatter={(value: number) => [`${value} documents`, "Count"]}
              contentStyle={{
                backgroundColor: "#1f2937",
                borderRadius: "0.375rem",
                border: "1px solid #374151",
                color: "#f3f4f6",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              labelStyle={{ color: "#f3f4f6" }}
              itemStyle={{ color: "#f3f4f6" }}
            />
            <Funnel dataKey="value" data={data} isAnimationActive>
              <LabelList
                position="right"
                fill="#f3f4f6"
                stroke="none"
                dataKey="name"
                className="text-xs font-medium"
                width={100}
                offset={58}
              />
              <LabelList
                position="right"
                fill="#f3f4f6"
                stroke="none"
                dataKey="value"
                className="text-xs font-bold"
                offset={10}
                formatter={(value: number) => `${value} docs`}
              />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <div className="flex justify-between items-center">
          <span>Updated just now</span>
          <button className="text-blue-400 hover:text-blue-300">
            See details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentApprovalFunnel;
