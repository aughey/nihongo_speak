/* global gapi */

import React, {Component} from 'react';
import './App.css';
import NihongoSpeak from './NihongoSpeak'
import q from 'q'

var YOUR_API_KEY = 'AIzaSyBR9Z9KxSyXJ-VIQOWPBeXvJ6Yk9ZpS2_o'
var YOUR_SPREADSHEET_ID = '123ukBoGf_TmjcQ17BcSOfoMn6iIs-An9zQAmDmyUegU'
var STORAGE_KEY = "nihono_data";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      start_word: 'ああ',
      end_word: 'せんたく'
    }
  }

  loadRange(start, end) {
    console.log("Loading: " + start + " " + end);
    var sheets = gapi.client.sheets;

    var deferred = q.defer();

    this.setState({data: null})
    sheets.spreadsheets.values.get({
      spreadsheetId: YOUR_SPREADSHEET_ID,
      range: 'A' + start + ":E" + end
    }).then((res) => {
      deferred.resolve(res.result.values);
    }, (err) => {
      deferred.reject(new Error(err));
    })

    return deferred.promise;
  }

  loadUntil(firstword, lastword) {
    var accum = [];
    var stop = false;
    var start = false;
    var spacecount = 0;
    var loadNext = (from, to) => {
      return this.loadRange(from, to).then((values) => {
        if (!values) {
          values = [];
          stop = true;
        }
        values.forEach((value) => {
          //console.log(value);
          if (start === false && value[2] === firstword) {
            start = true;
          }
          if (!stop && start) {
            accum.push(value);
          }
          if (!value[2] || value[2] === '') {
            spacecount++;
          } else {
            spacecount = 0;
          }
          if (spacecount > 5) {
            console.log("Hit space count limit");
            stop = true;
          }
          if (value[2] === lastword) {
            stop = true;
          }
        })
      }).then(() => {
        if (stop) {
          return accum;
        } else {
          return loadNext(to + 1, to + 50);
        }
      })
    }
    return loadNext(2, 50);
  }

  loadSpreadsheet = () => {
    if (!window.gapi) {
      return this.loadGoogleAPI();
    }

    console.log("Loading Spreadsheet")
    this.setState({data: null})

    this.loadUntil(this.state.start_word, this.state.end_word).then((values) => {
      console.log("got " + values.length + " values from spreadsheet");
      //    this.loadRange(2,283).then((values) => {
      // parse this out
      var partsofspeech = {}
      var id = 314;
      var words = values.map((value, i) => {
        if (!value[2] || value[2] === '') {
          // If there is no japanaese character
        //  console.log("SKipping index " + i + " " + JSON.stringify(value))
          return null;
        }
        var pos = value[1]; // parse this futher when needed
        if (!pos || pos === "") {
          // Use u for unknown part of speech
          pos = "u";
        }
        if (!partsofspeech[pos]) {
          partsofspeech[pos] = [];
        }
        var out = {
          japanese: value[2],
          english: value[4],
          pos: pos,
          id: id
        }
        id = id + 1;
        partsofspeech[pos].push(out);
        return out;
      }).filter((d) => d !== null)
      console.log("After filtering, using " + words.length)
      var data = {
        words: words,
        partsofspeech: partsofspeech
      }
      if (localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      this.setState({data: data})
    }, (err) => {
      console.log("Err: " + err);
      this.setState({err: err})
    }).done();
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
          this.setState({data: data})
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
    var changeState = (key) => {
      return (e) => {
        var s = {}
        s[key] = e.target.value;
        this.setState(s);
      }
    }

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
          Start:
          <input value={this.state.start_word} onChange={changeState('start_word')}/>
          End
          <input value={this.state.end_word} onChange={changeState('end_word')}/>
          <button onClick={this.loadSpreadsheet}>Reload</button>
          <button onClick={this.showJson}>Show JSON</button>
          <button onClick={this.flipCard}>Flip Cards</button>
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
