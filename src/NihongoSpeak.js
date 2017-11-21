import React, {Component} from 'react';
import ReactAudioPlayer from 'react-audio-player';
import jquery from 'jquery'
import Gamepad from 'react-gamepad'
import sha256 from 'js-sha256'

var seed = 1;
function myrandomnum() {
  return Math.random();

  //  var x = Math.sin(seed++) * 10000;
  //return x - Math.floor(x);
}

function random(list) {
  var index = Math.floor(myrandomnum() * list.length);
  return list[index];
}

function clean(word) {
  return word.split(',')[0];
}

var SPEECH_KEY = 'ec54122bad224b3f975e235cf8539a1b'

function gconcat(key, values) {
  return values.map((v) => v[key]
    ? clean(v[key])
    : v).join(' ') + '.';
}

function jconcat(values) {
  var values = Array.from(arguments);
  values.unshift();
  return gconcat("japanese", values);
}

function econcat(values) {
  var values = Array.from(arguments);
  values.unshift();
  return gconcat("english", values);
}

class NihongoSpeak extends Component {
  constructor(props) {
    super(props);
    this.state = {
      english: "",
      japanese:""
    }
    this.previous = [];
  }
  setwords = (s) => {
    this.previous.push(this.state);
    this.setState(s);
  }
  generate = () => {
    // Try just a random words
    var word = random(this.props.data.words);
    this.setState({english: word.english, japanese: word.japanese})
    return;

    var pos = this.props.data.partsofspeech;

    // Simple pattern: NOUN wa VERB
    var adjective = random(pos.a);
    var noun = random(pos.n);
    var verb = random(pos.v);

    var english = econcat(noun, adjective, verb);
    var japanese = jconcat(noun, " わ ", adjective, verb);

    this.setState({english, japanese})
  }
  componentDidMount() {
    this.generate();
    this.div.focus();

    this.readGamepad();
    //  jquery(window.document).keydown(this.keyPress);
  }
  readGamepad = () => {
    var gamepads = navigator.getGamepads();
    if (!this.buttonstate) {
      this.buttonstate = {};
    }
    if (!gamepads) {
      return;
    }
    for (var i = 0; i < gamepads.length; ++i) {
      var gp = gamepads[i];
      if (!gp) {
        continue;
      }
      for (var j = 0; j < gp.buttons.length; ++j) {
        if (!this.buttonstate[j]) {
          if (gp.buttons[j].pressed) {
            this.buttonPressed(j);
            this.buttonstate[j] = true;
          }
        } else {
          if (!gp.buttons[j].pressed) {
            this.buttonstate[j] = false;
          }
        }
      }
    }
    requestAnimationFrame(this.readGamepad);
  }
  keyPress = (e) => {
    if (e.key === 'r' || e.key === 'j') {
      this.playJapanese();
    } else if (e.key === 'n') {
      this.generate();
    } else if (e.key === 'e') {
      this.playEnglish();
    }
  }
  playJapanese() {
    this.audio.audioEl.play();
  }
  playEnglish() {
    this.eaudio.audioEl.play();
  }
  joyConnect = () => {
    console.log("Joystick connected")
  }
  next() {
    this.generate();
  }
  prev() {

  }
  buttonPressed = (button) => {
    console.log("Pressed " + button);
    if(button === 7 || button === 0) {
      this.playJapanese();
    } else if(button === 6 || button === 2) {
      this.playEnglish();
    } else if(button === 1) {
      this.next();
    } else if(button === 3) {
      this.prev();
    }
  }
  hash(data) {
    var h = sha256.create();
h.update(data.toString());
return h.hex();

  }
  audiofile(word) {
    return 'cache/' + this.hash(word) + ".wav"
  }
  render() {
    //var japanese_src = 'http://api.voicerss.org/?key=' + SPEECH_KEY + '&r=-4&f=16khz_16bit_mono&c:mp3&hl=ja-jp&src=' + encodeURIComponent(this.state.japanese)

    //var japanese_src = 'http://localhost:3333/speech?src=' + encodeURIComponent(this.state.japanese)
    //var english_src = 'http://localhost:3333/speech?english=1&src=' + encodeURIComponent(this.state.english)
    console.log(this.state);
    var english_src = this.audiofile(this.state.english);
    var japanese_src = this.audiofile(this.state.japanese);
    return (
      <div ref={(e) => {
        this.div = e;
      }} onKeyDown={this.keyPress} tabIndex="0">
        <h1>Speak</h1>

        <div className="stats">
          Words: {this.props.data.words.length}
        </div>
        <button onClick={this.generate}>Generate New</button>
        <div className="english">
          English: {this.state.english}
          <ReactAudioPlayer ref={(element) => {
            this.eaudio = element
          }} src={english_src} controls/>
        </div>
        <div className="japanese">
          Japanese: {this.state.japanese}
          <ReactAudioPlayer ref={(element) => {
            this.audio = element
          }} autoPlay src={japanese_src} controls/>
        </div>
      </div>
    );
    //        <pre>{JSON.stringify(this.props.data,null,' ')}</pre>

  }

}

export default NihongoSpeak;
