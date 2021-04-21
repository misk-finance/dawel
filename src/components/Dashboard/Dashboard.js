import React from "react";
import {getFirestore} from 'firebase/firestore';
import {relDiff} from "../helpers.js";
import {DashboardSectors} from "./dashboard-sectors";
import {Card, CardContent, CardHeader, Grid} from "@material-ui/core";
import {DashboardChart} from "./dashboard-chart";
import Watchlist from "../WatchList/watchlist";
import Portfolio from "../Portfolio/portfolio";
import {PositionContext} from "../../services/position-history";


const db = getFirestore();


// CHARTS

let chartData1 = [],
	chartData2 = [];

// PORTFOLIO

let portfolioStocks = [],
	portfolioShares = [],
	portfolioValue = [],
	portfolioDifference = [],
	portfolioColor = [],
	portfolioMoneyPaid = [];

// Watchlist
let watchlist = [];



class Dashboard extends React.Component {
	static contextType = PositionContext;

	_isMounted = false;
	constructor(props) {
		super(props);
		this.state = {
			loader1: "",
			loader2: "",
			loader3: "",
			portfolioLoader: "",
			fundsWithoutCommas: "",
			accountValue: "",
			marketStatus: "",
			theme: "",
		};
		this.componentDidMount = this.componentDidMount.bind(this);
		this.getAccountInfo = this.getAccountInfo.bind(this);
		this.getWatchlist = this.getWatchlist.bind(this);
		this.portfolio = React.createRef();
		this.chartFirst = React.createRef();
		this.chartSecond = React.createRef();

		/*
		 * GENERATING LABALS FOR DASHBOARD CHARTS
		 * @param {length} num of labels
		 */

		function labelGen(length) {
			let result = 0;
			for (let i = 1; i < length; i++) {
				result = result + "," + i;
			}
			return result.split(",");
		}

		/*
		 * STYLES FOR DASHBOARD CHARTS
		 */

		this.data1 = (canvas) => {
			const ctx = canvas.getContext("2d");
			const gradient = ctx.createLinearGradient(0, 0, 600, 10);
			gradient.addColorStop(0, "#7c83ff");
			gradient.addColorStop(1, "#7cf4ff");
			let gradientFill = ctx.createLinearGradient(0, 0, 0, 100);
			gradientFill.addColorStop(0.1, "rgba(124, 131, 255,.3)");
			if (this.state.theme === "dark") {
				gradientFill.addColorStop(0.8, "rgba(55, 58, 70, 0)");
			} else if (this.state.theme === "light") {
				gradientFill.addColorStop(0.8, "rgba(255, 255, 255, 0)");
			}
			ctx.shadowColor = "rgba(124, 131, 255,.3)";
			ctx.shadowBlur = 5;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 4;
			return {
				labels: labelGen(chartData1.length),
				datasets: [
					{
						lineTension: 0.3,
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
		this.data2 = (canvas) => {
			const ctx = canvas.getContext("2d");
			const gradient = ctx.createLinearGradient(0, 0, 600, 10);
			gradient.addColorStop(0, "#7c83ff");
			gradient.addColorStop(1, "#7cf4ff");
			let gradientFill = ctx.createLinearGradient(0, 0, 0, 100);
			gradientFill.addColorStop(0.1, "rgba(124, 131, 255,.3)");
			if (this.state.theme === "dark") {
				gradientFill.addColorStop(0.8, "rgba(55, 58, 70, 0)");
			} else if (this.state.theme === "light") {
				gradientFill.addColorStop(0.8, "rgba(255, 255, 255, 0)");
			}
			ctx.shadowColor = "rgba(124, 131, 255,.3)";
			ctx.shadowBlur = 5;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 4;
			return {
				labels: labelGen(chartData2.length),
				datasets: [
					{
						lineTension: 0.3,
						label: "",
						pointBorderWidth: 0,
						pointHoverRadius: 0,
						borderColor: gradient,
						backgroundColor: gradientFill,
						pointBackgroundColor: gradient,
						fill: true,
						borderWidth: 2,
						data: chartData2,
					},
				],
			};
		};
	}


	getApiContext(){
		return this.context.position.api;
	}


	/*
	 * fetches market price for portfolio stocks and pushes to portfolio arrays difference
	 * @param {symbol} name of stock as symbol
	 * @param {i} index in array
	 */
	getLatestPrice(symbol, i) {

		this.getApiContext().api.getQuoteSummary$(symbol).subscribe(value => {
			let result = value.result[0];
			let latestPrice = result.price.regularMarketPrice.raw.toFixed(2);
			portfolioValue[parseInt(i)] = parseFloat(
				Number(
					portfolioShares[parseInt(i)] * latestPrice
				).toFixed(2)
			);
			portfolioDifference[parseInt(i)] =
				relDiff(
					parseFloat(portfolioValue[parseInt(i)]),
					parseFloat(portfolioMoneyPaid[parseInt(i)])
				).toFixed(2) + "%";
			if (
				portfolioValue[parseInt(i)] >
				portfolioMoneyPaid[parseInt(i)]
			) {
				portfolioDifference[parseInt(i)] =
					"+" + portfolioDifference[parseInt(i)];
				portfolioColor[parseInt(i)] = "#66F9DA";
			} else if (
				portfolioValue[parseInt(i)] ===
				portfolioMoneyPaid[parseInt(i)]
			) {
				portfolioColor[parseInt(i)] = "#999EAF";
			} else {
				portfolioDifference[parseInt(i)] =
					"-" + portfolioDifference[parseInt(i)];
				portfolioColor[parseInt(i)] = "#F45385";
			}
			if (portfolioDifference[parseInt(i)].includes("NaN")) {
				portfolioDifference[parseInt(i)] = "---";
				portfolioColor[parseInt(i)] = "#999EAF";
			}
		});


	}

	/*
	 * gets account bought stocks, calls function getLatestPrice
	 */
	getAccountInfo() {
		/*let user = getAuth().currentUser.uid;
		let i = 0;

		portfolioStocks = [];
		portfolioValue = [];
		portfolioShares = [];
		portfolioMoneyPaid = [];
		portfolioDifference = [];
		portfolioColor = [];
		getFirestore()
			.collection("users")
			.doc(user)
			.collection("stocks")
			.get()
			.then((snapshot) => {
				if (
					snapshot.docs.length !== 0 &&
					portfolioDifference.length === 0
				) {
					snapshot.forEach((doc) => {
						if (portfolioStocks.length < 4) {
							portfolioStocks.push(doc.data().symbol);
							portfolioShares.push(doc.data().shares);
							portfolioMoneyPaid.push(
								parseFloat(doc.data().moneyPaid)
							);
							this.getLatestPrice(
								portfolioStocks[parseInt(i)],
								i
							);
							i++;
						}
					});
				} else if (this._isMounted && portfolioStocks.length === 0) {
					this.setState({
						portfolioLoader: "nothing",
					});
				}
			})
			.then(() => {
				if (this.portfolio.current && portfolioStocks.length > 0) {
					this.portfolio.current.style.display = "block";
				}
			})
			.then(() => {
				setTimeout(() => {
					let val = portfolioValue.reduce(
						(a, b) => Number(a) + Number(b),
						0
					);
					if (this._isMounted) {
						this.setState({
							accountValue:
								"$" +
								numberWithCommas(
									Number(val) +
										Number(this.state.fundsWithoutCommas)
								),
						});
					}
				}, 1300);
			})
			.then(() => {
				if (portfolioStocks.length > 0) {
					setTimeout(() => {
						if (this._isMounted) {
							this.setState({
								portfolioLoader: true,
							});
						}
					}, 1200);
				}
			})
			.catch((error) => {
				if (this._isMounted) {
					this.setState({
						portfolioLoader: false,
					});
				}
			});*/
	}

	/*
	 * returns if element is in array
	 * @param {arr} array
	 * @param {val} value of searched element
	 */

	isInArray(arr, val) {
		return arr.indexOf(val) > -1;
	}

	getWatchlist(){
		/*let user = getAuth().currentUser.uid;
		db.collection("users")
			.doc(user)
			.get()
			.then((doc) => {
				watchlist = doc.data()["watchlist"];
				console.log(watchlist);
				console.log(doc.data()["watchlist"]);
			})*/
	}
	

	componentDidMount() {
		this._isMounted = true;

		/*
		 * checks if market is open and changes state
		 */
		if (this._isMounted) {
			this.context.position.getCache$().subscribe(doc => {
				if (typeof doc.data() !== "undefined" &&this._isMounted) {
					this.setState({
						fundsWithoutCommas: doc.data().currentfunds,
					});
				}
			});
			document.title = this.props.title + " - Dashboard";
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	render() {
		return (
			<Grid container spacing={1}>
				<Grid item md={6} container direction={"column"} spacing={1}>
					<Grid item>
						<DashboardChart/>
					</Grid>
					<Grid item>
						<DashboardSectors/>
					</Grid>
				</Grid>
				<Grid item md={3} container direction={"column"} spacing={1}>
					<Grid item>
						<Card>
							<CardHeader title="Stocks"/>
							<CardContent>
								<Portfolio bodyOnly={true}/>
							</CardContent>
						</Card>
					</Grid>
					<Grid item>
						<Card>
							<CardHeader title="Watchlist"/>
							<CardContent>
								<Watchlist bodyOnly={true}/>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</Grid>
		);
	}
}

export default Dashboard;
