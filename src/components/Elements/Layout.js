import React, {useContext, useState} from "react";
import {
    AppBar,
    Box,
    Button,
    Container,
    Divider,
    Drawer,
    Grid,
    Hidden,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    makeStyles,
    TextField,
    Toolbar,
    Typography,
    useTheme
} from "@material-ui/core";
import MenuIcon from '@material-ui/icons/Menu';
import HomeOutlinedIcon from '@material-ui/icons/HomeOutlined';
import PieChartOutlinedIcon from '@material-ui/icons/PieChartOutlined';
import BookmarkBorderOutlinedIcon from '@material-ui/icons/BookmarkBorderOutlined';
import ExitToAppOutlinedIcon from '@material-ui/icons/ExitToAppOutlined';
import Brightness4OutlinedIcon from '@material-ui/icons/Brightness4Outlined';
import SearchOutlinedIcon from '@material-ui/icons/SearchOutlined';
import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';

import {Link, NavLink, useHistory} from "react-router-dom";
import {logout} from "../auth";
import {Autocomplete, ToggleButton, ToggleButtonGroup} from "@material-ui/lab";
import {SymbolCacheContext} from "../../services/symbol-cache";
import {PositionContext} from "../../services/position-history";

const drawerWidth = 64;

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    drawer: {
        [theme.breakpoints.up('sm')]: {
            width: drawerWidth,
            flexShrink: 0,
        },
    },
    appBar: {
        [theme.breakpoints.up('sm')]: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
        },
    },
    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
        width: drawerWidth,
        overflow: "hidden"
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
}));

const Layout = (props) => {

    const { window } = props;

    const classes = useStyles();
    const theme = useTheme();
    const history = useHistory();
    const sc = useContext(SymbolCacheContext);
    const pos = useContext(PositionContext);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [themeMode, setThemeMode] = useState(null);
    const [searchOptions, setSearchOptions] = useState([]);
    const [funds, setFunds] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    if(!themeMode) setThemeMode(theme.palette.type);

    const handleThemeMode = (event, value) => {
        let mode = value ? value: 'light';
        props.setTheme(mode);
        setThemeMode(mode);
    };

    const searchStocks = (filter) => {
        if(filter == ''){
            setSearchOptions([]);
            return;
        }
        setSearchOptions(sc.cache.collection.filter(item =>  (item.symbol.match(new RegExp(filter, 'i')) || item.lonaName.match(new RegExp(filter, 'i')))));
    }

    pos.position.getCache$().subscribe(value => {
        setFunds(parseFloat(value.data().currentfunds));
    });



    const drawer = (
        <aside>
            <div className={classes.toolbar} />
            <Divider />
            <List>
                <ListItem button component={NavLink} to="/dashboard" activeClassName="Mui-selected" exact>
                    <ListItemIcon>
                        <HomeOutlinedIcon color={"primary"}/>
                    </ListItemIcon>

                </ListItem>
                <ListItem button component={NavLink} to="/portfolio" activeClassName="Mui-selected" exact>
                    <ListItemIcon>
                        <PieChartOutlinedIcon color={"primary"}/>
                    </ListItemIcon>
                </ListItem>
                <ListItem button component={NavLink} to="/watchlist" activeClassName="Mui-selected" exact>
                    <ListItemIcon>
                       <BookmarkBorderOutlinedIcon color={"primary"}/>
                    </ListItemIcon>
                </ListItem>
            </List>
            <Divider />

            <Box p={1}>
                <ToggleButtonGroup
                    value={themeMode}
                    exclusive
                    onChange={handleThemeMode}
                >
                    <ToggleButton value="dark">
                        <Brightness4OutlinedIcon/>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Divider />

            <List>
                <ListItem button onClick={() => logout()}>
                    <ListItemIcon>
                        <ExitToAppOutlinedIcon/>
                    </ListItemIcon>
                </ListItem>
            </List>
            <Grid container alignItems={"center"} justify={"center"} style={{height: '64%'}}>
                <Grid item>
                    <Box style={{transform: 'rotate(-90deg)'}}>
                    <Typography variant={'h5'} style={{whiteSpace: 'nowrap'}}>Market status: open</Typography>
                    </Box>
                </Grid>
            </Grid>
        </aside>
    );

    const topbar = (
        <Grid container alignItems={"stretch"}>
            <Grid item md={6}>
                <Autocomplete
                    fullWidth={true}
                    options={searchOptions}
                    onInputChange={(event, newInputValue) => {
                        searchStocks(newInputValue)
                    }}
                    onChange={(event, value) => history.push(`/stocks/${value.symbol}`)}
                    getOptionLabel={(option) => option.symbol}
                    filterOptions = {(option, value) => {
                        return option;
                    }}
                    renderInput={(params) => {
                        params.InputProps.startAdornment = <>
                            <InputAdornment position="start">
                                <SearchOutlinedIcon />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                        </>;
                        return <TextField {...params}
                            variant={'outlined'}
                            placeholder={'Search by symbol or name'}
                        />}}
                    renderOption={(option, { selected }) => (<div>
                        <Typography variant={'h5'}>{option.symbol}</Typography>
                        <Typography variant={'h6'}>{option.lonaName}</Typography>
                    </div>)}
                />
            </Grid>

            <Grid item>
                <Box p={1}>
                    <Link to="/portfolio">
                        <Button variant="contained" startIcon={<AccountBalanceWalletOutlinedIcon/>}>
                            SAR {funds}
                        </Button>
                    </Link>
                </Box>
            </Grid>
        </Grid>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Container>
            <div className={classes.root}>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            className={classes.menuButton}
                        >
                            <MenuIcon />
                        </IconButton>
                        {topbar}
                    </Toolbar>
                </AppBar>
                <nav className={classes.drawer}>
                    <Hidden smUp implementation="css">
                        <Drawer
                            container={container}
                            variant="temporary"
                            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
                            open={mobileOpen}
                            onClose={handleDrawerToggle}
                            classes={{
                                paper: classes.drawerPaper,
                            }}
                            ModalProps={{
                                keepMounted: true, // Better open performance on mobile.
                            }}
                        >
                            {drawer}
                        </Drawer>
                    </Hidden>
                    <Hidden xsDown implementation="css">
                        <Drawer
                            classes={{
                                paper: classes.drawerPaper,
                            }}
                            variant="permanent"
                            open
                        >
                            {drawer}
                        </Drawer>
                    </Hidden>
                </nav>
                <main className={classes.content}>

                    <div className={classes.toolbar} />
                    {props.children}

                </main>
            </div>
        </Container>
    );
};

export default Layout;
