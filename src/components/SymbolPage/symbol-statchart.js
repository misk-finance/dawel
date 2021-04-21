import {Typography, useTheme} from "@material-ui/core";
import React, {useContext, useState} from "react";
import {Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {ApiContext} from "../../services/rapidapi";
import BoxPaper from "../Elements/BoxPaper";


const moduleDic = {
    incomeStatementHistory: 'incomeStatementHistory',
    balanceSheetHistory: 'balanceSheetStatements',
}

export function SymbolStatchart (props) {

    const ac = useContext(ApiContext);

    const theme = useTheme();

    const [chartData, setChartData] = useState([]);

    const {data, status, error} = ac.api.useQuoteSummaryQuery(props.symbol)();

    if(chartData.length == 0 && data) {
        let result = data.result[0];

        let f = (y, key) => {
            let ret = 0;
            if(y){
                let s = key.split(',');
                if(s.length > 1){
                    ret = s.reduce((previousValue, currentValue) => {
                        let p = y[previousValue] ? y[previousValue].raw : 0;
                        let c = y[currentValue] ? y[currentValue].raw : 0;
                        return p + c;
                    });
                } else {
                    ret = y[key].raw;
                }
            }
            return ret/1000000000;
        }

        let makeDataItem = (module, name, key) => {
            let history = result[module][moduleDic[module]];
            let cy = history[0];
            let py = history[1];

            return {
                name: name,
                cy: f(cy, key),
                py: f(py, key),
            }
        }

        setChartData([
            makeDataItem('incomeStatementHistory', 'Revenue', 'totalRevenue'),
            makeDataItem('incomeStatementHistory', 'Gross Profit', 'grossProfit'),
            makeDataItem('incomeStatementHistory', 'EBIT', 'ebit'),

            makeDataItem('balanceSheetHistory', 'Cash', 'cash'),
            makeDataItem('incomeStatementHistory', 'Net income available to common stackholders', 'netIncomeApplicableToCommonShares'),
            makeDataItem('balanceSheetHistory', 'Debt', 'longTermDebt,shortLongTermDebt'),
        ]);
    }



    return (
        <React.Fragment>
            <Typography variant="h3">History</Typography>
            <BoxPaper transparent={true}>
                <ResponsiveContainer minWidth={400} width="100%" height={400}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke={theme.palette.text.primary}/>
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip contentStyle={{'background-color':'#333333'}}/>
                        <Legend />
                        <Bar name="2020" dataKey="cy" fill={theme.palette.primary.main} />
                        <Bar name="2019" dataKey="py" fill={theme.palette.secondary.main} />
                    </BarChart>
                </ResponsiveContainer>
            </BoxPaper>
        </React.Fragment>
    );
}
