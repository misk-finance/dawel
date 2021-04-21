import React from "react";
import Chip from "@material-ui/core/Chip";
import {Avatar, makeStyles} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    chip: {
        margin: theme.spacing(0.5),
    },
}));

export function SectorChip (props) {

    const classes = useStyles();

    const getAvatarText = (str) => {
        return str.split(' ').map(value => value.charAt(0) != '&' ? value.charAt(0) : '').join('').substring(0,2).toUpperCase();
    }

    return (
        <Chip component="a" href={`/sectors/${props.value}`} clickable variant="outlined"
              avatar={<Avatar>{getAvatarText(props.value)}</Avatar>}
              label={props.value}
              className={classes.chip}  />
    )
}
