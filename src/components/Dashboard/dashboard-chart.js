import {useTheme} from "@material-ui/core";
import React, {useContext, useEffect, useState} from "react";
import {PositionContext, usePosition} from "../../services/position-history";
import BoxPaper from "../Elements/BoxPaper";
import ReactApexChart from "react-apexcharts";


export function DashboardChart (props) {

    const pos = useContext(PositionContext);

    const theme = useTheme();
    const posHook = usePosition();

    const [data, setData] = useState([]);
    const [currValue, setCurrValue] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {},[theme]);

    if(!loading) {
        setLoading(true);
        pos.position.loadHistory$().subscribe(value => {
            let newData = value.docs.map(doc => {
                return {
                    date: doc.data().timestamp.toDate(),
                    value: parseFloat(doc.data().value).toFixed(0),
                }
            }).sort((a, b) => a.date - b.date);

            setData(newData)

            posHook((v) => setCurrValue([{date: new Date(), value: parseFloat(v).toFixed(0)}]), true);
        });
    }

    return (
        <BoxPaper>
            <ReactApexChart type="line"
                            height={200}
                            series={[{name: 'Portfolio Value', data: data.concat(currValue).map(i=>{return {x: i.date, y: i.value}})}]}
                            options={{
                                chart: {
                                    type: 'line',
                                    height: 300,
                                    zoom: {
                                        enabled: false
                                    },
                                },
                                dataLabels: {
                                    enabled: false
                                },
                                xaxis: {
                                    type: 'datetime'
                                },
                                theme: {
                                    mode: theme.palette.type
                                }
                            }}
            />
            {/*<ResponsiveContainer minWidth={400} width="90%" height={200}>
                <LineChart data={data.concat(currValue)}>
                    <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main}/>
                    {data.length>0 && <XAxis dataKey="date" domain = {[new Date().getTime - 1000000, 'dataMax']} tickFormatter = {(unixTime) => moment(unixTime).format('D/M HH:mm')} stroke={theme.palette.text.primary}/> }
                    {data.length>0 && <YAxis domain ={['dataMin-1000', 'dataMax+1000']} stroke={theme.palette.text.secondary} /> }
                    <Tooltip/>
                </LineChart>
            </ResponsiveContainer>*/}
        </BoxPaper>
    );
}
