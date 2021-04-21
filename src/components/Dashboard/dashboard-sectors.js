import React, {useContext, useState} from "react";
import {SymbolCacheContext} from "../../services/symbol-cache";
import {Box, Fade, FormControlLabel, makeStyles, Switch, Typography} from "@material-ui/core";
import {SectorChip} from "../SectorPage/sector-chip";
import Loader from "../Elements/Loader";
import BoxPaper from "../Elements/BoxPaper";

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        listStyle: 'none',
        padding: theme.spacing(0.5),
        margin: 0,
    }
}));


export function DashboardSectors (props) {

    const classes = useStyles();
    const ctx = useContext(SymbolCacheContext);

    const [checked, setChecked] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const handleChange = () => {
        setChecked((prev) => !prev);
    };

    const getChips = (f) => (
        ctx.cache.getSectors().filter(f).map(value => {
            return (
                <li key={value}>
                    <SectorChip value={value}/>
                </li>
            )
        })
    );

    if(ctx.cache.getSectors().length == 0) ctx.cache.loaded.subscribe(()=>{
        setLoaded(true);
    });


    return (
        <BoxPaper transparent={true}>
            <Typography variant={"h3"}>Popular lists</Typography>
            {ctx.cache.getSectors().length > 0
            ? <React.Fragment>
                <FormControlLabel
                    control={<Switch checked={checked} onChange={handleChange} />}
                    label="Show more"
                />
                <Box component="ul" className={classes.root}>
                    {getChips((value, i) => i < 10)}
                </Box>
                <Fade in={checked}>
                    <Box component="ul" className={classes.root}>
                        {getChips((value, i) => i >= 10)}
                    </Box>
                </Fade>
            </React.Fragment>
            : <Loader/>}
        </BoxPaper>
    );
}
