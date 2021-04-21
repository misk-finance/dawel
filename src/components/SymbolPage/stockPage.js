import React from "react";
import {getAuth} from 'firebase/auth';
import {arrayRemove, arrayUnion, getFirestore} from 'firebase/firestore';

import {Link} from "react-router-dom";
import "chartjs-plugin-annotation";

import Loader from "../Elements/Loader.js";
import KeyInfo from "./KeyInfo";
import {SymbolKeyinfo} from "./symbol-keyinfo";
import {SymbolProfitability} from "./symbol-profitability";
import {Box, Button, Divider, Grid, IconButton, TextField, Typography} from "@material-ui/core";
import {SymbolStatchart} from "./symbol-statchart";
import {SymbolEarnings} from "./symbol-earnings";
import {UseQuoteSummaryQuery} from "../../services/react-query-components";
import {PositionContext, UsePosition} from "../../services/position-history";
import {SymbolCandlechart} from "./symbol-candlechart";
import BoxPaper from "../Elements/BoxPaper";
import {SymbolSectorchip} from "./symbol-sectorchip";
import BookmarkBorderOutlinedIcon from "@material-ui/icons/BookmarkBorderOutlined";
import BookmarkTwoToneIcon from '@material-ui/icons/BookmarkTwoTone';


const db = getFirestore();

var options = {
	layout: {
		padding: {
			right: 25,
			left: 25,
		},
	},
	tooltips: {
		mode: "index",
		intersect: false,
		callbacks: {
			label(tooltipItems, data) {
				return `$${tooltipItems.yLabel}`;
			},
		},
		displayColors: false,
	},
	hover: {
		mode: "index",
		intersect: false,
	},
	maintainAspectRatio: false,
	responsive: true,
	legend: {
		display: false,
	},
	scales: {
		xAxes: [
			{
				display: false,
			},
		],
		fontStyle: "bold",
		yAxes: [
			{
				gridLines: {
					color: "rgba(0, 0, 0, 0)",
				},
				fontStyle: "bold",

				ticks: {
					callback(value) {
						return "$" + value.toFixed(2);
					},
				},
			},
		],
	},
	elements: {
		point: {
			radius: 0,
		},
		line: {
			borderCapStyle: "round",
			borderJoinStyle: "round",
		},
	},
};

let symbol;

// CHARTS

let chartData1 = [];
let labels = [];
let symbolsOnly = [];
let closePrice;
let stockData = {};
let keyData = [];
let keyDataLabel = [];
let allSymbols = [];
let volume = [];

let watchlist = [];

let oneDay = [];
let oneDayLabels = [];

let oneYear = [];
let oneYearLabels = [];

let oneMonth = [];
let oneMonthLabels = [];

export default class stockPage extends React.Component {
	static contextType = PositionContext;

	_isMounted = false;
	constructor(props) {
		super(props);
		this.state = {
			loaded: "",
			fundsWithoutCommas: "",
			accountValue: "",
			changeColor: "",
			extendedColor: "",
			marketStatus: "",
			valid: "",
			latestPrice: "",
			buyConfirmation: "",
			fillColor: null,
		};
		this.results = React.createRef();
		this.buyInput = React.createRef();
		this.searchBar = React.createRef();
		this.searchBarEl = React.createRef();
		this.day = React.createRef();
		this.month = React.createRef();
		this.year = React.createRef();
		this.bookmark = React.createRef();

		this.changeFocus = this.changeFocus.bind(this);
		this.getWatchlist = this.getWatchlist.bind(this);
		this.handleWatchlist = this.handleWatchlist.bind(this);
		this.getOneDayChart = this.getOneDayChart.bind(this);
		this.getOneMonthChart = this.getOneMonthChart.bind(this);
    	this.getOneYearChart = this.getOneYearChart.bind(this);

		this.data1 = (canvas) => {
			const ctx = canvas.getContext("2d");
			const gradient = ctx.createLinearGradient(0, 0, 600, 10);
			gradient.addColorStop(0, "#7c83ff");
			gradient.addColorStop(1, "#7cf4ff");
			let gradientFill = ctx.createLinearGradient(0, 0, 0, 100);
			gradientFill.addColorStop(0, "rgba(124, 131, 255,.3)");
			gradientFill.addColorStop(0.2, "rgba(124, 244, 255,.15)");
			gradientFill.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.shadowBlur = 5;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 4;
			return {
				labels,
				datasets: [
					{
						lineTension: 0.1,
						label: "",
						pointBorderWidth: 0,
						pointHoverRadius: 0,
						borderColor: gradient,
						backgroundColor: gradientFill,
						pointBackgroundColor: gradient,
						fill: true,
						borderWidth: 2,
						data: chartData1,
					},
				],
			};
		};
	}

	getApiContext(){
		return this.context.position.api;
	}

	getScContext(){
		return this.context.position.sc;
	}

	numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}



	prepareChartData(avalues, alabels, symbol, interval, range){
		this.getApiContext().api.getChart$(symbol, interval, range).subscribe(value => {
			labels = [];
			chartData1 = [];
			let result = value.result[0];
			let closeArr = result.indicators.quote[0].close ? result.indicators.quote[0].close : [];
			let timeArr = result.timestamp;
			let lastPrice = null;
			for (let i = 0;  i < closeArr.length; i++) {
				//chartData1.push(parseFloat(closeArr[i] ? closeArr[i]: lastPrice).toFixed(2));
				if(closeArr[i]) {
					chartData1.push({
						x: new Date(timeArr[i] * 1000),
						y: [
							parseFloat(result.indicators.quote[0].open[i]).toFixed(2),
							parseFloat(result.indicators.quote[0].high[i]).toFixed(2),
							parseFloat(result.indicators.quote[0].low[i]).toFixed(2),
							parseFloat(closeArr[i]).toFixed(2),
						]
					});
					labels.push({
						x: new Date(timeArr[i] * 1000),
						y: result.indicators.quote[0].volume[i] ? result.indicators.quote[0].volume[i] : 0
					});
				}
				//labels.push(new Date(timeArr[i]*1000).toLocaleString('en-UK'));
				if(closeArr[i]) lastPrice = closeArr[i];
			}

			if (this._isMounted) {
				this.setState({
					loaded: true,
				});
				chartData1.map((val) => avalues.push(val));
				labels.map((val) => alabels.push(val));
			}

		});
	}

	getOneDayChart() {
		const anno = {
			annotations: [
				{
					borderDash: [2, 2],
					drawTime: "afterDatasetsDraw",
					type: "line",
					mode: "horizontal",
					scaleID: "y-axis-0",
					value: closePrice,
					borderColor: "#676976",
					borderWidth: 1,
				},
			],
		};
		labels = [];
		chartData1 = [];
		let b = 0;
		if (oneDay.length === 0) {
			this.prepareChartData(oneDay, oneDayLabels, symbol, '1m', '1d');
		} else {
			labels = oneDayLabels;
			chartData1 = oneDay;
			if (this._isMounted) {
				this.setState({
					loaded: true,
				});
			}
		}
		options.annotation = anno;
	}

	getOneYearChart() {
		labels = [];
		chartData1 = [];
		if (oneYear.length === 0) {
		  this.prepareChartData(oneYear, oneYearLabels, symbol, '1d', '1y');
		} else {
		  labels = oneYearLabels;
		  chartData1 = oneYear;
		  if (this._isMounted) {
			this.setState({
			  loaded: true,
			});
		  }
		}
		options.annotation = "";
	  }

	getOneMonthChart() {
		labels = [];
		chartData1 = [];
		if (oneMonth.length === 0) {
		  this.prepareChartData(oneMonth, oneMonthLabels, symbol, '1h', '1mo');
		} else {
		  labels = oneMonthLabels;
		  chartData1 = oneMonth;
		  if (this._isMounted) {
			this.setState({
			  loaded: true,
			});
		  }
		}
		options.annotation = "";
	  }

	

	/*
	 * check i value is in array
	 * @param {arr} array
	 * @param {val} value
	 */
	isInArray(arr, val) {
		return arr.indexOf(val) > -1;
	}

	/*
	 * changes look of buttons above chart
	 * @param {option} selected option
	 */

	changeFocus(option) {
		setTimeout(
			function () {
				var elems = document.querySelectorAll(".Chart__option");

				[].forEach.call(elems, function (el) {
					el.classList.remove("active");
				});
				switch (option) {
					case 1:
						this.day.current.classList.add("active");
						break;

					case 2:
						this.month.current.classList.add("active");
						break;

					case 3:
						this.year.current.classList.add("active");
						break;

					case 4:
						this.years.current.classList.add("active");
						break;

					case 5:
						this.ytd.current.classList.add("active");
						break;

					default:
						this.ytd.current.classList.add("active");
						break;
				}
			}.bind(this),
			200
		);
	}



	rendering() {
		document.title = `${this.props.title} - ${symbol}`;

		setTimeout(() => {
			if (!this.state.marketStatus && this.buyInput.current) {
				this.buyInput.current.disabled = true;
				this.buyInput.current.placeholder = "MARKET CLOSED";
			} else if (this.buyInput.current) {
				this.buyInput.current.disabled = false;
				this.buyInput.current.placeholder = "QUANTITY";
			}
		}, 1000);

		this.getOneDayChart();
		if (document.querySelector(".hamburger")) {
			document
				.querySelector(".hamburger")
				.addEventListener("click", (e) => {
					e.currentTarget.classList.toggle("is-active");
				});
		}
	}

	getWatchlist() {
		this.context.position.getCache$().subscribe(doc => {
			if(!doc.data()) return;
			watchlist = doc.data().watchlist;
			symbol = window.location.href.split("/")[window.location.href.split("/").length - 1];
			if (watchlist.includes(symbol)) {
				this.setState({
					fillColor: "#ddd",
				});
			}
		});
	}

	handleWatchlist() {
		let user = getAuth().currentUser.uid;
		symbol = window.location.href.split("/")[
			window.location.href.split("/").length - 1
		];
		if (watchlist.includes(symbol)) {
			this.context.position.updateWatchlist({
				watchlist: arrayRemove(symbol)
			});
			this.setState({
				fillColor: null,
			});
			var index = watchlist.indexOf(symbol);
			if (index !== -1) {
				watchlist.splice(index, 1);
			}
		} else {
			this.context.position.updateWatchlist({
				watchlist: arrayUnion(symbol),
			});
			this.setState({
				fillColor: "#ddd",
			});
			watchlist.push(symbol);
		}
	}

	handleBuyStock(num) {

		let val = Number(num) * Number(this.state.latestPrice);
		let sum = Number(this.state.fundsWithoutCommas) - val;

		this.context.position.buy$({
			symbol,
			moneyPaid: val.toFixed(2),
			shares: num,
			value: val.toFixed(2),
		}, sum.toFixed(2)).subscribe(res => {
			console.log(22, res);
			this.getFunds();
			if (this._isMounted) {
				this.setState({
					buyConfirmation: false,
				});
			}
		});
	}

	getFunds() {

		this.context.position.getCache$().subscribe(doc => {
			if (typeof doc.data() !== "undefined" && this._isMounted) {
				this.setState({
					fundsWithoutCommas: doc.data().currentfunds,
					funds: "$" + this.numberWithCommas(doc.data().currentfunds),
				});
			}
		});
	}

	componentDidMount() {
		this._isMounted = true;
		this.setState({
			marketStatus: true,
		})

		symbol = window.location.href.split("/")[window.location.href.split("/").length - 1];

		this.getScContext().cache.loaded.subscribe(()=> {
			if (this._isMounted) {
				if (this.getScContext().cache.getSectorForSymbol(symbol)) {
					this.setState({valid: true});
					this.rendering();
				} else {
					this.setState({ valid: false });
				}
			}
		});

		this.getFunds();
		this.getWatchlist();
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	processQuoteSummary(value){
		if(!value) return;

		let result = value.result[0];
		this.result = result;

		let ytd = 0;

		closePrice = result.price.regularMarketPreviousClose.raw;

		stockData.changePercent = result.price.regularMarketChangePercent.raw.toFixed(2);
		stockData.change = result.price.regularMarketChange.raw.toFixed(2);

		stockData.name = result.price.longName;
		stockData.previousClose = closePrice;
		stockData.latestTime = result.price.regularMarketTime;
		stockData.extendedPrice = null;

		if (this._isMounted) {
			this.setState({
				latestPrice: result.price.regularMarketPrice.raw.toFixed(2),
			});
		}
		//keyData[0] = this.abbrNum(result.summaryDetail.marketCap.fmt, 2);
		keyData[0] = result.summaryDetail.marketCap.fmt;
		keyDataLabel[0] = "Market Cap ";

		keyData[1] = result.indexTrend.peRatio.fmt;
		keyDataLabel[1] = "PE Ratio (TTM) ";

		keyData[2] = "SAR " + result.summaryDetail.fiftyTwoWeekHigh.fmt;
		keyDataLabel[2] = "52 week High";

		keyData[3] = "SAR " + result.summaryDetail.fiftyTwoWeekLow.fmt;
		keyDataLabel[3] = "52 Week Low ";

		keyData[4] = ytd.toFixed(2) + "%";
		keyDataLabel[4] = "YTD Change ";

		keyData[5] = result.summaryDetail.volume.fmt;
		keyDataLabel[5] = "Volume ";

		this.longBusinessSummary = result.assetProfile.longBusinessSummary;

		if (stockData.change > 0 && this._isMounted) {
			this.setState({
				changeColor: "#3ae885",
			});
		} else if (stockData.change !== "0.00" && this._isMounted) {
			this.setState({
				changeColor: "#F45385",
			});
		} else if (this._isMounted) {
			this.setState({
				changeColor: "#999eaf",
			});
		}
		if (stockData.extendedChange > 0 && this._isMounted) {
			this.setState({
				extendedColor: "#66F9DA",
			});
		} else if (
			stockData.extendedChange !== "0.00" &&
			this._isMounted
		) {
			this.setState({
				extendedColor: "#F45385",
			});
		} else if (this._isMounted) {
			this.setState({
				extendedColor: "#999eaf",
			});
		}
	}

	render() {
		return (<>
				{this.state.buyConfirmation === true && (
					<UsePosition>{(posHook)=> {
						return (<div className="buyConfirmation">
							<h3>
								Are you sure you want to buy{" "}
								{this.buyInput.current.value} shares of {symbol} for{" "}
								<span style={{fontWeight: "bold"}}>
								{parseFloat(
									(
										this.buyInput.current.value *
										this.state.latestPrice
									).toFixed(2)
								)}
							</span>{" "}
								SAR
							</h3>
							<div>
								<button
									className="stockPage__buy-button"
									onClick={() => {
										if (this.buyInput.current.value * this.state.latestPrice <= this.state.fundsWithoutCommas) {
											posHook(()=>this.handleBuyStock(this.buyInput.current.value));
										} else if (this._isMounted) {
											this.setState({
												buyConfirmation: false,
											});
										}
									}}
								>
									CONFIRM
								</button>
								<button
									className="stockPage__buy-button cancel"
									onClick={() => {
										if (this._isMounted) {
											this.setState({
												buyConfirmation: false,
											});
										}
									}}
								>
									CANCEL
								</button>
							</div>
						</div>)
					}
					}</UsePosition>
				)}

				{this.state.valid === "" && <Loader />}

				{this.state.valid && (

					<Grid container
						  alignItems="stretch"
						  spacing={1}
					>
						{this.state.loaded ? (
							<UseQuoteSummaryQuery symbol={symbol} api={this.getApiContext()}>
								{({data, status, error}) => {

									if(keyData.length == 0) this.processQuoteSummary(data);

									return (<React.Fragment>
										<Grid item md={9}>
											<SymbolSectorchip symbol={symbol}/>
										</Grid>

										<Grid container item md={9} spacing={1}>
											<Grid item md={8} xs={8}>

												{chartData1.length >1 && <SymbolCandlechart data={chartData1}
																							volume={labels}
																							getOneDayChart={this.getOneDayChart}
																							getOneMonthChart={this.getOneMonthChart}
																							getOneYearChart={this.getOneYearChart}
												/>}

												{/*<FullChart
													changeFocus={this.changeFocus}
													getOneDayChart={this.getOneDayChart}
													getOneMonthChart={this.getOneMonthChart}
													getOneYearChart={this.getOneYearChart}
													data1={this.data1}
													stockData={stockData}
													day={this.day}
													year={this.year}
													month={this.month}
												/>
												*/}
											</Grid>

											<Grid item md>
												<BoxPaper transparent={true}>
													<Typography variant={"h4"}>
														<IconButton onClick={this.handleWatchlist}>
															{this.state.fillColor ? <BookmarkTwoToneIcon/> : <BookmarkBorderOutlinedIcon/>}
														</IconButton>
														{stockData.name}
													</Typography>
													<Divider/>
													<Grid container>
														<Grid item>
															<Typography variant={"h5"}>SAR {this.state.latestPrice}</Typography>
														</Grid>
														<Grid item>
															<Box p={1}>
																<Typography style={{color: this.state.changeColor,}}>{stockData.change} ({stockData.changePercent}%)</Typography>
															</Box>
														</Grid>
													</Grid>
													<Grid container alignItems={"stretch"}>
														<Grid item md={8}>
															<TextField variant="outlined" size={'small'} inputRef={this.buyInput} />
														</Grid>
														<Grid item md>
															<Button variant="contained" color={'primary'} style={{height:'100%'}}
																	onClick={function () {
																		let value = this.buyInput.current.value;
																		if (value.length > 0 && value > 0 && value * this.state.latestPrice <= this.state.fundsWithoutCommas && this.state.marketStatus && this._isMounted) {
																			this.setState({
																				buyConfirmation: true,
																			});
																		} else {
																			this.buyInput.current.style.border =
																				"solid 1px #f45485";
																		}
																	}.bind(this)}
															>
																	BUY
															</Button>
														</Grid>
													</Grid>
												</BoxPaper>
											</Grid>
										</Grid>
									</React.Fragment>);
								}}
							</UseQuoteSummaryQuery>
						) : (
							<Loader />
						)}


						<Grid item container
							  direction="column"
							  alignItems="stretch"
							  wrap="nowrap"
							  spacing={1}
						>
							<Grid item md={9}>
								<KeyInfo keyDataLabel={keyDataLabel}
										 keyData={keyData}
										 symbol={symbol}
								/>
							</Grid>

							<Grid item md={9}>
								<SymbolKeyinfo longBusinessSummary={this.longBusinessSummary}/>
							</Grid>

							<Grid item md={9}>
								<SymbolProfitability symbol={symbol}/>
							</Grid>

							<Grid item md={9}>
								<SymbolEarnings symbol={symbol}/>
							</Grid>

							<Grid item md={9}>
								<SymbolStatchart symbol={symbol}/>
							</Grid>

						</Grid>
					</Grid>

				)}

				{this.state.valid === false && (
					<div className="wrongSymbol">
						<h1>Unknown Symbol</h1>
						<h3>
							Go to <Link to="/dashboard">Dashboard</Link>
						</h3>
					</div>
				)}
		</>);
	}
}
