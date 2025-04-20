"use client";

import {
  MoreHorizontal,
  PlusCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PieChartComponent from "@/components/dashboard/pieChart";
import AreaChartComponent from "@/components/dashboard/areaChart";
import DocumentApprovalFunnel from "@/components/dashboard/funnelChart";
import BarChartComponent from "@/components/dashboard/barChart";
import VerticalBarChart from "@/components/dashboard/verticalBarChart";
import SpecStatusChart from "@/components/dashboard/barChartLabel";

const DashboardPage = () => {
  return (
    <div className="flex h-screen bg-fulldark/80 text-white">
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[url(/images/dark-background.webp)] bg-cover bg-top-right bg-fixed">
        <div className=" mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Good morning, Erica</h1>
              <p className="text-zinc-400 mt-1">
                Here's an overview of your statistics and status
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-mainred to-mainblue opacity-75 blur"></div>
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-mainred to-mainblue"></div>
                <div className="relative flex items-center justify-center rounded-[12px] text-slate-300">
                  <Button className="gap-2 bg-zinc-800 hover:bg-zinc-800/90 text-white border border-zinc-700">
                    {/* <MessageSquare className="h-4 w-4" /> */}
                    Chat with AI Assistant
                  </Button>
                </div>
              </div>
              <Button className="gap-2 bg-zinc-800 border border-bright rounded-[12px] hover:bg-zinc-700 text-bright">
                <PlusCircle className="h-4 w-4" />
                Create doc
              </Button>
            </div>
          </div>

          {/* Top Row */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card className="bg-[url(/images/card-background.webp)] rounded-[12px] border-none bg-black-0 bg-cover flex flex-col justify-center pt-6">
              <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-row justify-between items-center">
                  <CardTitle className="text-xl font-medium text-bright">
                    Specs approved
                  </CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-bright" />
                </div>
                <div className="text-5xl font-semibold">45</div>
                <div>
                  <div className="inline-flex items-center text-xs font-medium bg-[#F6F6F6]/85 rounded-[12px] px-2 py-0.5">
                    <TrendingUp className="w-4 h-4 text-[#1F8020] mr-1" />
                    <span className="text-[#1F8020] mr-1 font-bold">-15%</span>
                    <span className="text-dark">from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center min-h-[170px] backdrop-blur-sm pt-6">
              <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-row justify-between items-center">
                  <CardTitle className="text-xl font-medium text-bright">
                    Avg. time per spec
                  </CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-bright" />
                </div>
                <div className="text-5xl font-semibold">
                  5
                  <span className="text-xl text-zinc-400 font-normal ml-1">
                    days
                  </span>
                </div>
                <div>
                  <div className="inline-flex items-center text-xs font-medium px-1 py-0.5">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 mr-1 font-bold">-15%</span>
                    <span className="text-bright">from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <PieChartComponent />

            <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center min-h-[170px] backdrop-blur-sm pt-6">
              <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-row justify-between items-start">
                  <CardTitle className="text-xl font-medium text-bright">
                    Suppliers with incomplete specs
                  </CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-bright" />
                </div>
                <div className="text-5xl font-semibold">12</div>
                <div>
                  <div className="inline-flex items-center text-xs font-medium px-1 py-0.5">
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-red-500 mr-1 font-bold">-15%</span>
                    <span className="text-bright">from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center min-h-[170px] backdrop-blur-sm pt-6">
              <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-row justify-between items-center">
                  <CardTitle className="text-xl font-medium text-bright">
                    Incomplete specs
                  </CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-bright" />
                </div>
                <div className="text-5xl font-semibold">23</div>
                <div>
                  <div className="inline-flex items-center text-xs font-medium px-1 py-0.5">
                    <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-green-400 mr-1 font-bold">-15%</span>
                    <span className="text-bright">from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <BarChartComponent /> */}
            <SpecStatusChart />
            <AreaChartComponent />
            <VerticalBarChart />

            <Card className="bg-fulldark50 border-bright20 flex flex-col justify-center min-h-[170px] backdrop-blur-sm col-span-2 pt-6">
              <CardContent className="flex flex-col gap-4 h-full">
                <div className="flex flex-row justify-between items-center">
                  <CardTitle className="text-xl font-medium text-bright">
                    Incomplete specs
                  </CardTitle>
                  <MoreHorizontal className="h-5 w-5 text-bright" />
                </div>
                <DocumentApprovalFunnel />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
