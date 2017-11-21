const express = require('express')
const app = express()
var http = require('http');
const querystring = require('querystring');
const fs = require('fs');
var Q = require('q');
const crypto = require('crypto');

function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

app.get('/speech', (req, res) => {
  console.log(req.query);

  var words = req.query.src.split(' ');

  getWord(req.query.src,req.query.english !== '1').then((data) => {
    console.log("Sending: " + data.length);
    res.header('Content-Type', 'audio/wav')
    res.send(data);
  })
})

function getWord(word,japanese) {
  var cachefile = 'cache/' + hash(word) + ".wav";
  console.log(cachefile)
  if (fs.existsSync(cachefile)) {
    console.log("Getting cache for word: " + cachefile);
    return Q(fs.readFileSync(cachefile));
  }


  var deferred = Q.defer();

  var rand = hash(Math.random().toString());
  console.log(rand);

  const {spawn} = require('child_process');
  fs.writeFileSync(rand + ".txt", word.toString());
  var args = [rand];
  if(japanese) {
    args.push('1');
  }
  const tts = spawn('./SpeechTest.exe',args);
  tts.on('close', () => {
    console.log("Done with tts");
    var data = fs.readFileSync(rand + ".wav")
    deferred.resolve(data);
    fs.unlinkSync(rand + '.wav');
    fs.unlinkSync(rand + '.txt');
    fs.writeFileSync(cachefile, data);
  })
  return deferred.promise;

  const SPEECH_KEY = 'ec54122bad224b3f975e235cf8539a1b'
  var params = {
    key: SPEECH_KEY,
    r: -4,
    f: '16khz_16bit_mono',
    hl: 'ja-jp',
    src: word
  }

  var urlparams = Object.keys(params).map((key) => {
    return key + "=" + querystring.escape(params[key]);
  }).join('&');
  console.log(urlparams);

  http.get({
    hostname: 'api.voicerss.org',
    port: 80,
    path: '/?' + urlparams
  }, (res) => {
    let data = [];
    res.on('data', (d) => {
      data.push(d);
    });
    res.on('end', () => {
      data = Buffer.concat(data);
      console.log("Done getting: " + word);
      console.log(data.length);
      fs.writeFileSync(cachefile, data);
      deferred.resolve(data);
    })
  });
  return deferred.promise;
}

app.listen(3333, () => console.log('Speech proxy app listening on port 3333!'))
