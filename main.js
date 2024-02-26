/// <reference path="jquery-3.7.0.js"/>

"use strict";

// on loading display Loader and fade out:
function hideLoader() {
    $('.page-loader').fadeOut('slow');
}

$(() => {

    //=======================================================================

    // display coins on page load:
    (async () => {
        await handleHome();
        let checkedArr = getCheckedArr();
        // update myList Notification:
        setListNotification(checkedArr.length);
        // activate modal if necessary:
        if (checkedArr.length > 5) activateModal(checkedArr);
    })();

    //=======================================================================

    // on button click in the nav-bar:
    // each button represent the wanted page,
    // on click - remove the active class from all links,
    //            add active class only to the pressed button.
    // display none to all sections display block only to the 
    // section connected to the pressed button.
    const handleHeaderLinks = (linkBtn) => {
        // pill UI:
        $("a.nav-link").removeClass("active");
        $(linkBtn).addClass("active");

        // display current section:
        let sectionId = $(linkBtn).attr("data-section");
        $("section").css("display", "none");
        $("#" + sectionId).css("display", "block");
    }

    // function will return the user to home page with all updated info:
    async function displayHomeClick() {
        // activate home link:
        handleHeaderLinks("#homeLink");
        // display home:
        await handleHome();
        setListNotification(getCheckedArr().length);
        clearInterval(chartInterval); // stop chart interval.
    }

    // on link click start displaying all wanted page(section):
    $("#homeLink").click(async function () {
        await displayHomeClick();
    });

    // reports link click display chart or give costumed message:
    $("#reportsLink").click(async function () {
        let checkedArr = getCheckedArr();
        if (checkedArr.length > 0) {
            await displayChart(checkedArr);
            // await displayChart();
            handleHeaderLinks(this);
        }
        // not possible to disable reports if no coin was chosen:
        else alert("Live Reports need at least one coin in your list...");
    });

    // on about link click display about page:
    $("#aboutLink").click(function () {
        handleHeaderLinks(this);
        clearInterval(chartInterval); // stop chart interval.
    });

    // home page:
    // get the coins API and send to display coins on home page:
    async function handleHome() {
        let coinsArr = await getCoinsArrayFromLocalStorage();
        displayCoins(coinsArr);
    }

    // API:-------------------------------------------------------------------------------------------

    // function get an API url.
    // Will get from the server the wanted API and return as json.
    async function getAPIJson(url) {
        let response = await fetch(url);
        let json = await response.json();
        return json;
    }

    // function send the coins API url and return the API as json:
    async function getCoinsAPI() {
        let coinsAPI = await getAPIJson("https://api.coingecko.com/api/v3/coins/list");
        return coinsAPI;
    }

    // Local Storage:----------------------------------------------------------------------------------------------

    // function will check if exists data about coins in local storage.
    // if exists: return an array with the data.
    // if empty: get the data from the server with the API
    //           and return an array with the data.
    async function getCoinsArrayFromLocalStorage() {
        let json = localStorage.getItem("coinsArr");

        // if no data in storage:
        if (json) {
            // data already existed in storage so parse it and return the array:
            return JSON.parse(json);
        }

        // get data from API:
        let coinsAPI = await getCoinsAPI();

        // update storage and return the array:
        return saveCoinsInLocalStorage(coinsAPI);
    }

    // function get the coins API json string.
    // insert all needed data to an array,
    // save array in local storage and return the array:
    function saveCoinsInLocalStorage(coinsAPI) {
        let coinsArr = [];
        // set info in object and push to the array:
        for (let i = 0; i < 1150; i++) {
            // for (let i = 0; i < coinsAPI.length; i++) {
            let coinObj = { id: coinsAPI[i].id, symbol: coinsAPI[i].symbol, name: coinsAPI[i].name };
            coinsArr.push(coinObj);
        }

        // save in local storage and return the array:
        let json = JSON.stringify(coinsArr);
        localStorage.setItem("coinsArr", json);
        return coinsArr;
    }

    // Display coins cards:-------------------------------------------------------------------------------------------

    // function get the array with all coins info.
    // will implement the info into dynamic html,
    // add checked coins,
    // display data:
    function displayCoins(coinsArr) {
        let checkedArr = getCheckedArr();
        let html = ""; // assigned to empty string to reset the container.
        for (let i = 0; i < coinsArr.length; i++) {
            let coin = coinsArr[i];
            html += `
            <div class="card my-card" >
                <div class="card-body">

                    <h5 class="card-title">${coin.symbol}</h5>
                    <p class="card-text">${coin.name}.</p>

                    <!-- more info collapse -->
                    <div class="more-info-container">
                        <button id="button_${coin.id}" class="btn btn-primary more-info" type="button" 
                        data-button="info_button" data-bs-toggle="collapse" data-bs-target="#collapse_${coin.id}">
                            more info
                        </button>
                        <div class="collapse collapse-horizontal" id="collapse_${coin.id}">
                            <div class="card card-body"></div>
                        </div>
                    </div>
                </div>
                
                <!-- switch -->
                <div class="form-check form-switch switch">
                    <input class="form-check-input switch-input" type="checkbox" role="switch" 
                    id="switch_${coin.id}" data-index="${i}" ${checkedArr.includes(coin.id) ? "checked" : ""}/>
                </div>
            </div>
            `;
        }
        $("#coinsContainer").html(html);
    }

    // search-----------------------------------------------------------------------------------

    // on search click:
    $("#searchBtn").on("click", async () => {
        // if user is not in home page - send it back:
        if (!$("#homeLink").hasClass("active")) {
            await displayHomeClick()
        }
        // display search action:
        await handleSearch($("#searchBox").val());
    });

    // on clear button click:
    $("#clearSearchBtn").on("click", async () => {
        // clear search value:
        $("#searchBox").val("");
        // display home page:
        await handleHome();
    });

    // function get the search value.
    // function will run over the coinsArr and collect all coins 
    // with matched symbol to the user request.
    // display all match coins.
    // if the no coins were collected - send the user a message.
    async function handleSearch(searchCoinSymbol) {
        let coinsArr = await getCoinsArrayFromLocalStorage();
        let searchedCoinArr = [];

        // search for matched coins symbols:
        for (const item of coinsArr) {
            if (item.symbol===searchCoinSymbol)
                searchedCoinArr.push(item);
        }

        // alert if no match was found:
        if (searchedCoinArr.length === 0) return alert(`coin symbol ${searchCoinSymbol} doesn't exist`);
        // display search if match was found:
        displayCoins(searchedCoinArr);
    }

    // more info------------------------------------------------------------------------------------------

    // on click on ,ore info - show or hide the extra information of the wanted coin:
    $("#coinsContainer").on("click", ".more-info", async function () {
        let coinId = $(this).attr("id").substring(7);

        await handleMoreInfo(coinId);
    });

    // function get the coinId to show the coin's info and return the coin info.
    // manage time keeping about each info that was asked.
    // function will handle the local storage of the infoCoins:
    async function getCoinInfoFromStorage(coinId) {
        // get current time of info request:
        let currentTime = new Date().getTime();
        // get info arr from storage:
        let json = localStorage.getItem("coinsInfoArr");
        let coinsInfoArr = json ? JSON.parse(json) : [];

        // find the index of the wanted coin in the info array:
        let coinIndex = coinsInfoArr.findIndex(coin => coin.id === coinId);
        let coinInfo;

        // if the wanted coin is not in the local storage already -
        // get the coin info from server and insert to the array:
        if (coinIndex === -1) {
            coinInfo = await getCoinMoreInfoFromAPI(coinId, currentTime);
            coinsInfoArr.push(coinInfo);
        }
        // if the last call for wanted coin's info was more than 2 minutes - 
        // get the coin info from server and replace the coin in the array with updated info:
        else {
            coinInfo = coinsInfoArr[coinIndex];
            if (currentTime - coinInfo.time > 12000) {
                coinInfo = await getCoinMoreInfoFromAPI(coinId, currentTime);
                coinsInfoArr[coinIndex] = coinInfo;
            }
        }

        // update the local storage:
        json = JSON.stringify(coinsInfoArr);
        localStorage.setItem("coinsInfoArr", json);

        return coinInfo;
    }

    // function get the wanted coin id and the time it was called.
    // function will get the coin info from server and create a coinInfo object:
    async function getCoinMoreInfoFromAPI(coinId, time) {
        // get info from server:
        let coin = await getAPIJson("https://api.coingecko.com/api/v3/coins/" + coinId);
        // create coinInfo Object:
        let coinInfo = {
            id: coinId,
            imageSrc: coin.image.thumb,
            usd: coin.market_data.current_price.usd,
            eur: coin.market_data.current_price.eur,
            ils: coin.market_data.current_price.ils,
            time
        };

        return coinInfo;
    }

    // function get the wanted coin id.
    // function will get the coinInfo object, create the DOM html,
    // and display it:
    async function handleMoreInfo(coinId) {
        // get coin info from local storage/server:
        let coinInfo = await getCoinInfoFromStorage(coinId);

        // create DOM format:
        let moreInfo;

        // on server error: display suitable message:
        if (!coinInfo.usd || !coinInfo.eur || !coinInfo.ils) {
            moreInfo = `
            <div class="more-info-content">
                <div>
                unfortunately, could't get the info of this coin    
                </div>
            </div>
            `;
        }
        else {
            moreInfo = `
            <div class="more-info-content">
                <div>
                    USD: $${coinInfo.usd}<br>
                    EURO: €${coinInfo.eur}<br>
                    ILS: ₪${coinInfo.ils}<br>
                </div>
                <div><img src="${coinInfo.imageSrc}"/></div>
            </div>
            `;
        }
        // implementation:
        $(`#collapse_${coinId}`).children().html(moreInfo);
    }

    // switch ----------------------------------------------------------------------------------------

    $("#coinsContainer").on("click", ".switch-input", function () {
        let switchedCoinId = ($(this).attr("id").substring(7));

        // if checked = true - it means button was turned on now.
        // if checked = false - it means button was already switched and now is turned off.
        handleSwitch(switchedCoinId, this.checked);
    });

    // if not checked - add to storage
    // if checked - uncheck and remove from storage
    function saveSwitchedCoinsInLocalStorage(switchedCoinId, isChecked) {

        let checkedArr = getCheckedArr();

        if (isChecked) checkedArr.push(switchedCoinId);
        else checkedArr.splice(checkedArr.indexOf(switchedCoinId), 1);
        let json = JSON.stringify(checkedArr);
        localStorage.setItem("checkedArr", json);

        return checkedArr;
    }

    // function will get checked array from local storage and return the array or 
    // empty array if doesn't exist:
    function getCheckedArr() {
        let json = localStorage.getItem("checkedArr");
        let checkedArr = json ? JSON.parse(json) : [];
        return checkedArr;
    }

    // modal/dialog --------------------------------------------------------------------------------

    // jQuery doesn't get the dialog element with the regular way and needs .get(0).
    // with that method jQuery get the HTML element like "regular" getElementById.
    let modal = $("#modal").get(0);
    let closeModalBtn = $("#closeModalBtn").get(0);

    $("#modal").on("click", ".switch-input", function () {
        let switchedCoinId = ($(this).attr("id").substring(7));

        // if checked = true - it means button was turned on now.
        // if checked = false - it means button was already switched and now is turned off.
        let checkedArr = saveSwitchedCoinsInLocalStorage(switchedCoinId, this.checked);
        handleModalCloseBtn(checkedArr);
    });

    // on close modal click: display home page and close modal
    closeModalBtn.addEventListener("click", async () => {
        await handleHome();
        $("#myListNotification").css("background-color", "white");
        modal.close();
    });

    // get checked arr from storage if exists,
    function handleSwitch(switchedCoinId, isChecked) {
        // add or remove new switched coin from the checked array:
        let checkedArr = saveSwitchedCoinsInLocalStorage(switchedCoinId, isChecked);
        setListNotification(checkedArr.length);

        // if array contains more then 5 coins - activate modal:
        if (checkedArr.length > 5) {
            $("#myListNotification").css("background-color", "red");
            activateModal(checkedArr);
        }
    }

    // activate all necessary function to display the modal when needed:
    function activateModal(checkedArr) {
        modal.showModal();
        displayModalHTML(checkedArr);
        handleModalCloseBtn(checkedArr);
    }

    // handle the disable property and title of the close button of the modal:
    function handleModalCloseBtn(checkedArr) {
        setListNotification(checkedArr.length);
        // if checked arr contains valid amount of coins - allow closing modal:
        $("#closeModalBtn").prop("disabled", checkedArr.length > 5 ? true : false);
        // suitable message too explain why the button is disabled:
        $("#closeModalBtn").attr("title",
            checkedArr.length > 5 ? "number of switched coins must be 5 or less!" : "");
    }

    // function get checkedArr.
    // function will display the inner html of modal
    // according to the coin in checkedArr and the information in coinArr
    async function displayModalHTML(checkedArr) {
        let html = `<div>You're coins list: <br/> 
                        ${checkedArr.length < 6 ? "" : " Please uncheck 1 or more coins to continue: "}
                    </div><hr/>`;
        const coinsArr = await getCoinsArrayFromLocalStorage();
        for (const coinId of checkedArr) {
            let coin = coinsArr.find(coin => coin.id === coinId);
            html += `
                <div class="modal-coin-container">
                    <p>${coin.id}</p>
                    <div class="form-check form-switch modal-switch">
                        <input class="form-check-input switch-input" checked type="checkbox"
                         role="switch" id="switch_${coin.id}" data-index="${coinId}" >
                    </div>
                </div>
                `;
        }
        // implementation in modal html:
        $("#dialogBody").html(html);
    }

    // on my list click - if there are checked coins - activate modal:
    $("#myListBtn").on("click", () => {
        let checkedArr = getCheckedArr();
        if (checkedArr.length > 0) {
            activateModal(checkedArr);
        }
        else alert("You're list is empty... \n Check up some coins and start to have fun!")
    });

    // function will get checkedArr length and 
    // will show the current number of coins in the list:
    function setListNotification(checkedLength) {
        $("#myListNotification").html(checkedLength);
    }


    // // ___________________________________________________________________________________________
    // // ___________________________________________________________________________________________
    // // ___________________________________________________________________________________________
    // // ___________________________________________________________________________________________

    // LIVE REPORTS CHART:

    let chartInterval; // represent the intervals of the chart. On other page click - stop interval.

    // function get checkedArr.
    // function will include all the code that is related to the live reports and to the chart:
    async function displayChart(checkedArr) {

        const intervalRange = 2;

        // dataArr contains all the data necessary for the chart to display the current coins:
        const dataArr = await handleChart(checkedArr);

        // chart is a product by CanvasJS, allows to design charts and analyze data in various ways:
        const chart = new CanvasJS.Chart("chartContainer", {
            exportEnabled: true,
            animationEnabled: true,
            animationDuration: 3000,
            zoomEnabled: true,
            theme: "dark2",
            title: {
                text: "Live Reports"
            },
            axisX: {
                title: "Current Time In Minutes And Seconds",
                valueFormatString: `mm:ss"`,
                intervalType: "seconds",
            },
            axisY: {
                title: "Coin Value",
                prefix: "$",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC",
            },
            toolTip: {
                shared: true //on mouse hover: show data on all items together.
            },
            legend: {
                cursor: "pointer", //pointer on hover on the dots
                itemclick: toggleDataSeries //on click on one of the line - make it invisible or visible.
            },
            data: dataArr
        });
        chart.render();
        // on charge of displaying the data from the server every 2 seconds:
        chartInterval = setInterval(() => {
            updateDataPoints(chart.options.data); //chart.options.data - access to the current data in the chart.
            chart.render();
        }, intervalRange * 1000);

        // enable hide and show specific coins while the chart is running:
        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        // the function send the first coins data for the chart with the first point of each coin.
        async function handleChart(checkedArr) {
            let coinsArr = await getCoinsArrayFromLocalStorage(); //array of all coins objects.
            let symbolFormatArr = createSymbolFormat(checkedArr, coinsArr); //array of checked coins objects.
            let coinsPrice = await getCoinsPriceAPI(symbolFormatArr); //object of checked coins current prices.

            // notify user about coins which the server couldn't find:
            if (symbolFormatArr.length !== Object.keys(coinsPrice).length) {
                let message = coinNotFound(symbolFormatArr, coinsPrice);
                alert("Couldn't display info about the next coins: " + message.toString());
            }
            let chartCoinsData = createChartCoinsData(coinsPrice); // array of checked coins data for the chart.

            return chartCoinsData;
        }


        // function get coinsArr and checkedArr.
        // checked arr contains only the the coins' id.
        // function will create a new array with a deep copy of each coin object that exists in checkedArr,
        // and return the new array.
        function createSymbolFormat(checkedArr, coinsArr) {
            let symbolFormatArr = [];
            for (const checkedCoinId of checkedArr) {
                let coinSymbol = coinsArr.find(coin => coin.id === checkedCoinId).symbol; // object spread operator for deep coping.
                symbolFormatArr.push(coinSymbol);
            }
            localStorage.setItem("symbolFormatArr", JSON.stringify(symbolFormatArr));
            return symbolFormatArr;
        }

        // function get a symbol format.
        // function will make an API call to get the specific coins with the API Key.
        // return the response which contains an object with the current price of each coin.
        async function getCoinsPriceAPI(symbolFormatArr) {
            // Individual API key:
            const keyAPI = "419fd32b4802d3dbee3e274d60d101c858985e47b16e72c5f596cbd4de12891d";
            let symbolFormat = symbolFormatArr.toString().toUpperCase();
            const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbolFormat}&tsyms=USD&api_key={${keyAPI}}`;
            // fetching the data from the server:
            const response = await fetch(url);
            let coinsPrice = response.json();
            return coinsPrice;
        }

        // function will check if there are any coins that weren't found by the api call
        // and return an array with the missed coins. 
        function coinNotFound(symbolFormatArr, coinsPrice) {
            let text = "";
            let message = [];
            Object.keys(coinsPrice).forEach(key => text += key);
            symbolFormatArr.forEach(symbol => {
                if (!text.includes(symbol.toUpperCase())) message.push(symbol);
            });

            return message;
        }

        // function get an access to X and Y points' data in the chart.
        // function will implement the updated data from the server every interval.
        async function updateDataPoints(chartData) {
            let json = localStorage.getItem("symbolFormatArr"); // get the symbol from the local storage.
            let symbolFormatArr = JSON.parse(json);
            let currentCoinsPrice = await getCoinsPriceAPI(symbolFormatArr); //calling the API for current price every interval. 
            const time = new Date(); //current time.
            chartData.map(coin => { //go over all the coins in the chart and add a new point with the current price.
                let coinValue = currentCoinsPrice[coin.name].USD;
                coin.dataPoints.push({ x: time, y: coinValue });
            });
        }

        // function get an object with the current price of the coins.
        // function will create the an array with the all dataPoints for the chart:
        // return an array with all current data points.
        function createChartCoinsData(coinsPrice) {
            const time = new Date(); //get current time.
            let chartCoinsData = [];
            for (const coin in coinsPrice) { //run over the coins object.
                let coinValue = coinsPrice[coin].USD; //get it current value.
                let dataObject = setCoinData(coin, coinValue, time); //build the data point object.
                chartCoinsData.push(dataObject); // insert the new point to the array.
            }

            return chartCoinsData;
        }

        // function get coins parameters - symbol, value and time.
        // function will create an object of a data point with all the parameters
        // and return  the it ready to implement in the chart.
        function setCoinData(coin, coinValue, time) {
            const dataObject = {
                type: "line",
                name: coin, //symbol
                showInLegend: true,
                xValueFormatString: `mm:ss"`,
                dataPoints: [{ x: time, y: coinValue },]
            }
            return dataObject;
        }
    }
});
