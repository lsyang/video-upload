var React = require('react');

var Platform = React.Platform;
import {
  Text,
  View,
  StyleSheet,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

var Root = React.createClass({
  render: function() {
    return (
      <View style={styles.container}>
        <Text>Hello QQ Clara</Text>
      </View>
    );
  },
});

module.exports = Root;
