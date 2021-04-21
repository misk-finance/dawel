import React, {useEffect, useState} from "react";
import ReactApexChart from "react-apexcharts";
import {useTheme} from "@material-ui/core";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import BoxPaper from "../Elements/BoxPaper";

export function SymbolCandlechart (props) {

    const theme = useTheme();

    const [period, setPeriod] = useState('d');

    const periodChange = (event, value) => {
        setPeriod(value);
    };

    useEffect(()=> {
        switch (period) {
            case 'm':
                props.getOneMonthChart();
                break;
            case 'y':
                props.getOneYearChart();
                break;
            default:
                props.getOneDayChart();
        }

    }, [period, theme]);

    let maxCandles = 20;
    let d = props.data.length - 1 - maxCandles;

    let firstDate = props.data[Math.max(0, d)].x.getTime();
    let lastDate = props.data[props.data.length - 1].x.getTime();

    //useEffect(() => {},[theme]);

    return (
        <BoxPaper>
            <ToggleButtonGroup
                value={period}
                exclusive
                onChange={periodChange}
            >
                <ToggleButton value="d">
                    day
                </ToggleButton>
                <ToggleButton value="m">
                    month
                </ToggleButton>
                <ToggleButton value="y">
                    year
                </ToggleButton>
            </ToggleButtonGroup>

            <ReactApexChart type="candlestick"
                             height={300}
                             series={[{data: props.data}]}
                             options={{
                                 chart: {
                                     id: 'candles',
                                     type: 'candlestick',
                                     height: 300,
                                     toolbar: {
                                         autoSelected: 'pan',
                                         show: false
                                     },
                                     zoom: {
                                         enabled: false
                                     },
                                 },
                                 xaxis: {
                                     type: 'datetime'
                                 },
                                 yaxis: {
                                     tooltip: {
                                         enabled: true
                                     }
                                 },
                                 theme: {
                                     mode: theme.palette.type
                                 }
                             }}
            />
            <ReactApexChart type="bar"
                            height={150}
                            series={[{name:'volume', data: props.volume}]}
                            options={{
                                chart: {
                                    height: 150,
                                    type: 'bar',
                                    brush: {
                                        enabled: true,
                                        target: 'candles'
                                    },
                                    selection: {
                                        enabled: true,
                                        xaxis: {
                                            min: firstDate,
                                            max: lastDate
                                        },
                                    },
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                xaxis: {
                                    type: 'datetime',
                                },
                                yaxis: {
                                    labels: {
                                        show: false
                                    }
                                },
                                theme: {
                                    mode: theme.palette.type
                                }
                            }}
            />
        </BoxPaper>
    );
}
