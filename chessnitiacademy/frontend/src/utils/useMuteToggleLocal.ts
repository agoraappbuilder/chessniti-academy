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
import {useLocalUserInfo, useRtc} from 'customization-api';
import {useContext, useEffect, useRef, useState} from 'react';

import {ToggleState} from '../../agora-rn-uikit/src/Contexts/PropsContext';
import {isMobileUA, isWebInternal} from './common';
import {AppState} from 'react-native';
import {SdkMuteQueueContext} from '../components/SdkMuteToggleListener';

export enum MUTE_LOCAL_TYPE {
  audio,
  video,
}
/**
 * Returns an asynchronous function to toggle muted state of the given track type for the local user.
 */
function useMuteToggleLocal() {
  const {RtcEngine, dispatch} = useRtc();
  const local = useLocalUserInfo();

  const {videoMuteQueue, audioMuteQueue} = useContext(SdkMuteQueueContext);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const isCamON = useRef(local.video);

  useEffect(() => {
    if ($config.AUDIO_ROOM || !isMobileUA()) return;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    // console.log(`Video State  ${local.video} in Mode  ${appStateVisible}`);
    if (appStateVisible === 'background') {
      isCamON.current = local.video;
      if (isCamON.current) {
        isWebInternal()
          ? RtcEngine.muteLocalVideoStream(true)
          : RtcEngine.enableLocalVideo(false);

        dispatch({
          type: 'LocalMuteVideo',
          value: [0],
        });
      }
    }
    if (appStateVisible === 'active' && isCamON.current) {
      isWebInternal()
        ? RtcEngine.muteLocalVideoStream(false)
        : RtcEngine.enableLocalVideo(true);
      dispatch({
        type: 'LocalMuteVideo',
        value: [1],
      });
    }
  }, [appStateVisible]);

  const toggleMute = async (
    type: MUTE_LOCAL_TYPE,
    _action?: ToggleState,
    _fromSdk?: boolean,
  ) => {
    const queueRef =
      type === MUTE_LOCAL_TYPE.video ? videoMuteQueue : audioMuteQueue;

    const handleQueue = async () => {
      if (queueRef.current.length > 0) {
        const queueItem = queueRef.current.shift();
        try {
          await toggleMute(type, queueItem.action, true);
          queueItem.resolveQueued();
        } catch (e) {
          queueItem.rejectQueued(e);
        }
      }
    };

    switch (type) {
      case MUTE_LOCAL_TYPE.audio:
        let localAudioState = local.audio;
        // Don't do anything if it is in a transitional state
        if (
          localAudioState === ToggleState.enabled ||
          localAudioState === ToggleState.disabled
        ) {
          if (localAudioState !== _action) {
            // Disable UI
            dispatch({
              type: 'LocalMuteAudio',
              value: [
                localAudioState === ToggleState.enabled
                  ? ToggleState.disabling
                  : ToggleState.enabling,
              ],
            });

            try {
              await RtcEngine.muteLocalAudioStream(
                localAudioState === ToggleState.enabled,
              );
              // Enable UI
              dispatch({
                type: 'LocalMuteAudio',
                value: [
                  localAudioState === ToggleState.enabled
                    ? ToggleState.disabled
                    : ToggleState.enabled,
                ],
              });
              handleQueue();
            } catch (e) {
              dispatch({
                type: 'LocalMuteAudio',
                value: [localAudioState],
              });
              handleQueue();
              if (_fromSdk) {
                throw e;
              } else {
                console.error('Error toggling audio', e);
              }
            }
          } else {
            handleQueue();
          }
        }
        break;
      case MUTE_LOCAL_TYPE.video:
        const localVideoState = local.video;
        // Don't do anything if it is in a transitional state
        if (
          localVideoState === ToggleState.enabled ||
          localVideoState === ToggleState.disabled
        ) {
          // Disable UI
          if (localVideoState !== _action) {
            dispatch({
              type: 'LocalMuteVideo',
              value: [
                localVideoState === ToggleState.enabled
                  ? ToggleState.disabling
                  : ToggleState.enabling,
              ],
            });

            try {
              //enableLocalVideo not available on web
              isWebInternal()
                ? await RtcEngine.muteLocalVideoStream(
                    localVideoState === ToggleState.enabled ? true : false,
                  )
                : await RtcEngine.enableLocalVideo(
                    localVideoState === ToggleState.enabled ? false : true,
                  );

              // Enable UI
              dispatch({
                type: 'LocalMuteVideo',
                value: [
                  localVideoState === ToggleState.enabled
                    ? ToggleState.disabled
                    : ToggleState.enabled,
                ],
              });
              handleQueue();
            } catch (e) {
              dispatch({
                type: 'LocalMuteVideo',
                value: [localVideoState],
              });
              handleQueue();
              if (_fromSdk) {
                throw e;
              } else {
                console.error('Error toggling video', e);
              }
            }
          } else {
            handleQueue();
          }
        }
        break;
    }
  };

  return toggleMute;
}

export default useMuteToggleLocal;
