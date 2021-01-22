import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {TextInput} from 'react-native-paper';
import {Button} from 'react-native-paper';
import { connect } from 'react-redux';

function LoginScreen(props) {
  const { dispatch,userId } = props;
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.heading}>Enter your id</Text>
        <TextInput
          label="Your  ID"
          onChangeText={(text)=>dispatch({type:'user/changeUserId',payload:text})}
          mode="outlined"
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={()=>dispatch({type:'user/login'})}
          style={styles.btn}
          contentStyle={styles.btnContent}
          disabled={userId.length === 0}>
          Login
        </Button>
      </View>
    </View>
  );
}
const mapStateToProps = ({
  user:{userId}
}) => ({
  userId
});
export default connect(mapStateToProps)(LoginScreen);
const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    height: 60,
    marginBottom: 10,
  },
  btn: {
    height: 60,
    alignItems: 'stretch',
    justifyContent: 'center',
    fontSize: 18,
  },
  btnContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
});
