import React from "react";
import {getAuth} from 'firebase/auth';
import {arrayRemove} from 'firebase/firestore';

import Loader from "../Elements/Loader";
import {UseFetchBulkQuotesQuery} from "../../services/react-query-components";
import {Grid, Typography} from "@material-ui/core";
import {PortfolioTable} from "../Portfolio/portfolio-table";
import Button from "@material-ui/core/Button";
import BoxPaper from "../Elements/BoxPaper";
import {PositionContext} from "../../services/position-history";


let color = [],
  value = [],
  change = [],
  stockName = [],
  watchlist=[];

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
    this.handleWatchlist = this.handleWatchlist.bind(this);
  }

  getApiContext(){
    return this.context.position.api;
  }

  /*
   * gets users bookmarked tickers
   */
  getWatchlist(){
    if (this._isMounted) {
      this.setState({
        loader1: "",
      });
    }
    this.context.position.getCache$().subscribe(doc => {
      if(!doc.data()) return;
      watchlist = doc.data().watchlist;
      if(watchlist.length === 0){
        if(this._isMounted){
          this.setState({
            loader1:"nothing"
          });
        }
      } else{
        if (this._isMounted) {
          this.setState({
            loader1: true,
          });
        }
      }
    });

  }

  handleWatchlist(symbol){

    this.context.position.updateWatchlist({
      watchlist: arrayRemove(symbol)
    });

    var index = watchlist.indexOf(symbol);

    if (index !== -1) {
        watchlist.splice(index, 1);
        stockName.splice(index,1);
        color.splice(index,1);
        change.splice(index,1);
    }
    if(this._isMounted && watchlist.length === 0){
      this.setState({
        loader1:"nothing"
      });
    }else {
      this.setState({
        loader1:true
      });
    }
  }
  
  componentDidMount() {
    this._isMounted = true;

    let user = getAuth().currentUser.uid;

    document.title = `${this.props.title} - Watchlist`;
    this.getWatchlist();

    /*document.querySelector(".hamburger").addEventListener("click", e => {
      e.currentTarget.classList.toggle("is-active");
    });*/
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  processBulkQuotes(data){
    for(let result of data){
      let i = 0;
      for(let j in watchlist){
        if(result.symbol == watchlist[j]){
          i = j;
          break;
        }
      }

      value[i] = result.regularMarketPrice.toFixed(2);
      change[i] = parseFloat(result.regularMarketChangePercent).toFixed(2);
      stockName[i] = result.longName;

      if(Math.sign(change[parseInt(i)]) === 1){
        color[i] = "rgb(102,249,218)";
        change[parseInt(i)] = "+"+change[parseInt(i)];
      } else {
        color[i] = "#F45385";
      }
      if (
          change[parseInt(i)] !==
          "---"
      ) {
        change[parseInt(i)] =
            change[
                parseInt(i)
                ] + "%";
      }
    }
    Promise.resolve(null).then(()=>this.setState({bulkLoading: false, newItems: data}));
  }

  getBody(){

    let limit = 3;
    let itemCount = this.state.newItems ? this.state.newItems.length : 0;

    const getSymbolsToQuery = () => {
      return watchlist.filter((collection, index) => index >= itemCount && index < itemCount + limit);
    };

    const showFetch = () => {
      return this.state.newItems && this.state.newItems.length > 0 && this.state.newItems.length < watchlist.length;
    }

    if(this.state.loader1 === "") return <Loader />;

    return(watchlist.length > 0
      ? <UseFetchBulkQuotesQuery
            queryKey='watchlist_quotes'
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
          if(!data && !isFetching ) {
            fetchNextPage();
          }

          let newItems = [];
          if(data && !isFetching && this.state.bulkLoading){
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
                <PortfolioTable symbols={watchlist.filter((v,i) => i < itemCount)}
                                names={stockName}
                                color={color}
                                difference={change}
                                value={value}
                                handleWatchlist={this.handleWatchlist}
                                compact={this.props.bodyOnly}
                />
                {showFetch() && <Button variant="contained" color="primary"  onClick={() => doFetch()}>Fetch more</Button>}
            </React.Fragment>)

        }}
        </UseFetchBulkQuotesQuery>
        : <Typography>You haven’t bookmarked any stocks yet</Typography>
    );


  }

  render() {
    return this.props.bodyOnly ? this.getBody() : (
        <Grid container>
          <Grid item md={9}>
            <BoxPaper transparent={true}>
                {this.getBody()}
            </BoxPaper>
          </Grid>
        </Grid>
    );
  }
}
