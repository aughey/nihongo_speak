/* global gapi */

import React, {Component} from 'react';
import './App.css';
import NihongoSpeak from './NihongoSpeak'

var YOUR_API_KEY = 'AIzaSyBR9Z9KxSyXJ-VIQOWPBeXvJ6Yk9ZpS2_o'
var YOUR_SPREADSHEET_ID = '123ukBoGf_TmjcQ17BcSOfoMn6iIs-An9zQAmDmyUegU'
var STORAGE_KEY = "nihono_data";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

  loadSpreadsheet = () => {
    if (!window.gapi) {
      return this.loadGoogleAPI();
    }

    console.log("Loading Spreadsheet")
    var sheets = gapi.client.sheets;

    this.setState({data: null})
    sheets.spreadsheets.values.get({spreadsheetId: YOUR_SPREADSHEET_ID, range: 'A1:E197'}).then((res) => {
      // parse this out
      res.result.values.shift();
      var partsofspeech = {}
      var words = res.result.values.map((value) => {
        var pos = value[1]; // parse this futher when needed
        if (!pos || pos === "") {
          return null;
        }
        if (!partsofspeech[pos]) {
          partsofspeech[pos] = [];
        }
        var out = {
          japanese: value[2],
          english: value[4],
          pos: pos
        }
        partsofspeech[pos].push(out);
        return out;
      }).filter((d) => d !== null)
      var data = {
        words: words,
        partsofspeech: partsofspeech
      }
      if (localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      this.setState({data: data})
    }, (err) => {
      this.setState({err: err})
    })
  }

  onload = () => {
    console.log("Google api.js loaded");
    var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

    gapi.load('client', () => {
      console.log("Loaded client")
      gapi.client.init({
        apiKey: YOUR_API_KEY,
        /*clientId: YOUR_CLIENT_ID, */
        scope: SCOPES,
        discoveryDocs: DISCOVERY_DOCS
      }).then(() => {
        this.setState({gapiReady: true});

        this.loadSpreadsheet();
      })
    });
  }
  loadGoogleAPI() {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";

    script.onload = () => {
      this.onload();
    }

    document.body.appendChild(script);
  }

  componentDidMount() {
    try {
      if (localStorage) {
        var data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          data = JSON.parse(data);
          this.setState({data})
        } else {
          this.loadGoogleAPI();
        }
      }
    } catch (e) {
      console.log(e);
      this.loadGoogleAPI();
    }
  }

  showJson = () => {
    this.setState({show_json: true})
  }
  flipCard = () => {
    // Change the word order.
    this.state.data.words.forEach((word) => {
      var temp = word.english;
      word.english = word.japanese;
      word.japanese = temp;
    });
    this.setState({data: this.state.data})
  }

  render() {
    if (this.state.data) {
      if (this.state.show_json) {
        return (
          <pre>
            {JSON.stringify(this.state.data,null,' ')}
          </pre>
        )
      }
      var data = this.state.data;
      return (
        <div>
          <button onClick={this.loadSpreadsheet}>Reload</button>
          <button onClick={this.showJson}>Show JSON</button>
          <button onClick={this.flipCard}>Flip Card</button>
          <NihongoSpeak data={data}/>
        </div>
      );
    }
    if (this.state.gapiReady) {
      return (
        <h1>Loading data</h1>
      )
    } else {
      return (
        <h1>Loading GAPI</h1>
      )
    }
  }
}

export default App;
