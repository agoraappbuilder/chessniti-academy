/*
********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
 AppBuilder and all associated components, source code, APIs, services, and documentation 
 (the “Materials”) are owned by Agora Lab, Inc. and its licensors. The Materials may not be 
 accessed, used, modified, or distributed for any purpose without a license from Agora Lab, Inc.  
 Use without a license or in violation of any license terms and conditions (including use for 
 any purpose competitive to Agora Lab, Inc.’s business) is strictly prohibited. For more 
 information visit https://appbuilder.agora.io. 
*********************************************
*/
import React from 'react';
import {StyleSheet, View, Text, ActivityIndicator} from 'react-native';

const Loading = (props: {text: string}) => {
  const {text} = props;

  return (
    <View style={styles.overlay}>
      <Text style={styles.loadingText}>{text}</Text>
      <ActivityIndicator size="large" color={$config.SECONDARY_ACTION_COLOR} />
    </View>
  );
};
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 15,
  },
  loadingText: {
    alignSelf: 'center',
    fontSize: 18,
    color: $config.SECONDARY_ACTION_COLOR,
    marginBottom: 10,
  },
});

export default Loading;
