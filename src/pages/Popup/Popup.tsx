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
    <div className="min-w-[350px] max-w-[400px] p-4 bg-white rounded-lg shadow-lg">
      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Wallet Logo" className="w-8 h-8" />
          <Typography variant="h6" color="blue-gray">Quasar Wallet</Typography>
        </div>
        <Button size="sm" color="gray" variant="outlined">Mainnet</Button>
      </div>

      {/* Account Info */}
      <Card className="mb-4 border border-gray-200">
        <CardBody className="flex flex-col items-center">
          <Typography variant="small" color="gray" className="mb-1">Account</Typography>
          <Typography variant="h5" color="blue-gray" className="mb-1">{account.balance}</Typography>
          <Typography variant="small" color="gray" className="mb-2">{account.fiat}</Typography>
          <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-xs text-gray-700">
            <span>{account.address}</span>
            <Button size="sm" color="gray" variant="text" className="p-1">Copy</Button>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between mb-4">
        <Button color="blue" className="flex-1 mx-1">Send</Button>
        <Button color="green" className="flex-1 mx-1">Receive</Button>
        <Button color="amber" className="flex-1 mx-1">Buy</Button>
      </div>

      {/* Activity List */}
      <Card className="mb-4 border border-gray-200">
        <CardHeader shadow={false} floated={false} className="rounded-none pb-0">
          <Typography variant="small" color="gray">Activity</Typography>
        </CardHeader>
        <CardBody className="p-2">
          <ul className="divide-y divide-gray-100">
            {activities.map((act, idx) => (
              <li key={idx} className="py-2 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{act.type}</span>
                <span className={act.amount.startsWith('-') ? 'text-red-500' : 'text-green-500'}>{act.amount}</span>
                <span className="text-gray-400">{act.date}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Chart & Stats (minimized, optional) */}
      <Card className="border border-gray-200">
        <CardHeader shadow={false} floated={false} className="rounded-none pb-0">
          <Typography variant="small" color="gray">Balance Trend</Typography>
        </CardHeader>
        <CardBody className="p-2">
          <AreaChart
            colors={["#4CAF50"]}
            options={{
              xaxis: {
                categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              },
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
