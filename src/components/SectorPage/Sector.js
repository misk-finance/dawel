import React, {useContext, useEffect, useState} from "react";
import {SymbolCacheContext} from "../../services/symbol-cache";
import {useParams} from "react-router-dom";

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';

import {Grid, Link, Typography} from "@material-ui/core";
import {ApiContext} from "../../services/rapidapi";
import BoxPaper from "../Elements/BoxPaper";
import Loader from "../Elements/Loader";


export function Sector (props) {

    const sc = useContext(SymbolCacheContext);
    const ac = useContext(ApiContext);

    let {sector} = useParams();

    const [items, setItems] = useState([]);
    const [itemCount, setItemCount] = useState(0);
    const [cacheLoaded, setCacheLoaded] = useState(false);

    let limit = 10;

    const getSymbolsToQuery = () => {
        return sc.cache.getItemsForSector(sector).filter((collection, index) => index >= itemCount && index < itemCount + limit).map(item => item.symbol)
    };

    const showFetch = () => {
        return items.length > 0 && items.length < sc.cache.getItemsForSector(sector).length;
    }

    const {
        data,
        fetchNextPage,
        isFetching,
    } = ac.api.useFetchBulkQuotesQuery(getSymbolsToQuery(), {
        refetchOnWindowFocus: false,
        enabled: false,
        getNextPageParam: (lastPage, pages) => {
            return getSymbolsToQuery()
        }
    })();

    useEffect(()=> {
        if(!cacheLoaded) sc.cache.loaded.subscribe(() => {
            setCacheLoaded(true);
        });

        if(cacheLoaded && !data) fetchNextPage();

        if(data && data.pages){
            let newItems = [];
            data.pages.forEach((value) => {
                newItems = newItems.concat(value.result)
            });
            setItems(newItems);
            setItemCount(newItems.length);
        }

    }, [sector, cacheLoaded, data]);

    document.title = `${props.title} - ${sector}`;

    return (
        <Grid container>
            <Grid item md={9}>
                <Typography variant={'h2'}>{sector}</Typography>
                <BoxPaper transparent={true}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography>Name</Typography></TableCell>
                                    <TableCell align="right"><Typography>Symbol</Typography></TableCell>
                                    <TableCell align="right"><Typography>Price</Typography></TableCell>
                                    <TableCell align="right"><Typography>Change %</Typography></TableCell>
                                    <TableCell align="right"><Typography>Market cap</Typography></TableCell>
                                    <TableCell align="right"><Typography>P/E</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.symbol}>
                                        <TableCell component="th" scope="row">{item.longName}</TableCell>
                                        <TableCell align="right"><Link href={`/stocks/${item.symbol}`}>{item.symbol}</Link></TableCell>
                                        <TableCell align="right">{item.regularMarketPrice.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.regularMarketChangePercent.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.marketCap}</TableCell>
                                        <TableCell align="right">{item.forwardPE && item.forwardPE.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {showFetch() && <Button variant="contained" color="primary"  onClick={() => fetchNextPage()}>Fetch more</Button>}
                    {items.length == 0 && <Loader/>}
                </BoxPaper>
            </Grid>
        </Grid>
    );
}
