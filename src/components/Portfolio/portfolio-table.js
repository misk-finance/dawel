import React from "react";
import {
    Button,
    IconButton,
    Link,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@material-ui/core";
import {usePosition} from "../../services/position-history";
import BookmarkTwoToneIcon from "@material-ui/icons/BookmarkTwoTone";

export function PortfolioTable (props) {

    const posHook = usePosition();

    return (
        <TableContainer component={"div"}>
            <Table size={'small'}>
                <TableHead>
                    <TableRow>
                        <TableCell><Typography>SYMBOL</Typography></TableCell>
                        {!props.compact && <TableCell><Typography>NAME</Typography></TableCell> }
                        {!props.compact && <TableCell align="right">{props.shares && <Typography>QUANTITY</Typography>}</TableCell> }
                        <TableCell align="right"><Typography>CHANGE %</Typography></TableCell>
                        {!props.compact && <TableCell align="right">{props.shares && <Typography>GAIN/LOSS</Typography>}</TableCell> }
                        <TableCell align="right"><Typography>CURRENT VALUE</Typography></TableCell>
                        {!props.compact && <TableCell></TableCell> }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.symbols.map((val, index) => {
                        return (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row"><Link href={`/stocks/${val}`}>{val}</Link></TableCell>
                                {!props.compact && <TableCell>{props.names[parseInt(index)]}</TableCell> }
                                {!props.compact && <TableCell align="right">{props.shares && props.shares[parseInt(index)]}</TableCell> }
                                <TableCell align="right" style={{color:props.color[parseInt(index)]}}>{props.difference[parseInt(index)]}</TableCell>
                                {!props.compact && <TableCell align="right" style={{color:props.color[parseInt(index)]}}>{props.shares && props.change[parseInt(index)]}</TableCell> }
                                <TableCell align="right">SAR {props.value[parseInt(index)]}</TableCell>
                                {!props.compact && <TableCell>
                                    {props.shares
                                        ? <Button color={"secondary"} onClick={() => {
                                            posHook(() => props.handleStockSell(props.position[parseInt(index)],index));
                                        }}>SELL</Button>

                                        : <IconButton onClick={() => {props.handleWatchlist(props.symbols[parseInt(index)]);}}>
                                            <BookmarkTwoToneIcon/>
                                        </IconButton>
                                    }
                                </TableCell> }
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

}
