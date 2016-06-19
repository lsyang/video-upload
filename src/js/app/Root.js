var React = require('react');

var Platform = React.Platform;
import {
  StyleSheet,
  AppRegistry,
  View,
  Animated,
  StatusBarIOS,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  NavigatorIOS
} from 'react-native';

var screen    = require('Dimensions').get('window');
var Recorder  = require('react-native-screcorder');
var Video = require('react-native-video').default;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  wrapper: {
		flex: 1,
    height: 500,
	},
	barWrapper: {
		width: screen.width,
		height: 10,
		backgroundColor: "black",
		opacity: 0.3
	},

	barGauge: {
		width: 0,
		height: 10,
		backgroundColor: "red"
	},

	controls: {
		position: 'absolute',
		bottom: 50,
		width: screen.width,
		flexDirection: 'row',
		flexWrap: "wrap",
		justifyContent: 'space-around',
		alignItems: 'center',
		backgroundColor: 'transparent',
		opacity: 0.6
	},

	controlBtn: {
		backgroundColor: "white",
		padding: 20,
		opacity: 0.8,
		borderRadius: 5,
		marginBottom: 10
	},

	infoBtn: {
		backgroundColor: "#2ecc71",
		opacity: 0.8,
		padding: 10,
		position: 'absolute',
		top: 20,
		right: 20,
		opacity: 0.7,
		borderRadius: 5
	},

	infoBtnText: {
		color: "white"
	}
});

/*********** RECORDER COMPONENT ***********/

var Record = React.createClass({

  getInitialState: function() {
    return {
      device: "front",
      recording: false,
      nbSegments: 0,
      barPosition: new Animated.Value(0),
      currentDuration: 0,
      maxDuration: 3000,
      limitReached: false,
      config: {
        flashMode: Recorder.constants.SCFlashModeOff,
        video: {
          enabled: true,
          format: 'MPEG4',
          bitrate: 2000000,
          timescale: 1
        },
      },
    }
  },

  componentDidMount: function() {
    StatusBarIOS.setHidden(true, "slide");
  },

  /*
   *  PRIVATE METHODS
   */

  startBarAnimation: function() {
    this.animRunning = true;
    this.animBar = Animated.timing(
      this.state.barPosition,
      {
        toValue: screen.width,
        duration: this.state.maxDuration - this.state.currentDuration
      }
    );
    this.animBar.start(() => {
      // The video duration limit has been reached
      if (this.animRunning) {
        this.finish();
      }
    });
  },

  resetBarAnimation: function() {
    Animated.spring(this.state.barPosition, {toValue: 0}).start();
  },

  stopBarAnimation: function() {
    this.animRunning = false;
    if (this.animBar)
      this.animBar.stop();
  },

  /*
   *  PUBLIC METHODS
   */

  record: function() {
    if (this.state.limitReached) return;
    this.refs.recorder.record();
    this.startBarAnimation();
    this.setState({recording: true});
  },

  pause: function(limitReached) {
    if (!this.state.recording) return;
    this.refs.recorder.pause();
    this.stopBarAnimation();
    this.setState({recording: false, nbSegments: ++this.state.nbSegments});
  },

  finish: function() {
    this.stopBarAnimation();
    this.refs.recorder.pause();
    this.setState({recording: false, limitReached: true, nbSegments: ++this.state.nbSegments});
  },

  reset: function() {
    this.resetBarAnimation();
    this.refs.recorder.removeAllSegments();
    this.setState({
      recording: false,
      nbSegments: 0,
      currentDuration: 0,
      limitReached: false
    });
  },

  preview: function() {
    this.refs.recorder.save((err, url) => {
      console.log('url = ', url);
      this.props.navigator.push({component: Preview, passProps: {video: url}});
    });
  },

  setDevice: function() {
    var device = (this.state.device == "front") ? "back" : "front";
    this.setState({device: device});
  },

  toggleFlash: function() {
    if (this.state.config.flashMode == Recorder.constants.SCFlashModeOff) {
      this.state.config.flashMode = Recorder.constants.SCFlashModeLight;
    } else {
      this.state.config.flashMode = Recorder.constants.SCFlashModeOff;
    }
    this.setState({config: this.state.config});
  },

  /*
   *  EVENTS
   */

  onRecordDone: function() {
    this.setState({nbSegments: 0});
  },

  onNewSegment: function(segment) {
    console.log('segment = ', segment);
    this.state.currentDuration += segment.duration * 1000;
  },

  /*
   *  RENDER METHODS
   */

  renderBar: function() {
    return (
      <View style={styles.barWrapper}>
        <Animated.View style={[styles.barGauge, {width: this.state.barPosition}]}/>
      </View>
    );
  },

  render: function() {
    var bar     = this.renderBar();
    var control = null;

    if (!this.state.limitReached) {
      control = (
        <TouchableOpacity onPressIn={this.record} onPressOut={this.pause} style={styles.controlBtn}>
          <Text>Record</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <Recorder
          ref="recorder"
          config={this.state.config}
          device={this.state.device}
          onNewSegment={this.onNewSegment}
          style={styles.wrapper}>
          {bar}
          <View style={styles.infoBtn}>
            <Text style={styles.infoBtnText}>{this.state.nbSegments}</Text>
          </View>
          <View style={styles.controls}>
            {control}
            <TouchableOpacity onPressIn={this.reset} style={styles.controlBtn}>
              <Text>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.preview} style={styles.controlBtn}>
              <Text>Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.toggleFlash} style={styles.controlBtn}>
              <Text>Flash</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={this.setDevice} style={styles.controlBtn}>
              <Text>Switch</Text>
            </TouchableOpacity>
          </View>
        </Recorder>
      </View>
    );
  }

});

/*********** PREVIEW COMPONENT ***********/

var Preview = React.createClass({

  getInitialState: function() {
    return {
      paused: false
    };
  },

  goBack: function() {
    this.setState({paused: true});
    this.props.navigator.pop();
  },

  render: function() {
    return (
      <TouchableWithoutFeedback onPress={this.goBack}>
        <Video
          source={{uri: this.props.video}}
          style={styles.wrapper}
          muted={false}
          resizeMode="cover"
          paused={this.state.paused}
          repeat={true}/>
      </TouchableWithoutFeedback>
    );
  }

});

var Root = React.createClass({
  getInitialState: function() {
    return {
      rate: 1,
      volume: 1,
      muted: false,
      resizeMode: 'contain',
      duration: 0.0,
      currentTime: 0.0,
      controls: false,
      paused: true,
      skin: 'custom',
    }
  },

  render: function() {
    return (
      <View>
        <Video
        source={{uri: 'file:///private/var/mobile/Containers/Data/Application/5573A940-EA4E-4625-A17F-66D9B8858E66/tmp/mBcG2v7dExGZ-SCVideo.3.mp4'}}
        style={styles.fullScreen}
        rate={this.state.rate}
        paused={this.state.paused}
        volume={this.state.volume}
        muted={this.state.muted}
        resizeMode={this.state.resizeMode}
        onLoad={this.onLoad}
        onProgress={this.onProgress}
        onEnd={() => { AlertIOS.alert('Done!') }}
        repeat={true}
      />
        <Record></Record>
      </View>
    );
  },
});

module.exports = Root;
