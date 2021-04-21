import React from "react";
import {getAuth} from 'firebase/auth';

import {relDiff} from "../helpers.js";
import Loader from "../Elements/Loader";
import {Divider, Grid, List, ListItem, Typography} from "@material-ui/core";
import {PortfolioChart} from "./portfolio-chart";
import {PortfolioTable} from "./portfolio-table";
import {UseFetchBulkQuotesQuery} from "../../services/react-query-components";
import Button from "@material-ui/core/Button";
import BoxPaper from "../Elements/BoxPaper";
import {PositionContext} from "../../services/position-history";

let difference = [],
  moneyPaid = [],
  symbols = [],
  color = [],
  shares = [],
  value = [],
  change = [],
  position = [],
  stockNames = [];

export default class portfolio extends React.Component {
  static contextType = PositionContext;

  _isMounted = false;
  constructor(props) {
    super(props);
    this.state = {
      loader1: "",
      confirmation: "",
      funds: "",
      marketStatus: "",
      error: "",
      bulkLoading: true
    };
    this.handleStockSell = this.handleStockSell.bind(this);
  }

  getApiContext(){
    return this.context.position.api;
  }

  processBulkQuotes(data){
    for(let result of data) {
      let ai = [];
      for (let j in symbols) {
        if (result.symbol == symbols[j]) {
          ai.push(j);
        }
      }

      for (let i of ai) {
        stockNames[i] = result.longName;
        let latestPrice = result.regularMarketPrice.toFixed(2);
        value[parseInt(i)] = parseFloat(
            Number(shares[parseInt(i)] * latestPrice).toFixed(2),
        );

        difference[parseInt(i)] =
            relDiff(
                parseFloat(value[parseInt(i)]),
                parseFloat(moneyPaid[parseInt(i)]),
            ).toFixed(2) + "%";
        change[parseInt(i)] =
            "$" +
            parseFloat(
                parseFloat(
                    value[parseInt(i)] - parseFloat(moneyPaid[parseInt(i)]),
                ).toFixed(2),
            );
        if (value[parseInt(i)] > moneyPaid[parseInt(i)]) {
          difference[parseInt(i)] = `+${difference[parseInt(i)]}`;
          color[parseInt(i)] = "#66F9DA";
        } else if (value[parseInt(i)] === moneyPaid[parseInt(i)]) {
          color[parseInt(i)] = "#999EAF";
        } else {
          difference[parseInt(i)] = `-${difference[parseInt(i)]}`;
          color[parseInt(i)] = "#F45385";
        }
        if (difference[parseInt(i)].includes("NaN")) {
          difference[parseInt(i)] = "---";
          color[parseInt(i)] = "#999EAF";
        }
        if (change[parseInt(i)].split("")[1] === "-") {
          let name = "" + change[parseInt(i)];
          change[parseInt(i)] = `-$${name.substr(2)}`;
        }
      }
    }


    Promise.resolve(null).then(()=>this.setState({bulkLoading: false, newItems: data}));
  }

  /*
   * gets users opened positions
   */
  getPositions() {

    if (this._isMounted)
      this.setState({
        loader1: "",
      });
    symbols = [];
    position = [];
    shares = [];
    moneyPaid = [];
    value = [];

    this.context.position.loadStocks$().subscribe(snapshot => {
      if (snapshot.docs.length !== 0) {
        snapshot.forEach(doc => {
          position.push(doc.id);
          symbols.push(doc.data().symbol);
          shares.push(doc.data().shares);
          moneyPaid.push(doc.data().moneyPaid);
        });
        if (this._isMounted) this.setState({
          loader1: true,
        });
      } else {
        if (this._isMounted) this.setState({
            loader1: "nothing",
          });
      }
    });

  }

  /*
   * closes position
   * @param {position} name of position
   * @param {number} index of 'value' array
   */
  handleStockSell(position, number) {
    symbols = [];
    let user = getAuth().currentUser.uid;
    if (this.state.marketStatus && this._isMounted) {


      let val = Number(this.state.funds) + Number(value[parseInt(number)]);

      this.context.position.sell$(position, val).subscribe(res => {
        this.setState({
          funds: val
        });
        this.getPositions();
      });

    }
  }

  componentDidMount() {
    this._isMounted = true;

    /*
     * check if market opened
     */
    this.setState({
      marketStatus: true,
    });

    document.title = `${this.props.title} - Portfolio`;

    this.getPositions();
    this.context.position.getCache$().subscribe(doc => {
      if (typeof doc.data() !== "undefined" && this._isMounted) {
        this.setState({
          funds: doc.data().currentfunds,
        });
      }
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getBody(){
    let limit = 10;
    let itemCount = this.state.newItems ? this.state.newItems.length : 0;

    const getSymbolsToQuery = () => {
      return symbols.filter((collection, index) => index >= itemCount && index < itemCount + limit);
    };

    const showFetch = () => {
      return this.state.newItems && this.state.newItems.length > 0 && this.state.newItems.length < symbols.length;
    }

    if(this.state.loader1 === "") return <Loader />;

    return (
        symbols.length > 0
            ? <UseFetchBulkQuotesQuery
                queryKey='portfolio_quotes'
                api={this.getApiContext()}
                symbols={getSymbolsToQuery()}
                options={{
                  refetchOnWindowFocus: false,
                  enabled: false,
                  getNextPageParam: (lastPage, pages) => {
                    return getSymbolsToQuery()
                  }
                }}
            >
            {({ data, fetchNextPage, isFetching  }) => {

              if (!data && !isFetching && this.state.bulkLoading) {
                fetchNextPage();
              }

              let newItems = [];
              if(data && !isFetching && this.state.bulkLoading) {
                data.pages.forEach((value) => {
                  newItems = newItems.concat(value.result)
                });
                this.processBulkQuotes(newItems);
              }

              const doFetch = () => {
                Promise.resolve(null).then(() => this.setState({bulkLoading: true}))
                fetchNextPage();
              }

              return (
                <React.Fragment>
                    <PortfolioTable symbols={symbols.filter((v,i) => i < itemCount)}
                                       names={stockNames}
                                       shares={shares}
                                       color={color}
                                       difference={difference}
                                       change={change}
                                       value={value}
                                       handleStockSell={this.handleStockSell}
                                       position={position}
                                       compact={this.props.bodyOnly}
                    />
                    {showFetch() && <Button variant="contained" color="primary"  onClick={() => doFetch()}>Fetch more</Button>}
                </React.Fragment>
              );

            }}
          </UseFetchBulkQuotesQuery>
          : <Typography>You haven't bought any stocks yet</Typography>
    );
  }

  render() {
    let totalStocksValue = 0;
    if(!this.state.bulkLoading) {
      symbols.forEach((val, index) => {
        if(value[index]) totalStocksValue += parseFloat(value[index]);
      });
    }
    let totalValue = totalStocksValue + parseFloat(this.state.funds);

    return this.props.bodyOnly ? this.getBody() : (
      <>
        {this.state.error === true && (
          <div className="alertMessage">
            Market is currently closed{" "}
            <button
              style={{margin: "20px"}}
              className="stockPage__buy-button"
              onClick={() => {
                if (this._isMounted) {
                  this.setState({
                    error: false,
                  });
                }
              }}>
              CONFIRM
            </button>
          </div>
        )}

        {this.state.loader1 === "" && <Loader />}

        {this.state.loader1 === true &&
          <Grid container alignItems={"flex-start"} direction={"column"} spacing={1} alignItems={"stretch"}>

            <Grid item container spacing={1} alignItems={"stretch"}>

              <Grid item md={6}>
                <Typography variant={"h2"}>Total portfolio value</Typography>
                <BoxPaper transparent={true}>
                    <List>
                      <ListItem>
                        <Grid container>
                          <Grid item md={3}>Stocks</Grid>
                          <Grid item md>{(totalStocksValue*100/totalValue).toFixed(2)}%</Grid>
                          <Grid item md>SAR {totalStocksValue.toFixed(2)}</Grid>
                        </Grid>
                      </ListItem>
                      <Divider/>
                      <ListItem>
                        <Grid container>
                          <Grid item md={3}>Cash</Grid>
                          <Grid item md>{(parseFloat(this.state.funds)*100/totalValue).toFixed(2)}%</Grid>
                          <Grid item md>SAR {parseFloat(this.state.funds).toFixed(2)}</Grid>
                        </Grid>
                      </ListItem>
                    </List>
                </BoxPaper>
              </Grid>

              <Grid item md={3}>
                <BoxPaper transparent={true}>
                    <PortfolioChart cash={this.state.funds} stocks={totalStocksValue} />
                </BoxPaper>
              </Grid>

            </Grid>

            <Grid item md={9}>
              <Typography variant={"h2"}>Stocks</Typography>
              <BoxPaper transparent={true}>
                  {this.getBody()}
              </BoxPaper>
            </Grid>
          </Grid>
        }

        {this.state.loader1 === "nothing" && (
            <BoxPaper transparent={true}>
              <Typography>You haven't bought any stocks yet</Typography>
            </BoxPaper>
        )}
      </>
    );
  }
}
