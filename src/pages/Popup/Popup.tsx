import React from 'react';
import dynamic from 'next/dynamic';
import logo from '../../assets/img/logo.svg';
//import Greetings from '../../containers/Greetings/Greetings';
import {
  Menu,
  Card,
  Button,
  CardBody,
  MenuItem,
  MenuList,
  CardHeader,
  Typography,
  MenuHandler,
} from "@material-tailwind/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// deepmerge
import merge from "deepmerge";
import './Popup.css';

// charts import
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// ApexCharts type import
import type { ApexAxisChartSeries } from "apexcharts";

interface ChartsPropsType {
  height: number;
  series: ApexAxisChartSeries;
  options: object;
}

function AreaChart({
  height = 350,
  series,
  colors,
  options,
}: Partial<ChartsPropsType> & {
  colors: string | string[];
}) {
  const chartOptions = React.useMemo(
    () => ({
      colors,
      ...merge(
        {
          chart: {
            height: height,
            type: "area",
            zoom: {
              enabled: false,
            },
            toolbar: {
              show: false,
            },
          },
          title: {
            text: "",
          },
          dataLabels: {
            enabled: false,
          },
          legend: {
            show: false,
          },
          markers: {
            size: 0,
            strokeWidth: 0,
            strokeColors: "transparent",
          },
          stroke: {
            curve: "smooth",
            width: 2,
          },
          grid: {
            show: true,
            borderColor: "#EEEEEE",
            strokeDashArray: 5,
            xaxis: {
              lines: {
                show: false,
              },
            },
            padding: {
              top: 5,
              right: 20,
            },
          },
          tooltip: {
            theme: "light",
          },
          yaxis: {
            labels: {
              show: false,
            },
          },
          xaxis: {
            axisTicks: {
              show: false,
            },
            axisBorder: {
              show: false,
            },
            labels: {
              show: false,
            },
          },
          fill: {
            type: "gradient",
            gradient: {
              shadeIntensity: 1,
              opacityFrom: 0,
              opacityTo: 0,
              stops: [0, 100],
            },
          },
        },
        options ? options : {},
      ),
    }),
    [height, colors, options],
  );

  return (
    <React.Suspense fallback={<div>Loading chart...</div>}>
      <Chart
        type="area"
        height={height}
        series={series as ApexAxisChartSeries}
        options={chartOptions}
      />
    </React.Suspense>
  );
}


const Popup = () => {
  // Dummy wallet/account data
  const account = {
    address: '0xA1b2...C3d4',
    balance: '2.345 ETH',
    fiat: '$7,123.45',
  };
  const activities = [
    { type: 'Sent', amount: '-0.5 ETH', to: '0xF1e2...B3c4', date: 'Jul 13' },
    { type: 'Received', amount: '+1.2 ETH', from: '0xD4c3...A2b1', date: 'Jul 12' },
    { type: 'Buy', amount: '+0.8 ETH', from: 'Exchange', date: 'Jul 10' },
  ];

  return (
    <div className="min-w-[350px] max-w-[400px] p-4 rounded-2xl shadow-xl bg-gradient-to-br from-[#232136] via-[#2d2346] to-[#3c246e] text-white">
      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Wallet Logo" className="w-9 h-9 drop-shadow-lg" />
          <Typography variant="h6" className="text-purple-300 font-bold tracking-wide">Quasar Wallet</Typography>
        </div>
        <Button size="sm" className="bg-[#3c246e] text-purple-200 border border-purple-500 rounded-lg shadow" variant="outlined">Mainnet</Button>
      </div>

      {/* Account Info */}
      <Card className="mb-4 bg-[#28243d] border-none shadow-lg rounded-xl">
        <CardBody className="flex flex-col items-center">
          <Typography variant="small" className="mb-1 text-purple-200">Account</Typography>
          <Typography variant="h5" className="mb-1 text-white font-mono">{account.balance}</Typography>
          <Typography variant="small" className="mb-2 text-purple-300">{account.fiat}</Typography>
          <div className="flex items-center gap-2 bg-[#232136] rounded px-2 py-1 text-xs text-purple-200">
            <span className="font-mono">{account.address}</span>
            <Button size="sm" className="p-1 text-purple-300 hover:bg-[#3c246e]" variant="text">Copy</Button>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between mb-4">
        <Button className="flex-1 mx-1 bg-gradient-to-r from-purple-600 to-purple-400 text-white font-semibold rounded-lg shadow hover:from-purple-700 hover:to-purple-500">Send</Button>
        <Button className="flex-1 mx-1 bg-gradient-to-r from-[#4f3c8e] to-[#7c3aed] text-white font-semibold rounded-lg shadow hover:from-[#5a3fa3] hover:to-[#8b5cf6]">Receive</Button>
        <Button className="flex-1 mx-1 bg-gradient-to-r from-[#3c246e] to-purple-600 text-white font-semibold rounded-lg shadow hover:from-[#4b2e8c] hover:to-purple-700">Buy</Button>
      </div>

      {/* Activity List */}
      <Card className="mb-4 bg-[#28243d] border-none shadow-lg rounded-xl">
        <CardHeader shadow={false} floated={false} className="rounded-none pb-0 bg-transparent">
          <Typography variant="small" className="text-purple-200">Activity</Typography>
        </CardHeader>
        <CardBody className="p-2">
          <ul className="divide-y divide-[#3c246e]">
            {activities.map((act, idx) => (
              <li key={idx} className="py-2 flex justify-between items-center text-sm">
                <span className="font-medium text-purple-100">{act.type}</span>
                <span className={act.amount.startsWith('-') ? 'text-red-400' : 'text-green-400'}>{act.amount}</span>
                <span className="text-purple-400">{act.date}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Chart & Stats (minimized, optional) */}
      <Card className="bg-[#28243d] border-none shadow-lg rounded-xl">
        <CardHeader shadow={false} floated={false} className="rounded-none pb-0 bg-transparent">
          <Typography variant="small" className="text-purple-200">Balance Trend</Typography>
        </CardHeader>
        <CardBody className="p-2">
          <AreaChart
            colors={["#7c3aed"]}
            options={{
              xaxis: {
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              },
              grid: { borderColor: "#3c246e" },
              tooltip: { theme: "dark" },
            }}
            series={[{ name: "ETH", data: [2, 2.1, 2.3, 2.5, 2.2, 2.4, 2.3, 2.5, 2.6, 2.7, 2.8, 2.9] }]}
            height={120}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default Popup;
