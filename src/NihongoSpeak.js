import React, {Component} from 'react';
import ReactAudioPlayer from 'react-audio-player';
import sha256 from 'js-sha256'

class WordPair extends React.PureComponent {
  audiofile(word) {
    return 'cache/' + this.hash(word) + ".mp3"
  }
  playJapanese = () => {
    this.audio.audioEl.play();
  }
  playEnglish = () => {
    this.eaudio.audioEl.play();
  }
  hash(data) {
    var h = sha256.create();
    h.update(data.toString());
    return h.hex();
  }
  componentWillReceiveProps(nextProps) {
    if(nextProps.autoPlay && this.props.autoPlay !== nextProps.autoPlay && this.audio) {
      this.audio.audioEl.play();
    }
  }
  render() {
    var audioplayers = null;
    var word = this.props.word;
    //console.log(JSON.stringify(this.props));
    if (this.props.preload) {
      audioplayers = (
        <div className="players">
          <div className="english">
            English: {word.english}
            <ReactAudioPlayer preload="auto" ref={(element) => {
              this.eaudio = element
            }} src={this.audiofile(word.english)} controls/>
          </div>
          <div className="japanese">
            Japanese: {word.japanese}
            <ReactAudioPlayer preload="auto" ref={(element) => {
              this.audio = element
            }} autoPlay={this.props.autoPlay} src={this.audiofile(word.japanese)} controls/>
          </div>
        </div>
      )
    }
    return (
      <div className="wordpair">
        <div>
          <button onClick={this.playJapanese}>Japanese</button>
          <button onClick={this.playEnglish}>English</button>
        </div>
        {audioplayers}
      </div>
    )
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

//var seed = 1;
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

function gconcat(key, values) {
  return values.map((v) => v[key]
    ? clean(v[key])
    : v).join(' ') + '.';
}

function jconcat(values) {
  values = Array.from(arguments);
  values.unshift();
  return gconcat("japanese", values);
}

function econcat(values) {
  values = Array.from(arguments);
  values.unshift();
  return gconcat("english", values);
}

class NihongoSpeak extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      wordlist: []
    }
  }

  componentWillReceiveProps(nextProps) {
    this.shuffle();
  }

  shuffle = () => {
    if (!this.props.data || !this.props.data.words) {
      return;
    }
    var wordlist = this.props.data.words.slice();
    shuffleArray(wordlist);
    this.setState({wordlist});
  }

  generate = () => {
    // Try just a random words
    if (this.state.wordlist.length === 0) {
      this.shuffle();
    }
    var wordlist = this.state.wordlist.slice();
    wordlist.shift();
    this.setState({wordlist})
    return;

    // var pos = this.props.data.partsofspeech;
    //
    // // Simple pattern: NOUN wa VERB
    // var adjective = random(pos.a);
    // var noun = random(pos.n);
    // var verb = random(pos.v);
    //
    // var english = econcat(noun, adjective, verb);
    // var japanese = jconcat(noun, " わ ", adjective, verb);
    //
    // this.setState({english, japanese})
  }
  componentDidMount() {
    if (!this.props.data || !this.props.data.words) {
      return;
    }
    this.shuffle();
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
    if (e.key === 'j') {
      this.playJapanese();
    } else if (e.key === 'n') {
      this.generate();
    } else if (e.key === 'r') {
      this.reinsert();
    } else if (e.key === 's') {
      this.shuffle();
    } else if (e.key === 'e') {
      this.playEnglish();
    }
  }

  joyConnect = () => {
    console.log("Joystick connected")
  }
  next() {
    this.generate();
  }
  reinsert = () => {
    var newlist = this.state.wordlist.slice();
    var word = newlist.shift();

    newlist.splice(randomindex(newlist.length), 0, word);
    this.setState({wordlist: newlist})
  }
  buttonPressed = (button) => {
    this.setState({button: button})
    console.log("Pressed " + button);
    if (button === 7 || button === 0) {
      this.playJapanese();
    } else if (button === 6 || button === 3) {
      this.playEnglish();
    } else if (button === 1) {
      this.next();
    } else if (button === 2 || button === 4 || button === 5) {
      this.reinsert();
    }
  }
  playEnglish = () => {
    this.firstword.playEnglish();
  }
  playJapanese = () => {
    this.firstword.playJapanese();
  }
  audiofile(word) {
    return 'cache/' + this.hash(word) + ".mp3"
  }
  render() {
    //var japanese_src = 'http://api.voicerss.org/?key=' + SPEECH_KEY + '&r=-4&f=16khz_16bit_mono&c:mp3&hl=ja-jp&src=' + encodeURIComponent(this.state.japanese)

    //var japanese_src = 'http://localhost:3333/speech?src=' + encodeURIComponent(this.state.japanese)
    //var english_src = 'http://localhost:3333/speech?english=1&src=' + encodeURIComponent(this.state.english)
    var wordlist = this.state.wordlist;
    if (wordlist.length === 0) {
      return (
        <div ref={(e) => {
          this.div = e;
        }}>No words</div>
      );
    }

    /*

    var word = this.state.wordlist[0];
    var nextword = this.state.wordlist[1];
    var english_src = this.audiofile(word.english);
    var japanese_src = this.audiofile(word.japanese);

    var next_preload = null;
    if(nextword) {
      var english_src_next = this.audiofile(nextword.english);
      var japanese_src_next = this.audiofile(nextword.japanese);
      next_preload = (
        <div>
          <ReactAudioPlayer preload="auto" src={english_src_next} />
          <ReactAudioPlayer preload="auto" src={japanese_src_next} />
         </div>
	 )
    }
    */

    // Generate the wordlist
    var wordpairs = wordlist.map((word, index) => {
      if (index === 0) {
        return (<WordPair ref={(element) => {
          this.firstword = element
        }} key={word.id} word={word} autoPlay={true} preload={true}/>)
      } else {
        return (<WordPair key={word.id} word={word} preload={index < 4}/>)
      }
    })

    /*
    <div>
      <button onClick={this.playJapanese}>Japanese</button>
      <button onClick={this.playEnglish}>English</button>
    </div>
    <div className="english">
      English: {word.english}
      <ReactAudioPlayer preload="auto" ref={(element) => {
        this.eaudio = element
      }} src={english_src} controls/>
    </div>
    <div className="japanese">
      Japanese: {word.japanese}
      <ReactAudioPlayer preload="auto" ref={(element) => {
        this.audio = element
      }} autoPlay src={japanese_src} controls/>
    </div>
    */

    return (
      <div ref={(e) => {
        this.div = e;
      }} onKeyDown={this.keyPress} tabIndex="0">
        <div>
          <button onClick={this.generate}>Next</button>
          <button onClick={this.shuffle}>Shuffle</button>
          <button onClick={this.reinsert}>Reinsert</button>
        </div>
        <div>
          <button onClick={this.playJapanese}>Japanese</button>
          <button onClick={this.playEnglish}>English</button>
        </div>

        <hr/>

        <p>
          This is meant to be used without looking at the screen. To use keyboard shortcuts, click on this text first with your mouse cursor, and use the following keyboard keys.
        </p>
        <p>
          Due to restrictions on a mobile devices, you may have to click the play button on each audio control once to get the audio to work.
        </p>
        <ul>
          <li>n - Next word. Bury this card and go to the next word</li>
          <li>e - Play the English translation</li>
          <li>j - Play the Japanese translation</li>
          <li>s - Reshuffle the deck. Inserts all cards</li>
          <li>r - Reinsert this card randomly in the deck</li>
        </ul>

        <h2>Word List</h2>
        <div className="stats">
          Words Remaining: {wordlist.length}
        </div>
        <div className="wordlist">
          {wordpairs}
        </div>
      </div>
    );
    //        <pre>{JSON.stringify(this.props.data,null,' ')}</pre>

  }

}

export default NihongoSpeak;
