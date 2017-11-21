import React, {Component} from 'react';
import ReactAudioPlayer from 'react-audio-player';
import jquery from 'jquery'
import Gamepad from 'react-gamepad'
import sha256 from 'js-sha256'

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


var seed = 1;
function myrandomnum() {
  return Math.random();

  //  var x = Math.sin(seed++) * 10000;
  //return x - Math.floor(x);
}

function randomindex(max) {
  return Math.floor(myrandomnum() * max);
}

function random(list) {
  var index = randomindex(list.length);
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
      word: {
      english: "",
      japanese:""
      }
    }
    this.wordlist = [];
  }
  setword = (word) => {
    this.setState({word: word});
  }

  componentWillReceiveProps(nextProps) {
    this.shuffle();
  }
  
  shuffle = () => {
      this.wordlist = this.props.data.words.slice();
      shuffleArray(this.wordlist);
      this.generate();
  }
  
  generate = () => {
    // Try just a random words
    if(!this.wordlist || this.wordlist.length === 0) {
      this.shuffle();
    }
    var word = this.wordlist.pop();
    this.setword(word);
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
  reinsert = () => {
    this.wordlist.splice(randomindex(this.wordlist.length),0,this.state.word);
    this.generate();
  }
  buttonPressed = (button) => {
    this.setState({button: button})
    console.log("Pressed " + button);
    if(button === 7 || button === 0) {
      this.playJapanese();
    } else if(button === 6 || button === 3) {
      this.playEnglish();
    } else if(button === 1) {
      this.next();
    } else if(button === 2) {
      this.reinsert();
    }
  }
  hash(data) {
    var h = sha256.create();
h.update(data.toString());
return h.hex();

  }
  audiofile(word) {
    return 'cache/' + this.hash(word) + ".mp3"
  }
  render() {
    //var japanese_src = 'http://api.voicerss.org/?key=' + SPEECH_KEY + '&r=-4&f=16khz_16bit_mono&c:mp3&hl=ja-jp&src=' + encodeURIComponent(this.state.japanese)

    //var japanese_src = 'http://localhost:3333/speech?src=' + encodeURIComponent(this.state.japanese)
    //var english_src = 'http://localhost:3333/speech?english=1&src=' + encodeURIComponent(this.state.english)
    var word = this.state.word;
    var english_src = this.audiofile(word.english);
    var japanese_src = this.audiofile(word.japanese);
    return (
      <div ref={(e) => {
        this.div = e;
      }} onKeyDown={this.keyPress} tabIndex="0">
        <h1>Speak</h1>
        {this.state.button}
        <div className="stats">
          Words: {this.wordlist.length}
        </div>
        <button onClick={this.generate}>Generate New</button>
        <button onClick={this.shuffle}>Shuffle</button>
        <button onClick={this.reinsert}>Reinsert</button>
        <div className="english">
          English: {word.english}
          <ReactAudioPlayer ref={(element) => {
            this.eaudio = element
          }} src={english_src} controls/>
        </div>
        <div className="japanese">
          Japanese: {word.japanese}
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
