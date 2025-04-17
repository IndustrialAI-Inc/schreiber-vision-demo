"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const recentSpecsData = [
  {
    company: "ABC",
    number: "1234567890",
    match: "Very high",
    confirmation: "Approved",
    orderNumber: "1234567890",
    date: "Today at 10:24 AM",
  },
  {
    company: "QWE",
    number: "1234567890",
    match: "Very high",
    confirmation: "Approve",
    orderNumber: "1234567890",
    date: "",
  },
  {
    company: "RTY",
    number: "1234567890",
    match: "Low",
    confirmation: "Review",
    orderNumber: "1234567890",
    date: "Jan 21, 2025 at 10:40 AM",
  },
];

const RecentSpecs = () => {
  return (
    <Card className="bg-fulldark50 border-bright20 backdrop-blur-sm">
      <CardHeader className="flex items-center justify-between py-4 px-6">
        <CardTitle className="text-xl">Recent docs</CardTitle>
        <Button
          variant="outline"
          className="h-8 px-3 text-xs bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
        >
          See all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Company
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Number
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Match
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Confirmation
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Order Number
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-zinc-400">
                  Date modified
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSpecsData.map((doc, index) => (
                <tr
                  key={index}
                  className={
                    index !== recentSpecsData.length - 1
                      ? "border-b border-zinc-700"
                      : ""
                  }
                >
                  <td className="py-4 px-6 text-sm">{doc.company}</td>
                  <td className="py-4 px-6 text-sm">{doc.number}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        doc.match === "Very high"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {doc.match}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm">{doc.confirmation}</td>
                  <td className="py-4 px-6 text-sm">{doc.orderNumber}</td>
                  <td className="py-4 px-6 text-sm">{doc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSpecs;
