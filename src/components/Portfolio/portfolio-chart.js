import {useTheme} from "@material-ui/core";
import React from "react";
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";


export function PortfolioChart (props) {

    const data = [
        {name: 'Cash', value: parseFloat(props.cash)},
        {name: 'Stocks', value: props.stocks}
    ];

    const theme = useTheme();

    const COLORS = [theme.palette.primary.main, theme.palette.secondary.main];


    console.log()

    return (
            <ResponsiveContainer minWidth={200} width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={data}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Legend/>
                    <Tooltip/>
                </PieChart>
            </ResponsiveContainer>

    );
}
